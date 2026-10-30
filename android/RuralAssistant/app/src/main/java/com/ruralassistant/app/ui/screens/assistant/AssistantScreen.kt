package com.ruralassistant.app.ui.screens.assistant

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.runtime.Composable
import com.ruralassistant.app.R
import com.ruralassistant.app.ui.components.PlaceholderScreen

@Composable
fun AssistantScreen() {
    PlaceholderScreen(
        titleRes = R.string.title_assistant,
        messageRes = R.string.msg_assistant,
        icon = Icons.Filled.Mic,
        onBack = null,
    )
}
