package com.ruralassistant.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density

private val LightColors = lightColorScheme(
    primary = Purple40,
    onPrimary = Color.White,
    primaryContainer = PurpleContainer,
    onPrimaryContainer = PurpleInk,
    secondary = Orange40,
    onSecondary = Color.White,
    secondaryContainer = OrangeContainer,
    onSecondaryContainer = Color(0xFF3B1A00),
    background = Color.White,
    onBackground = PurpleInk,
    surface = Color.White,
    onSurface = PurpleInk,
    surfaceVariant = Color(0xFFF4EEFA),
    onSurfaceVariant = Color(0xFF4A3F5C),
    outline = Color(0xFF7A6E8C),
)

private val DarkColors = darkColorScheme(
    primary = Purple80,
    onPrimary = Color(0xFF2B0F4A),
    primaryContainer = Color(0xFF43206B),
    onPrimaryContainer = PurpleContainer,
    secondary = Orange80,
    onSecondary = Color(0xFF4A1F00),
    secondaryContainer = Color(0xFF7A3300),
    onSecondaryContainer = OrangeContainer,
    background = Color(0xFF120A22),
    onBackground = Color(0xFFF3ECFB),
    surface = Color(0xFF120A22),
    onSurface = Color(0xFFF3ECFB),
    surfaceVariant = Color(0xFF2A1F3D),
    onSurfaceVariant = Color(0xFFCFC3E0),
    outline = Color(0xFF988CAB),
)

@Composable
fun RuralAssistantTheme(
    largeText: Boolean = false,
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val density = LocalDensity.current
    val scaledDensity = Density(
        density = density.density,
        fontScale = density.fontScale * if (largeText) 1.25f else 1f,
    )
    CompositionLocalProvider(LocalDensity provides scaledDensity) {
        MaterialTheme(
            colorScheme = if (darkTheme) DarkColors else LightColors,
            typography = AppTypography,
            content = content,
        )
    }
}
