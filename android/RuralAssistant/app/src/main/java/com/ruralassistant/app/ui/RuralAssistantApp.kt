package com.ruralassistant.app.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.ruralassistant.app.ui.components.OfflineBanner
import com.ruralassistant.app.ui.navigation.AppNavHost
import com.ruralassistant.app.ui.navigation.Screen
import com.ruralassistant.app.ui.navigation.bottomNavItems
import com.ruralassistant.app.ui.navigation.navigateToTab

@Composable
fun RuralAssistantApp(
    startDestination: String,
    isOnline: Boolean,
) {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route ?: startDestination
    val showBottomBar = currentRoute != Screen.LanguageSelection.route

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    bottomNavItems.forEach { item ->
                        NavigationBarItem(
                            selected = currentRoute == item.screen.route,
                            onClick = { navController.navigateToTab(item.screen.route) },
                            icon = { Icon(item.icon, contentDescription = null, modifier = Modifier.size(30.dp)) },
                            label = {
                                Text(
                                    text = stringResource(item.labelRes),
                                    style = MaterialTheme.typography.labelMedium,
                                    maxLines = 1,
                                )
                            },
                            alwaysShowLabel = true,
                        )
                    }
                }
            }
        },
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .padding(innerPadding)
                .fillMaxSize(),
        ) {
            // Shown on every screen while offline, so the user always knows the state.
            AnimatedVisibility(visible = !isOnline) { OfflineBanner() }
            AppNavHost(
                navController = navController,
                startDestination = startDestination,
                isOnline = isOnline,
                modifier = Modifier.weight(1f),
            )
        }
    }
}
