package com.ruralassistant.app

import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.getValue
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.ruralassistant.app.ui.AppViewModelProvider
import com.ruralassistant.app.ui.MainViewModel
import com.ruralassistant.app.ui.RuralAssistantApp
import com.ruralassistant.app.ui.navigation.Screen
import com.ruralassistant.app.ui.theme.RuralAssistantTheme

// AppCompatActivity (not ComponentActivity) so per-app language switching works on all Android versions.
class MainActivity : AppCompatActivity() {

    private val viewModel: MainViewModel by viewModels { AppViewModelProvider.Factory }

    override fun onCreate(savedInstanceState: Bundle?) {
        val splash = installSplashScreen()
        super.onCreate(savedInstanceState)
        // Keep the splash visible until preferences are loaded, so we pick the right first screen.
        splash.setKeepOnScreenCondition { viewModel.uiState.value.isLoading }
        enableEdgeToEdge()

        setContent {
            val state by viewModel.uiState.collectAsStateWithLifecycle()
            RuralAssistantTheme(largeText = state.prefs.largeText) {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    if (!state.isLoading) {
                        // Decided once; later changes must not rebuild the nav graph.
                        val startDestination = rememberSaveable {
                            if (state.prefs.onboardingCompleted) Screen.Home.route else Screen.LanguageSelection.route
                        }
                        RuralAssistantApp(startDestination = startDestination, isOnline = state.isOnline)
                    }
                }
            }
        }
    }
}
