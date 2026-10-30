package com.ruralassistant.app.ui.screens.scam
import androidx.compose.runtime.Composable
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.ruralassistant.app.ui.AppViewModelProvider
import com.ruralassistant.app.ui.screens.settings.SettingsViewModel
import com.ruralassistant.app.ui.screens.features.ScamFeatureScreen

@Composable
fun ScamCheckerScreen(onBack: () -> Unit, viewModel: SettingsViewModel = viewModel(factory = AppViewModelProvider.Factory)) {
    val prefs = viewModel.prefs.collectAsStateWithLifecycle().value
    ScamFeatureScreen(prefs.language)
}
