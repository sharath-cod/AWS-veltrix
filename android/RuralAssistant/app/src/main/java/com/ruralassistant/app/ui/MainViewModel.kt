package com.ruralassistant.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ruralassistant.app.domain.model.UserPreferences
import com.ruralassistant.app.domain.repository.SettingsRepository
import com.ruralassistant.app.utils.ConnectivityMonitor
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn

data class MainUiState(
    val isLoading: Boolean = true,
    val prefs: UserPreferences = UserPreferences(),
    val isOnline: Boolean = true,
)

/** App-level state: preferences (language, onboarding, text size) + connectivity. */
class MainViewModel(
    settings: SettingsRepository,
    connectivity: ConnectivityMonitor,
) : ViewModel() {

    // Eagerly: the splash screen reads .value before any UI collector exists.
    val uiState: StateFlow<MainUiState> = combine(settings.preferences, connectivity.isOnline) { prefs, online ->
        MainUiState(isLoading = false, prefs = prefs, isOnline = online)
    }.stateIn(viewModelScope, SharingStarted.Eagerly, MainUiState())
}
