package com.ruralassistant.app.domain.repository

import com.ruralassistant.app.domain.model.AppLanguage
import com.ruralassistant.app.domain.model.UserPreferences
import kotlinx.coroutines.flow.Flow

interface SettingsRepository {
    val preferences: Flow<UserPreferences>
    suspend fun setLanguage(language: AppLanguage)
    suspend fun completeOnboarding()
    suspend fun setVoiceEnabled(enabled: Boolean)
    suspend fun setLargeText(enabled: Boolean)
}
