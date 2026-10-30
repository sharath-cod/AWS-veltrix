package com.ruralassistant.app.ui.screens.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ruralassistant.app.domain.model.AppLanguage
import com.ruralassistant.app.domain.model.UserPreferences
import com.ruralassistant.app.domain.repository.BackendRepository
import com.ruralassistant.app.domain.repository.SettingsRepository
import com.ruralassistant.app.domain.repository.SyncRepository
import com.ruralassistant.app.utils.ConnectivityMonitor
import com.ruralassistant.app.utils.LocaleHelper
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

sealed interface BackendStatus {
    data object Idle : BackendStatus
    data object Checking : BackendStatus
    data class Success(val message: String, val database: String) : BackendStatus
    data class Failure(val reason: String) : BackendStatus
}

class SettingsViewModel(
    private val settings: SettingsRepository,
    private val backend: BackendRepository,
    private val sync: SyncRepository,
    connectivity: ConnectivityMonitor,
) : ViewModel() {

    val prefs: StateFlow<UserPreferences> = settings.preferences
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), UserPreferences())

    val isOnline: StateFlow<Boolean> = connectivity.isOnline
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), connectivity.currentlyOnline())

    val pendingCount: StateFlow<Int> = sync.pendingCount
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), 0)

    private val _backendStatus = MutableStateFlow<BackendStatus>(BackendStatus.Idle)
    val backendStatus: StateFlow<BackendStatus> = _backendStatus.asStateFlow()

    fun setLanguage(language: AppLanguage) {
        viewModelScope.launch {
            settings.setLanguage(language)
            LocaleHelper.apply(language) // recreates the activity so strings switch immediately
        }
    }

    fun completeOnboarding() {
        viewModelScope.launch { settings.completeOnboarding() }
    }

    fun setLargeText(enabled: Boolean) {
        viewModelScope.launch { settings.setLargeText(enabled) }
    }

    fun setVoiceEnabled(enabled: Boolean) {
        viewModelScope.launch { settings.setVoiceEnabled(enabled) }
    }

    fun checkBackend() {
        viewModelScope.launch {
            _backendStatus.value = BackendStatus.Checking
            backend.checkHealth().fold(
                onSuccess = { _backendStatus.value = BackendStatus.Success(it.message, it.database) },
                onFailure = { _backendStatus.value = BackendStatus.Failure(it.message ?: it.javaClass.simpleName) },
            )
        }
    }

    fun runSyncNow() = sync.syncNow()
}
