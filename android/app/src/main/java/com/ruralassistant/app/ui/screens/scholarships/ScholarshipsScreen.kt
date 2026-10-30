package com.ruralassistant.app.ui.screens.scholarships
import androidx.compose.runtime.Composable
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.ruralassistant.app.ui.AppViewModelProvider
import com.ruralassistant.app.ui.screens.settings.SettingsViewModel
import com.ruralassistant.app.ui.screens.features.ScholarshipsFeatureScreen

@Composable
fun ScholarshipsScreen(onBack: () -> Unit, viewModel: SettingsViewModel = viewModel(factory = AppViewModelProvider.Factory)) {
    val prefs = viewModel.prefs.collectAsStateWithLifecycle().value
    ScholarshipsFeatureScreen(prefs.language)
}
