package com.ruralassistant.app.ui.screens.home

import androidx.annotation.StringRes
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.MedicalServices
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Sms
import androidx.compose.material.icons.filled.Call
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ruralassistant.app.R
import com.ruralassistant.app.ui.components.ConnectionChip
import com.ruralassistant.app.ui.components.HomeTile
import com.ruralassistant.app.ui.navigation.Screen

private data class HomeTileData(
    val screen: Screen,
    @StringRes val labelRes: Int,
    val icon: ImageVector,
)

private val homeTiles = listOf(
    HomeTileData(Screen.Assistant, R.string.title_assistant, Icons.Filled.Mic),
    HomeTileData(Screen.Health, R.string.title_health, Icons.Filled.MedicalServices),
    HomeTileData(Screen.Schemes, R.string.title_schemes, Icons.Filled.AccountBalance),
    HomeTileData(Screen.Scholarships, R.string.title_scholarships, Icons.Filled.School),
    HomeTileData(Screen.Reminders, R.string.title_reminders, Icons.Filled.NotificationsActive),
    HomeTileData(Screen.ScamChecker, R.string.title_scam, Icons.Filled.Security),
    HomeTileData(Screen.Sms, R.string.title_sms, Icons.Filled.Sms),
)

/**
 * The call logo: one tap dials the assistant, which picks up and answers by
 * voice — in the caller's language, and offline from the saved pack.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CallBanner(onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().heightIn(min = 104.dp),
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(18.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                Modifier.size(56.dp).clip(CircleShape)
                    .background(MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.20f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = Icons.Filled.Call,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onPrimary,
                    modifier = Modifier.size(30.dp),
                )
            }
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    text = stringResource(R.string.call_now),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onPrimary,
                )
                Text(
                    text = stringResource(R.string.call_subtitle),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onPrimary,
                )
            }
        }
    }
}

@Composable
fun HomeScreen(
    isOnline: Boolean,
    onNavigate: (String) -> Unit,
) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        horizontalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item(span = { GridItemSpan(maxLineSpan) }) {
            Column {
                Text(
                    text = stringResource(R.string.app_name),
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.primary,
                )
                Spacer(Modifier.height(12.dp))
                ConnectionChip(isOnline = isOnline)
                Spacer(Modifier.height(16.dp))
                Text(
                    text = stringResource(R.string.home_greeting),
                    style = MaterialTheme.typography.titleLarge,
                )
            }
        }
        item(span = { GridItemSpan(maxLineSpan) }) {
            CallBanner(onClick = { onNavigate(Screen.VirtualCall.route) })
        }
        items(homeTiles) { tile ->
            HomeTile(
                labelRes = tile.labelRes,
                icon = tile.icon,
                onClick = { onNavigate(tile.screen.route) },
            )
        }
    }
}
