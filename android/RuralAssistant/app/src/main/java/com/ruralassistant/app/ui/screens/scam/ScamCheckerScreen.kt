package com.ruralassistant.app.ui.screens.scam

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Security
import androidx.compose.runtime.Composable
import com.ruralassistant.app.R
import com.ruralassistant.app.ui.components.PlaceholderScreen

@Composable
fun ScamCheckerScreen(onBack: () -> Unit) {
    PlaceholderScreen(
        titleRes = R.string.title_scam,
        messageRes = R.string.msg_scam,
        icon = Icons.Filled.Security,
        onBack = onBack,
    )
}
