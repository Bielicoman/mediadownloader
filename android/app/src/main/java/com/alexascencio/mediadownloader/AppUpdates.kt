package com.alexascencio.mediadownloader

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import org.json.JSONArray
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest

data class AppUpdate(val version:String,val file:File)

object AppUpdates {
    private const val PREFIX="https://github.com/Bielicoman/mediadownloader/releases/download/"
    fun compare(a:String,b:String):Int {
        val x=a.split('.').map { it.toIntOrNull() ?: 0 };val y=b.split('.').map { it.toIntOrNull() ?: 0 }
        for(i in 0..2){val c=(x.getOrElse(i){0}).compareTo(y.getOrElse(i){0});if(c!=0)return c};return 0
    }
    private fun open(url:String):HttpURLConnection {
        require(url.startsWith("https://"));return (URL(url).openConnection() as HttpURLConnection).apply {
            connectTimeout=15000;readTimeout=60000;setRequestProperty("User-Agent","MediaDownloader-Android")
        }
    }
    @Suppress("DEPRECATION")
    fun checkAndDownload(context:Context):AppUpdate? {
        val installed=context.packageManager.getPackageInfo(context.packageName,0)
        val connection=open("https://api.github.com/repos/Bielicoman/mediadownloader/releases?per_page=30")
        val releases=try{connection.inputStream.bufferedReader().use { JSONArray(it.readText()) }}finally{connection.disconnect()}
        val candidates=(0 until releases.length()).map { releases.getJSONObject(it) }.filter {
            !it.optBoolean("draft")&&!it.optBoolean("prerelease")&&Regex("android-v\\d+\\.\\d+\\.\\d+").matches(it.optString("tag_name"))
        }.sortedWith { a,b->compare(b.getString("tag_name").removePrefix("android-v"),a.getString("tag_name").removePrefix("android-v")) }
        val release=candidates.firstOrNull() ?: return null
        val version=release.getString("tag_name").removePrefix("android-v")
        if(compare(version,installed.versionName.orEmpty())<=0)return null
        val abi=if(Build.SUPPORTED_ABIS.contains("arm64-v8a"))"arm64" else if(Build.SUPPORTED_ABIS.contains("armeabi-v7a"))"arm32" else "universal"
        val assets=release.getJSONArray("assets")
        val asset=(0 until assets.length()).map { assets.getJSONObject(it) }.firstOrNull { it.optString("name")=="MediaDownloader-Android-$abi.apk" } ?: return null
        val url=asset.getString("browser_download_url");require(url.startsWith(PREFIX)&&!url.contains(".."))
        val digest=asset.optString("digest").removePrefix("sha256:");require(Regex("[a-fA-F0-9]{64}").matches(digest))
        val folder=File(context.cacheDir,"updates").apply { mkdirs() };val file=File(folder,"MediaDownloader-$version.apk")
        fun hash()=MessageDigest.getInstance("SHA-256").run { file.inputStream().use { input->val bytes=ByteArray(65536);while(true){val n=input.read(bytes);if(n<0)break;update(bytes,0,n)} };this.digest().joinToString(""){"%02x".format(it)} }
        if(!file.isFile||!hash().equals(digest,true)){
            val download=open(url)
            try{download.inputStream.use { input->file.outputStream().use { output->val bytes=ByteArray(65536);var total=0L;while(true){val n=input.read(bytes);if(n<0)break;total+=n;require(total<=256L*1024*1024);output.write(bytes,0,n)} } }}catch(e:Exception){file.delete();throw e}finally{download.disconnect()}
        }
        require(hash().equals(digest,true)){"O pacote de atualização não passou na verificação SHA-256."}
        val flags=if(Build.VERSION.SDK_INT>=28)PackageManager.GET_SIGNING_CERTIFICATES else PackageManager.GET_SIGNATURES
        val current=context.packageManager.getPackageInfo(context.packageName,flags)
        val archive=requireNotNull(context.packageManager.getPackageArchiveInfo(file.absolutePath,flags))
        require(archive.packageName==context.packageName&&archive.versionName==version)
        val currentSignatures=if(Build.VERSION.SDK_INT>=28)current.signingInfo!!.apkContentsSigners else current.signatures
        val archiveSignatures=if(Build.VERSION.SDK_INT>=28)archive.signingInfo!!.apkContentsSigners else archive.signatures
        require(currentSignatures!!.map { it.toCharsString() }.toSet()==archiveSignatures!!.map { it.toCharsString() }.toSet()){ "A assinatura do novo APK não corresponde à instalação atual." }
        return AppUpdate(version,file)
    }
}
