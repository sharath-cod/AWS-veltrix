package com.ruralassistant.app.domain.model

enum class AppLanguage(val code: String, val nativeName: String) {
    ENGLISH("en", "English"),
    KANNADA("kn", "ಕನ್ನಡ"),
    HINDI("hi", "हिन्दी");

    companion object {
        fun fromCode(code: String?): AppLanguage = entries.firstOrNull { it.code == code } ?: ENGLISH
    }
}
