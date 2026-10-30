package com.ruralassistant.app.ui.screens.health

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MedicalServices
import androidx.compose.runtime.Composable
import com.ruralassistant.app.R
import com.ruralassistant.app.ui.components.PlaceholderScreen

@Composable
fun HealthScreen(onBack: () -> Unit) {
    PlaceholderScreen(
        titleRes = R.string.title_health,
        messageRes = R.string.msg_health,
        icon = Icons.Filled.MedicalServices,
        onBack = onBack,
    )
}
