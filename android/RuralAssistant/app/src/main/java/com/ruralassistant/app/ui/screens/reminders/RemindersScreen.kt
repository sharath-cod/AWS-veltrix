package com.ruralassistant.app.ui.screens.reminders

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.runtime.Composable
import com.ruralassistant.app.R
import com.ruralassistant.app.ui.components.PlaceholderScreen

@Composable
fun RemindersScreen() {
    PlaceholderScreen(
        titleRes = R.string.title_reminders,
        messageRes = R.string.msg_reminders,
        icon = Icons.Filled.NotificationsActive,
        onBack = null,
    )
}
