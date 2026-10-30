package com.ruralassistant.app.utils

import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import com.ruralassistant.app.domain.model.AppLanguage

object LocaleHelper {
    /** Switches the app language at runtime (recreates the activity). Call on the main thread. */
    fun apply(language: AppLanguage) {
        AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(language.code))
    }
}
