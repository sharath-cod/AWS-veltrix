package com.ruralassistant.app.data.repository

import com.ruralassistant.app.data.local.datastore.UserPreferencesDataStore
import com.ruralassistant.app.domain.model.AppLanguage
import com.ruralassistant.app.domain.model.UserPreferences
import com.ruralassistant.app.domain.repository.SettingsRepository
import kotlinx.coroutines.flow.Flow

class SettingsRepositoryImpl(private val store: UserPreferencesDataStore) : SettingsRepository {
    override val preferences: Flow<UserPreferences> = store.preferences
    override suspend fun setLanguage(language: AppLanguage) = store.setLanguage(language)
    override suspend fun completeOnboarding() = store.completeOnboarding()
    override suspend fun setVoiceEnabled(enabled: Boolean) = store.setVoiceEnabled(enabled)
    override suspend fun setLargeText(enabled: Boolean) = store.setLargeText(enabled)
}
