package com.ruralassistant.app.data.local.datastore

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.ruralassistant.app.domain.model.AppLanguage
import com.ruralassistant.app.domain.model.UserPreferences
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException

private val Context.userPrefsStore: DataStore<Preferences> by preferencesDataStore(name = "user_preferences")

class UserPreferencesDataStore(private val context: Context) {

    private object Keys {
        val LANGUAGE = stringPreferencesKey("language")
        val FIRST_LAUNCH = booleanPreferencesKey("first_launch")
        val ONBOARDING_COMPLETED = booleanPreferencesKey("onboarding_completed")
        val VOICE_ENABLED = booleanPreferencesKey("voice_enabled")
        val LARGE_TEXT = booleanPreferencesKey("large_text")
    }

    val preferences: Flow<UserPreferences> = context.userPrefsStore.data
        .catch { e -> if (e is IOException) emit(emptyPreferences()) else throw e }
        .map { p ->
            UserPreferences(
                language = AppLanguage.fromCode(p[Keys.LANGUAGE]),
                firstLaunch = p[Keys.FIRST_LAUNCH] ?: true,
                onboardingCompleted = p[Keys.ONBOARDING_COMPLETED] ?: false,
                voiceEnabled = p[Keys.VOICE_ENABLED] ?: true,
                largeText = p[Keys.LARGE_TEXT] ?: false,
            )
        }

    suspend fun setLanguage(language: AppLanguage) {
        context.userPrefsStore.edit { it[Keys.LANGUAGE] = language.code }
    }

    suspend fun completeOnboarding() {
        context.userPrefsStore.edit {
            it[Keys.ONBOARDING_COMPLETED] = true
            it[Keys.FIRST_LAUNCH] = false
        }
    }

    suspend fun setVoiceEnabled(enabled: Boolean) {
        context.userPrefsStore.edit { it[Keys.VOICE_ENABLED] = enabled }
    }

    suspend fun setLargeText(enabled: Boolean) {
        context.userPrefsStore.edit { it[Keys.LARGE_TEXT] = enabled }
    }
}
