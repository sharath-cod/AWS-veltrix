package com.ruralassistant.app.ui.screens.schemes

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.runtime.Composable
import com.ruralassistant.app.R
import com.ruralassistant.app.ui.components.PlaceholderScreen

@Composable
fun SchemesScreen() {
    PlaceholderScreen(
        titleRes = R.string.title_schemes,
        messageRes = R.string.msg_schemes,
        icon = Icons.Filled.AccountBalance,
        onBack = null,
    )
}
