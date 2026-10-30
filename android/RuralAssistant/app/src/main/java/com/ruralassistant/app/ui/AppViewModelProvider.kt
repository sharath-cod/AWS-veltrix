package com.ruralassistant.app.ui

import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.CreationExtras
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.ruralassistant.app.RuralApp
import com.ruralassistant.app.ui.screens.settings.SettingsViewModel

object AppViewModelProvider {
    val Factory: ViewModelProvider.Factory = viewModelFactory {
        initializer {
            val c = ruralApp().container
            MainViewModel(c.settingsRepository, c.connectivityMonitor)
        }
        initializer {
            val c = ruralApp().container
            SettingsViewModel(c.settingsRepository, c.backendRepository, c.syncRepository, c.connectivityMonitor)
        }
    }
}

private fun CreationExtras.ruralApp(): RuralApp =
    this[ViewModelProvider.AndroidViewModelFactory.APPLICATION_KEY] as RuralApp
