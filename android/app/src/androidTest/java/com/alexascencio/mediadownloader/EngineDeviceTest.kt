package com.alexascencio.mediadownloader
import android.app.Application
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File

@RunWith(AndroidJUnit4::class)
class EngineDeviceTest {
    @Test fun motoresNativosConvertemVideoMp3EWav() {
        val app=InstrumentationRegistry.getInstrumentation().targetContext.applicationContext as Application
        app.getSharedPreferences("media-downloader",0).edit().putLong("engine-update",System.currentTimeMillis()).commit()
        val vm=DownloadViewModel(app)
        val deadline=System.currentTimeMillis()+90000
        while(vm.estado.value is Estado.Preparando && System.currentTimeMillis()<deadline)Thread.sleep(200)
        assertEquals(Estado.Pronto,vm.estado.value)
        assertTrue(File(app.applicationInfo.nativeLibraryDir,"libqjs.so").length()>100000)
        val results=File(app.filesDir,"device-test").apply{mkdirs()}
        for(perfil in listOf(Perfil.VIDEO_MAX,Perfil.AUDIO_MP3,Perfil.AUDIO_WAV)) {
            val dir=File(app.cacheDir,"test-${perfil.name}").apply{mkdirs()}
            val source=File(dir,"source.mp4")
            InstrumentationRegistry.getInstrumentation().context.assets.open("clip.mp4").use{input->source.outputStream().use{input.copyTo(it)}}
            val output=vm.converter(source,perfil,dir)
            assertTrue(output.length()>100)
            val native=File(app.applicationInfo.nativeLibraryDir,"libffmpeg.so")
            val builder=ProcessBuilder(native.absolutePath,"-hide_banner","-i",output.absolutePath,"-f","null","-").redirectErrorStream(true)
            val base=File(app.noBackupFilesDir,"youtubedl-android/packages")
            builder.environment()["LD_LIBRARY_PATH"]=listOf("python","ffmpeg","aria2c").joinToString(":"){File(base,"$it/usr/lib").absolutePath}
            val process=builder.start();val diagnostic=process.inputStream.bufferedReader().readText()
            assertEquals(diagnostic,0,process.waitFor())
            assertTrue(diagnostic,when(perfil){Perfil.AUDIO_MP3->diagnostic.contains("Audio: mp3");Perfil.AUDIO_WAV->diagnostic.contains("Audio: pcm_s24le");else->diagnostic.contains("Video: h264") && diagnostic.contains("Audio: aac")})
            output.copyTo(File(results,output.name),overwrite=true)
            File(results,"${perfil.name}.txt").writeText(diagnostic)
            dir.deleteRecursively()
        }
    }
}
