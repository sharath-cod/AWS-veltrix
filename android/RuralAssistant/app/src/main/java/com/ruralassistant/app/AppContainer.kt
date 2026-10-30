package com.ruralassistant.app

import android.content.Context
import com.ruralassistant.app.data.local.database.AppDatabase
import com.ruralassistant.app.data.local.datastore.UserPreferencesDataStore
import com.ruralassistant.app.data.remote.api.ApiClient
import com.ruralassistant.app.data.remote.api.RuralApiService
import com.ruralassistant.app.data.repository.BackendRepositoryImpl
import com.ruralassistant.app.data.repository.SettingsRepositoryImpl
import com.ruralassistant.app.data.repository.SyncRepositoryImpl
import com.ruralassistant.app.domain.repository.BackendRepository
import com.ruralassistant.app.domain.repository.SettingsRepository
import com.ruralassistant.app.domain.repository.SyncRepository
import com.ruralassistant.app.utils.ConnectivityMonitor

/** Manual dependency container (no Hilt: fewer moving parts for a 24h hackathon). */
class AppContainer(context: Context) {
    private val appContext = context.applicationContext

    val database: AppDatabase by lazy { AppDatabase.build(appContext) }

    val connectivityMonitor: ConnectivityMonitor by lazy { ConnectivityMonitor(appContext) }

    private val apiService: RuralApiService by lazy {
        ApiClient.create(BuildConfig.API_BASE_URL, BuildConfig.DEBUG).create(RuralApiService::class.java)
    }

    val settingsRepository: SettingsRepository by lazy {
        SettingsRepositoryImpl(UserPreferencesDataStore(appContext))
    }
    val backendRepository: BackendRepository by lazy { BackendRepositoryImpl(apiService) }
    val syncRepository: SyncRepository by lazy { SyncRepositoryImpl(appContext, database.pendingSyncDao()) }
}
