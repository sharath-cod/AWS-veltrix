package com.ruralassistant.app.ui.screens.assistant
import androidx.compose.runtime.Composable
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.ruralassistant.app.ui.AppViewModelProvider
import com.ruralassistant.app.ui.screens.settings.SettingsViewModel
import com.ruralassistant.app.ui.screens.features.AssistantFeatureScreen

@Composable
fun AssistantScreen(viewModel: SettingsViewModel = viewModel(factory = AppViewModelProvider.Factory)) {
    val prefs = viewModel.prefs.collectAsStateWithLifecycle().value
    AssistantFeatureScreen(language = prefs.language)
}
