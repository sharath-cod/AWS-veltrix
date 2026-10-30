package com.ruralassistant.app.ui.screens.scholarships

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.School
import androidx.compose.runtime.Composable
import com.ruralassistant.app.R
import com.ruralassistant.app.ui.components.PlaceholderScreen

@Composable
fun ScholarshipsScreen(onBack: () -> Unit) {
    PlaceholderScreen(
        titleRes = R.string.title_scholarships,
        messageRes = R.string.msg_scholarships,
        icon = Icons.Filled.School,
        onBack = onBack,
    )
}
