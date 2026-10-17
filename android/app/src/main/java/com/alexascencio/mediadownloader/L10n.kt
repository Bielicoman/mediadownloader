package com.alexascencio.mediadownloader

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import org.json.JSONObject
import java.util.Locale

object L10n {
    val languages=linkedMapOf("pt" to "Português (Brasil)","en" to "English","es" to "Español","fr" to "Français · Beta","de" to "Deutsch · Beta","it" to "Italiano · Beta")
    var language by mutableStateOf("pt")
        private set
    private var strings=JSONObject()
    fun initialize(context:Context){strings=JSONObject(context.assets.open("i18n-strings.json").bufferedReader(Charsets.UTF_8).use{it.readText()});language=context.getSharedPreferences("media-language",Context.MODE_PRIVATE).getString("language",null)?:Locale.getDefault().language.let{if(languages.containsKey(it))it else "en"}}
    fun select(context:Context,value:String){if(!languages.containsKey(value))return;context.getSharedPreferences("media-language",Context.MODE_PRIVATE).edit().putString("language",value).apply();language=value}
    fun t(value:String):String {val index=languages.keys.indexOf(language);val row=strings.optJSONArray(value);return if(row!=null&&index>=0)row.optString(index,value)else value}
}
