package com.ruralassistant.app.domain.model

data class UserPreferences(
    val language: AppLanguage = AppLanguage.ENGLISH,
    val firstLaunch: Boolean = true,
    val onboardingCompleted: Boolean = false,
    val voiceEnabled: Boolean = true,
    val largeText: Boolean = false,
)
