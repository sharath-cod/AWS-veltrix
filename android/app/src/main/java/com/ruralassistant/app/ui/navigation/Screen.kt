package com.ruralassistant.app.ui.navigation

import androidx.annotation.StringRes
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Settings
import androidx.compose.ui.graphics.vector.ImageVector
import com.ruralassistant.app.R

sealed class Screen(val route: String) {
    data object LanguageSelection : Screen("language")
    data object Home : Screen("home")
    data object Assistant : Screen("assistant")
    data object Health : Screen("health")
    data object Schemes : Screen("schemes")
    data object Scholarships : Screen("scholarships")
    data object Reminders : Screen("reminders")
    data object ScamChecker : Screen("scam_checker")
    data object Settings : Screen("settings")
    data object Sms : Screen("sms")
    data object VirtualCall : Screen("virtual_call")
}

data class BottomNavItem(
    val screen: Screen,
    @StringRes val labelRes: Int,
    val icon: ImageVector,
)

/** Five tabs. Health, Scholarships and Scam Checker open from Home tiles. */
val bottomNavItems = listOf(
    BottomNavItem(Screen.Home, R.string.tab_home, Icons.Filled.Home),
    BottomNavItem(Screen.Assistant, R.string.tab_ask, Icons.Filled.Mic),
    BottomNavItem(Screen.Schemes, R.string.tab_schemes, Icons.Filled.AccountBalance),
    BottomNavItem(Screen.Reminders, R.string.tab_reminders, Icons.Filled.NotificationsActive),
    BottomNavItem(Screen.Settings, R.string.tab_settings, Icons.Filled.Settings),
)
