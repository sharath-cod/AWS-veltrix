package com.ruralassistant.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.ruralassistant.app.ui.screens.assistant.AssistantScreen
import com.ruralassistant.app.ui.screens.health.HealthScreen
import com.ruralassistant.app.ui.screens.home.HomeScreen
import com.ruralassistant.app.ui.screens.language.LanguageSelectionScreen
import com.ruralassistant.app.ui.screens.reminders.RemindersScreen
import com.ruralassistant.app.ui.screens.scam.ScamCheckerScreen
import com.ruralassistant.app.ui.screens.scholarships.ScholarshipsScreen
import com.ruralassistant.app.ui.screens.schemes.SchemesScreen
import com.ruralassistant.app.ui.screens.settings.SettingsScreen

/** Tab navigation: keeps Home as the single root so system Back goes tab -> Home -> exit. */
fun NavHostController.navigateToTab(route: String) {
    navigate(route) {
        popUpTo(Screen.Home.route) { saveState = true }
        launchSingleTop = true
        restoreState = true
    }
}

@Composable
fun AppNavHost(
    navController: NavHostController,
    startDestination: String,
    isOnline: Boolean,
    modifier: Modifier = Modifier,
) {
    NavHost(navController = navController, startDestination = startDestination, modifier = modifier) {
        composable(Screen.LanguageSelection.route) {
            LanguageSelectionScreen(
                onDone = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.LanguageSelection.route) { inclusive = true }
                    }
                },
            )
        }
        composable(Screen.Home.route) {
            HomeScreen(isOnline = isOnline, onNavigate = { navController.navigateToTab(it) })
        }
        composable(Screen.Assistant.route) { AssistantScreen() }
        composable(Screen.Health.route) { HealthScreen(onBack = { navController.popBackStack() }) }
        composable(Screen.Schemes.route) { SchemesScreen() }
        composable(Screen.Scholarships.route) { ScholarshipsScreen(onBack = { navController.popBackStack() }) }
        composable(Screen.Reminders.route) { RemindersScreen() }
        composable(Screen.ScamChecker.route) { ScamCheckerScreen(onBack = { navController.popBackStack() }) }
        composable(Screen.Settings.route) { SettingsScreen(isOnline = isOnline) }
    }
}
