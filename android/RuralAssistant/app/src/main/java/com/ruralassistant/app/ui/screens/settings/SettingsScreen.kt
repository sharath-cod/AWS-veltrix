package com.ruralassistant.app.ui.screens.settings

import androidx.annotation.StringRes
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.RecordVoiceOver
import androidx.compose.material.icons.filled.TextFields
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.ruralassistant.app.BuildConfig
import com.ruralassistant.app.R
import com.ruralassistant.app.domain.model.AppLanguage
import com.ruralassistant.app.ui.AppViewModelProvider
import com.ruralassistant.app.ui.components.ConnectionChip
import com.ruralassistant.app.ui.components.LanguageOptionCard

@Composable
fun SettingsScreen(
    isOnline: Boolean,
    viewModel: SettingsViewModel = viewModel(factory = AppViewModelProvider.Factory),
) {
    val prefs by viewModel.prefs.collectAsStateWithLifecycle()
    val pending by viewModel.pendingCount.collectAsStateWithLifecycle()
    val backendStatus by viewModel.backendStatus.collectAsStateWithLifecycle()
    var syncQueued by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(stringResource(R.string.title_settings), style = MaterialTheme.typography.headlineMedium)
        ConnectionChip(isOnline = isOnline)

        Text(
            text = stringResource(R.string.settings_language),
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.primary,
        )
        AppLanguage.entries.forEach { language ->
            LanguageOptionCard(
                language = language,
                isSelected = language == prefs.language,
                onClick = { viewModel.setLanguage(language) },
            )
        }

        SwitchRow(Icons.Filled.TextFields, R.string.settings_large_text, prefs.largeText, viewModel::setLargeText)
        SwitchRow(Icons.Filled.RecordVoiceOver, R.string.settings_voice, prefs.voiceEnabled, viewModel::setVoiceEnabled)

        // Developer diagnostics: proves Room, Retrofit and WorkManager are wired up.
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        ) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(stringResource(R.string.diag_title), style = MaterialTheme.typography.titleMedium)
                Text(stringResource(R.string.diag_db), style = MaterialTheme.typography.bodyMedium)
                Text(stringResource(R.string.diag_pending, pending), style = MaterialTheme.typography.bodyMedium)
                Text(stringResource(R.string.diag_base_url, BuildConfig.API_BASE_URL), style = MaterialTheme.typography.bodyMedium)

                val statusText = when (val s = backendStatus) {
                    BackendStatus.Idle -> ""
                    BackendStatus.Checking -> stringResource(R.string.diag_checking)
                    is BackendStatus.Success -> "OK: ${s.message} (database: ${s.database})"
                    is BackendStatus.Failure -> "Unreachable: ${s.reason}"
                }
                if (statusText.isNotEmpty()) {
                    Text(statusText, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.primary)
                }

                Button(
                    onClick = viewModel::checkBackend,
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 56.dp),
                ) { Text(stringResource(R.string.diag_check_backend), style = MaterialTheme.typography.labelLarge) }

                OutlinedButton(
                    onClick = {
                        viewModel.runSyncNow()
                        syncQueued = true
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 56.dp),
                ) { Text(stringResource(R.string.diag_sync_now), style = MaterialTheme.typography.labelLarge) }

                if (syncQueued) {
                    Text(stringResource(R.string.diag_sync_queued), style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
    }
}

@Composable
private fun SwitchRow(
    icon: ImageVector,
    @StringRes labelRes: Int,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 64.dp)
            .toggleable(value = checked, role = Role.Switch, onValueChange = onCheckedChange),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(32.dp), tint = MaterialTheme.colorScheme.primary)
        Text(
            text = stringResource(labelRes),
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier.weight(1f),
        )
        Switch(checked = checked, onCheckedChange = null)
    }
}
