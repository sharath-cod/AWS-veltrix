package com.ruralassistant.app.ui.screens.reminders

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Event
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Medication
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.outlined.RadioButtonUnchecked
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimePicker
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.google.gson.JsonObject
import com.ruralassistant.app.BuildConfig
import com.ruralassistant.app.RuralApp
import com.ruralassistant.app.data.local.entity.PendingSyncEntity
import com.ruralassistant.app.data.local.entity.ReminderEntity
import com.ruralassistant.app.data.remote.api.FeatureApiClient
import com.ruralassistant.app.domain.model.AppLanguage
import com.ruralassistant.app.ui.AppViewModelProvider
import com.ruralassistant.app.ui.screens.settings.SettingsViewModel
import com.ruralassistant.app.utils.ConnectivityMonitor
import com.ruralassistant.app.utils.DeviceId
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.util.Locale
import java.util.UUID

/**
 * Reminders.
 *
 * The screen used to be an inline form with a raw ISO 8601 text box ("2026-11-01T09:00:00+05:30"),
 * which is not something a rural user can be expected to type. Adding or changing a reminder now
 * opens a dialog with a title, a type, a calendar and a clock, and a repeat choice; the ISO string
 * is built by the app and never shown.
 *
 * Everything is stored in Room first (so the list survives being offline) and mirrored to
 * /api/reminders when the network is there. A reminder created offline goes into the existing
 * pending_sync outbox, which SyncWorker drains, so nothing is lost when the phone is out of range.
 */

private val api by lazy { FeatureApiClient.create(BuildConfig.API_BASE_URL) }

/** Types and repeat values the backend accepts (backend/src/controllers/reminders.controller.js). */
private val REMINDER_TYPES = listOf("health", "medicine", "appointment", "scheme", "scholarship", "other")
private val REPEAT_OPTIONS = listOf("none", "daily", "weekly", "monthly", "yearly")

private fun deviceId(context: android.content.Context): String = DeviceId.get(context)

private fun tr(language: AppLanguage, en: String, hi: String, kn: String): String = when (language) {
    AppLanguage.HINDI -> hi
    AppLanguage.KANNADA -> kn
    else -> en
}

private fun typeLabel(type: String, language: AppLanguage): String = when (type) {
    "health" -> tr(language, "Health", "स्वास्थ्य", "ಆರೋಗ್ಯ")
    "medicine" -> tr(language, "Medicine", "दवा", "ಔಷಧಿ")
    "appointment" -> tr(language, "Appointment", "अपॉइंटमेंट", "ಭೇಟಿ")
    "scheme" -> tr(language, "Scheme", "योजना", "ಯೋಜನೆ")
    "scholarship" -> tr(language, "Scholarship", "छात्रवृत्ति", "ವಿದ್ಯಾರ್ಥಿವೇತ್ರ")
    else -> tr(language, "Other", "अन्य", "ಇತರೆ")
}

private fun repeatLabel(repeat: String, language: AppLanguage): String = when (repeat) {
    "daily" -> tr(language, "Every day", "रोज़", "ಪ್ರತಿದಿನ")
    "weekly" -> tr(language, "Every week", "हर हफ्ते", "ಪ್ರತಿ ವಾರ")
    "monthly" -> tr(language, "Every month", "हर महीने", "ಪ್ರತಿ ತಿಂಗಳು")
    "yearly" -> tr(language, "Every year", "हर साल", "ಪ್ರತಿ ವರ್ಷ")
    else -> tr(language, "Once", "एक बार", "ಒಮ್ಮೆ")
}

private fun typeIcon(type: String) = when (type) {
    "health" -> Icons.Filled.Favorite
    "medicine" -> Icons.Filled.Medication
    "appointment" -> Icons.Filled.Event
    "scheme" -> Icons.Filled.Assignment
    "scholarship" -> Icons.Filled.School
    else -> Icons.Filled.Notifications
}

private fun formatter(language: AppLanguage): DateTimeFormatter {
    val locale = when (language) {
        AppLanguage.HINDI -> Locale("hi", "IN")
        AppLanguage.KANNADA -> Locale("kn", "IN")
        else -> Locale.ENGLISH
    }
    return DateTimeFormatter.ofPattern("d MMM yyyy, h:mm a", locale)
}

private fun timeFormatter(language: AppLanguage): DateTimeFormatter {
    val locale = when (language) {
        AppLanguage.HINDI -> Locale("hi", "IN")
        AppLanguage.KANNADA -> Locale("kn", "IN")
        else -> Locale.ENGLISH
    }
    return DateTimeFormatter.ofPattern("h:mm a", locale)
}

private fun dateFormatter(language: AppLanguage): DateTimeFormatter {
    val locale = when (language) {
        AppLanguage.HINDI -> Locale("hi", "IN")
        AppLanguage.KANNADA -> Locale("kn", "IN")
        else -> Locale.ENGLISH
    }
    return DateTimeFormatter.ofPattern("d MMM yyyy", locale)
}

/**
 * Parse what the server stored. It is normally the ISO string this app sent, but an older
 * reminder (or a hand-made one) may carry a plain date, so every reasonable form is tried
 * before falling back to showing the raw text.
 */
private fun parseRemindAt(raw: String): OffsetDateTime? {
    if (raw.isBlank()) return null
    runCatching { OffsetDateTime.parse(raw) }.getOrNull()?.let { return it }
    runCatching { Instant.parse(raw).atZone(ZoneId.systemDefault()).toOffsetDateTime() }.getOrNull()?.let { return it }
    runCatching {
        java.time.LocalDateTime.parse(raw).atZone(ZoneId.systemDefault()).toOffsetDateTime()
    }.getOrNull()?.let { return it }
    runCatching {
        LocalDate.parse(raw).atStartOfDay(ZoneId.systemDefault()).toOffsetDateTime()
    }.getOrNull()?.let { return it }
    return null
}

private fun formatRemindAt(raw: String, language: AppLanguage): String {
    val parsed = parseRemindAt(raw) ?: return raw
    return parsed.atZoneSameInstant(ZoneId.systemDefault()).format(formatter(language))
}

/** ISO 8601 with the phone's own offset, e.g. 2026-11-01T09:00:00+05:30. */
private fun isoFrom(date: LocalDate, hour: Int, minute: Int): String {
    val offset = OffsetDateTime.now().offset
    return date.atTime(hour, minute).atOffset(offset)
        .format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX"))
}

private fun millisFrom(date: LocalDate, hour: Int, minute: Int): Long =
    date.atTime(hour, minute).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()

/** "Today", "Tomorrow" or the date, so a reminder reads at a glance. */
private fun dayLabel(raw: String, language: AppLanguage): String {
    val parsed = parseRemindAt(raw)?.atZoneSameInstant(ZoneId.systemDefault())?.toLocalDate()
        ?: return ""
    val today = LocalDate.now()
    return when (parsed) {
        today -> tr(language, "Today", "आज", "ಇಂದು")
        today.plusDays(1) -> tr(language, "Tomorrow", "कल", "ನಾಳೆ")
        today.minusDays(1) -> tr(language, "Yesterday", "कल", "ನಿನ್ನೆ")
        else -> ""
    }
}

/** The draft being edited in the dialog: everything the user picks, before it becomes a reminder. */
private data class ReminderDraft(
    val title: String = "",
    val notes: String = "",
    val type: String = "other",
    val repeat: String = "none",
    val date: LocalDate = LocalDate.now(),
    val hour: Int = 9,
    val minute: Int = 0,
)

private fun draftFrom(item: ReminderEntity?): ReminderDraft {
    if (item == null) return ReminderDraft()
    val parsed = parseRemindAt(item.remindAtIsoOf())
    return ReminderDraft(
        title = item.title,
        notes = item.notes,
        type = item.type,
        repeat = item.repeat,
        date = parsed?.toLocalDate() ?: LocalDate.now(),
        hour = parsed?.hour ?: 9,
        minute = parsed?.minute ?: 0,
    )
}

/**
 * The reminder's timestamp as text. The Room row stores epoch millis; this turns it back into
 * an ISO string so one code path (parseRemindAt) handles both server and local rows.
 */
private fun ReminderEntity.remindAtIsoOf(): String =
    Instant.ofEpochMilli(triggerAtMillis).atZone(ZoneId.systemDefault()).toOffsetDateTime()
        .format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX"))

@Composable
fun RemindersScreen(viewModel: SettingsViewModel = viewModel(factory = AppViewModelProvider.Factory)) {
    val prefs = viewModel.prefs.collectAsStateWithLifecycle().value
    RemindersContent(language = prefs.language)
}

@Composable
private fun RemindersContent(language: AppLanguage) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val database = remember { (context.applicationContext as RuralApp).container.database }
    val dao = remember { database.reminderDao() }
    val outbox = remember { database.pendingSyncDao() }

    // The list is rendered straight from Room, so it is on screen instantly and survives
    // being offline. refresh() only mirrors the server into it.
    val rows by dao.observeAll().collectAsStateWithLifecycle(initialValue = emptyList())

    var status by remember { mutableStateOf("") }
    var online by remember { mutableStateOf(ConnectivityMonitor(context).currentlyOnline()) }
    var busy by remember { mutableStateOf(false) }
    var showDialog by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf<ReminderEntity?>(null) }
    var confirmDelete by remember { mutableStateOf<ReminderEntity?>(null) }

    fun setStatus(message: String) { status = message }

    suspend fun refresh() {
        online = ConnectivityMonitor(context).currentlyOnline()
        if (!online) {
            setStatus(
                tr(
                    language,
                    "Offline: showing the reminders saved on this phone.",
                    "ऑफ़लाइन: इस फ़ोन में सहेजे गए रिमाइंडर दिख रहे हैं।",
                    "ಆಫ್‌ಲೈನ್: ಈ ಫೋನ್‌ನಲ್ಲಿ ಉಳಿಸಿದ ನೆನಪುಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.",
                ),
            )
            return
        }
        busy = true
        try {
            val response = api.reminders(deviceId(context))
            val serverRows = response.get("data")?.takeIf { it.isJsonArray }?.asJsonArray
                ?.mapNotNull { element ->
                    if (!element.isJsonObject) return@mapNotNull null
                    val row = element.asJsonObject
                    val id = row.get("id")?.takeUnless { it.isJsonNull }?.asString.orEmpty()
                    if (id.isBlank()) return@mapNotNull null
                    val remindAt = row.get("remindAt")?.takeUnless { it.isJsonNull }?.asString.orEmpty()
                    ReminderEntity(
                        id = 0,
                        serverId = id,
                        clientId = row.get("clientId")?.takeUnless { it.isJsonNull }?.asString.orEmpty(),
                        title = row.get("title")?.takeUnless { it.isJsonNull }?.asString.orEmpty(),
                        notes = row.get("notes")?.takeUnless { it.isJsonNull }?.asString.orEmpty(),
                        type = row.get("type")?.takeUnless { it.isJsonNull }?.asString ?: "other",
                        repeat = row.get("repeat")?.takeUnless { it.isJsonNull }?.asString ?: "none",
                        triggerAtMillis = parseRemindAt(remindAt)
                            ?.toInstant()?.toEpochMilli()
                            ?: System.currentTimeMillis(),
                        completed = row.get("completed")?.takeUnless { it.isJsonNull }?.asBoolean ?: false,
                        createdAt = System.currentTimeMillis(),
                        synced = true,
                    )
                }.orEmpty()

            // Replace the cached copies, keep anything created here that has not synced yet.
            dao.clearSynced()
            serverRows.forEach { dao.upsert(it) }
            setStatus(
                if (serverRows.isEmpty()) "" else tr(
                    language,
                    "${serverRows.size} reminder(s).",
                    "${serverRows.size} रिमाइंडर।",
                    "${serverRows.size} ನೆನಪುಗಳು.",
                ),
            )
        } catch (e: Exception) {
            setStatus(
                tr(
                    language,
                    "Could not reach the server. Showing the reminders saved on this phone.",
                    "सर्वर से संपर्क नहीं हुआ। इस फ़ोन में सहेजे गए रिमाइंडर दिख रहे हैं।",
                    "ಸರ್ವರ್ ಸಂಪರ್ಕವಾಗಲಿಲ್ಲ. ಈ ಫೋನ್‌ನಲ್ಲಿ ಉಳಿಸಿದ ನೆನಪುಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.",
                ),
            )
        } finally {
            busy = false
        }
    }

    LaunchedEffect(Unit) { refresh() }

    /** Save a new reminder, or the one being edited. */
    fun save(draft: ReminderDraft, existing: ReminderEntity?) {
        scope.launch {
            busy = true
            val remindAt = isoFrom(draft.date, draft.hour, draft.minute)
            // The client id is what makes a create idempotent on the server, so an
            // offline row keeps the one it was queued with.
            val clientId = existing?.clientId?.takeIf { it.isNotBlank() } ?: UUID.randomUUID().toString()
            val payload = JsonObject().apply {
                addProperty("title", draft.title.trim())
                addProperty("type", draft.type)
                addProperty("repeat", draft.repeat)
                addProperty("remindAt", remindAt)
                if (draft.notes.isNotBlank()) addProperty("notes", draft.notes.trim())
            }
            val isUpdate = existing != null && existing.serverId.isNotBlank()

            if (online) {
                try {
                    if (isUpdate) {
                        api.updateReminder(deviceId(context), existing!!.serverId, payload)
                    } else {
                        // If this reminder was created offline and is only now reaching
                        // the server, drop the queued copy so it is not sent twice.
                        outbox.deleteQueuedCreate(clientId)
                        payload.addProperty("clientId", clientId)
                        api.createReminder(deviceId(context), payload)
                    }
                    showDialog = false
                    editing = null
                    refresh()
                    setStatus(
                        tr(
                            language,
                            "Reminder saved.",
                            "रिमाइंडर सहेजा गया।",
                            "ನೆನಪು ಉಳಿಸಲಾಗಿದೆ.",
                        ),
                    )
                } catch (e: Exception) {
                    setStatus(e.message ?: tr(language, "Could not save the reminder.", "रिमाइंडर सहेजा नहीं गया।", "ನೆನಪು ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ."))
                } finally {
                    busy = false
                }
                return@launch
            }

            // Offline: keep it on the phone and queue it for /api/sync.
            try {
                dao.upsert(
                    ReminderEntity(
                        id = existing?.id ?: 0,
                        serverId = existing?.serverId.orEmpty(),
                        clientId = clientId,
                        title = draft.title.trim(),
                        notes = draft.notes.trim(),
                        type = draft.type,
                        repeat = draft.repeat,
                        triggerAtMillis = millisFrom(draft.date, draft.hour, draft.minute),
                        completed = existing?.completed ?: false,
                        createdAt = existing?.createdAt ?: System.currentTimeMillis(),
                        synced = false,
                    ),
                )
                outbox.insert(
                    PendingSyncEntity(
                        entityType = "reminder",
                        entityId = if (isUpdate) existing!!.serverId else clientId,
                        operation = if (isUpdate) "update" else "create",
                        payloadJson = payload.toString(),
                        createdAt = System.currentTimeMillis(),
                    ),
                )
                showDialog = false
                editing = null
                setStatus(
                    tr(
                        language,
                        "Saved on this phone. It will be sent when the internet is back.",
                        "इस फ़ोन में सहेजा गया। इंटरनेट आने पर भेजा जाएगा।",
                        "ಈ ಫೋನ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ. ಇಂಟರ್ನೆಟ್ ಬಂದಾಗ ಕಳುಹಿಸಲಾಗುತ್ತದೆ.",
                    ),
                )
            } catch (e: Exception) {
                setStatus(e.message ?: tr(language, "Could not save on this phone.", "फ़ोन में सहेजा नहीं गया।", "ಫೋನ್‌ನಲ್ಲಿ ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ."))
            } finally {
                busy = false
            }
        }
    }

    fun toggleCompleted(item: ReminderEntity) {
        scope.launch {
            val nowCompleted = !item.completed
            try {
                if (online && item.serverId.isNotBlank()) {
                    api.updateReminder(
                        deviceId(context),
                        item.serverId,
                        JsonObject().apply { addProperty("completed", nowCompleted) },
                    )
                    refresh()
                } else {
                    dao.upsert(item.copy(completed = nowCompleted, synced = false))
                    if (item.serverId.isNotBlank()) {
                        outbox.insert(
                            PendingSyncEntity(
                                entityType = "reminder",
                                entityId = item.serverId,
                                operation = "update",
                                payloadJson = JsonObject().apply { addProperty("completed", nowCompleted) }.toString(),
                                createdAt = System.currentTimeMillis(),
                            ),
                        )
                    }
                }
            } catch (e: Exception) {
                setStatus(e.message ?: tr(language, "Could not update the reminder.", "रिमाइंडर बदला नहीं गया।", "ನೆನಪನ್ನು ಬದಲಾಯಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ."))
            }
        }
    }

    fun delete(item: ReminderEntity) {
        scope.launch {
            try {
                if (online && item.serverId.isNotBlank()) {
                    api.deleteReminder(deviceId(context), item.serverId)
                    refresh()
                } else {
                    dao.deleteById(item.id)
                    if (item.serverId.isNotBlank()) {
                        outbox.insert(
                            PendingSyncEntity(
                                entityType = "reminder",
                                entityId = item.serverId,
                                operation = "delete",
                                payloadJson = "{}",
                                createdAt = System.currentTimeMillis(),
                            ),
                        )
                    } else {
                        // Never reached the server: drop the queued create as well.
                        outbox.deleteQueuedCreate(item.clientId)
                    }
                }
            } catch (e: Exception) {
                setStatus(e.message ?: tr(language, "Could not delete the reminder.", "रिमाइंडर हटाया नहीं गया।", "ನೆನಪನ್ನು ಅಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ."))
            }
        }
    }

    Box(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    tr(language, "Reminders", "रिमाइंडर", "ನೆನಪುಗಳು"),
                    style = MaterialTheme.typography.headlineSmall,
                )
                Spacer(Modifier.width(8.dp))
                if (rows.isNotEmpty()) {
                    Text(
                        "${rows.count { !it.completed }}/${rows.size}",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                    )
                }
            }
            Text(
                tr(
                    language,
                    "Get a reminder for a medicine, a meeting or a scheme date.",
                    "दवा, बैठक या योजना की तारीख के लिए रिमाइंडर बनाएं।",
                    "ಔಷಧಿ, ಸಭೆ ಅಥವಾ ಯೋಜನೆಯ ದಿನಾಂಕಕ್ಕೆ ನೆನಪು ಮಾಡಿಸಿ.",
                ),
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(top = 2.dp),
            )
            if (status.isNotBlank()) {
                Text(
                    status,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(top = 8.dp),
                )
            }

            LazyColumn(
                modifier = Modifier.fillMaxWidth().weight(1f),
                contentPadding = PaddingValues(top = 12.dp, bottom = 96.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                if (rows.isEmpty() && !busy) {
                    item { EmptyState(language) }
                }
                items(rows, key = { row -> row.id }) { row ->
                    ReminderCard(
                        item = row,
                        language = language,
                        onOpen = { editing = row; showDialog = true },
                        onToggle = { toggleCompleted(row) },
                        onDelete = { confirmDelete = row },
                    )
                }
            }
        }

        ExtendedFloatingActionButton(
            onClick = { editing = null; showDialog = true },
            modifier = Modifier.align(Alignment.BottomEnd).padding(18.dp),
            icon = { Icon(Icons.Filled.Add, contentDescription = null) },
            text = { Text(tr(language, "Add reminder", "रिमाइंडर जोड़ें", "ನೆನಪು ಸೇರಿಸಿ")) },
        )
    }

    if (showDialog) {
        ReminderDialog(
            language = language,
            initial = draftFrom(editing),
            isEdit = editing != null,
            onDismiss = { showDialog = false; editing = null },
            onSave = { draft -> save(draft, editing) },
        )
    }

    confirmDelete?.let { item ->
        AlertDialog(
            onDismissRequest = { confirmDelete = null },
            title = { Text(tr(language, "Delete this reminder?", "यह रिमाइंडर हटाएं?", "ಈ ನೆನಪನ್ನು ಅಳಿಸುವುದೇ?")) },
            text = { Text(item.title) },
            confirmButton = {
                TextButton(onClick = { confirmDelete = null; delete(item) }) {
                    Text(tr(language, "Delete", "हटाएं", "ಅಳಿಸಿ"))
                }
            },
            dismissButton = {
                TextButton(onClick = { confirmDelete = null }) {
                    Text(tr(language, "Cancel", "रद्द करें", "ರದ್ದುಮಾಡಿ"))
                }
            },
        )
    }
}

@Composable
private fun EmptyState(language: AppLanguage) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
    ) {
        Column(Modifier.padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                Icons.Filled.Notifications,
                contentDescription = null,
                modifier = Modifier.size(36.dp),
                tint = MaterialTheme.colorScheme.primary,
            )
            Spacer(Modifier.height(8.dp))
            Text(
                tr(language, "No reminders yet", "अभी कोई रिमाइंडर नहीं", "ಇನ್ನೂ ಯಾವುದೇ ನೆನಪು ಇಲ್ಲ"),
                style = MaterialTheme.typography.titleMedium,
            )
            Text(
                tr(
                    language,
                    "Tap “Add reminder” to set the first one.",
                    "पहला रिमाइंडर बनाने के लिए “रिमाइंडर जोड़ें” दबाएं।",
                    "ಮೊದಲ ನೆನಪನ್ನು ಹೊಂದಿಸಲು “ನೆನಪು ಸೇರಿಸಿ” ಒತ್ತಿ.",
                ),
                style = MaterialTheme.typography.bodySmall,
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ReminderCard(
    item: ReminderEntity,
    language: AppLanguage,
    onOpen: () -> Unit,
    onToggle: () -> Unit,
    onDelete: () -> Unit,
) {
    val overdue = !item.completed && item.triggerAtMillis < System.currentTimeMillis()
    val day = dayLabel(item.remindAtIsoOf(), language)
    Card(onClick = onOpen, modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(start = 12.dp, top = 10.dp, bottom = 10.dp, end = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(CircleShape)
                    .background(
                        if (item.completed) MaterialTheme.colorScheme.surfaceVariant
                        else MaterialTheme.colorScheme.primaryContainer,
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    typeIcon(item.type),
                    contentDescription = null,
                    modifier = Modifier.size(20.dp),
                    tint = if (item.completed) MaterialTheme.colorScheme.onSurfaceVariant
                    else MaterialTheme.colorScheme.onPrimaryContainer,
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    item.title,
                    style = MaterialTheme.typography.titleMedium,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    textDecoration = if (item.completed) TextDecoration.LineThrough else null,
                )
                Text(
                    buildString {
                        if (day.isNotBlank()) append(day).append(" · ")
                        append(formatRemindAt(item.remindAtIsoOf(), language))
                    },
                    style = MaterialTheme.typography.bodySmall,
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(typeLabel(item.type, language), style = MaterialTheme.typography.labelSmall)
                    if (item.repeat != "none") {
                        Text(" · ${repeatLabel(item.repeat, language)}", style = MaterialTheme.typography.labelSmall)
                    }
                    when {
                        !item.synced -> Text(
                            " · " + tr(language, "waiting to sync", "सिंक बाकी", "ಸಿಂಕ್ ಬಾಕಿ"),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.tertiary,
                        )
                        overdue -> Text(
                            " · " + tr(language, "overdue", "समय बीत गया", "ಸಮಯ ಮೀರಿದೆ"),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.error,
                        )
                    }
                }
                if (item.notes.isNotBlank()) {
                    Text(
                        item.notes,
                        style = MaterialTheme.typography.bodySmall,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            IconButton(onClick = onToggle) {
                Icon(
                    if (item.completed) Icons.Filled.CheckCircle else Icons.Outlined.RadioButtonUnchecked,
                    contentDescription = tr(language, "Mark done", "पूरा हुआ", "ಪೂರ್ಣಗೊಂಡಿದೆ"),
                    tint = if (item.completed) MaterialTheme.colorScheme.primary
                    else MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            IconButton(onClick = onDelete) {
                Icon(
                    Icons.Filled.Delete,
                    contentDescription = tr(language, "Delete", "हटाएं", "ಅಳಿಸಿ"),
                    tint = MaterialTheme.colorScheme.error,
                )
            }
        }
    }
}

/**
 * The pop-up used for both "add" and "edit": title, type, date, time, repeat and an optional note.
 * The date and time are picked, never typed, and the ISO string the API needs is built on save.
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
private fun ReminderDialog(
    language: AppLanguage,
    initial: ReminderDraft,
    isEdit: Boolean,
    onDismiss: () -> Unit,
    onSave: (ReminderDraft) -> Unit,
) {
    var draft by remember { mutableStateOf(initial) }
    var error by remember { mutableStateOf("") }
    var showDatePicker by remember { mutableStateOf(false) }
    var showTimePicker by remember { mutableStateOf(false) }

    fun validate(): Boolean {
        if (draft.title.trim().length < 2) {
            error = tr(language, "Please write what the reminder is for.", "कृपया लिखें कि रिमाइंडर किस लिए है।", "ನೆನಪು ಯಾವುದಕ್ಕಾಗಿ ಎಂದು ಬರೆಯಿರಿ.")
            return false
        }
        val millis = millisFrom(draft.date, draft.hour, draft.minute)
        if (millis < System.currentTimeMillis() - 60_000) {
            error = tr(language, "Please choose a date and time in the future.", "कृपया भविष्य की तारीख और समय चुनें।", "ದಯವಿಟ್ಟು ಭವಿಷ್ಯದ ದಿನಾಂಕ ಮತ್ತು ಸಮಯ ಆಯ್ಕೆಮಾಡಿ.")
            return false
        }
        error = ""
        return true
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                if (isEdit) tr(language, "Change reminder", "रिमाइंडर बदलें", "ನೆನಪು ಬದಲಾಯಿಸಿ")
                else tr(language, "New reminder", "नया रिमाइंडर", "ಹೊಸ ನೆನಪು"),
            )
        },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                OutlinedTextField(
                    value = draft.title,
                    onValueChange = { draft = draft.copy(title = it); error = "" },
                    label = { Text(tr(language, "What is it for?", "किस लिए?", "ಯಾವುದಕ್ಕಾಗಿ?")) },
                    placeholder = { Text(tr(language, "e.g. Collect ration", "जैसे: राशन लेना", "ಉದಾ: ಪಡಿತರ ಪಡೆಯುವುದು")) },
                    singleLine = false,
                    maxLines = 2,
                    modifier = Modifier.fillMaxWidth(),
                )

                Text(typeLabelHeader(language), style = MaterialTheme.typography.labelMedium)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    REMINDER_TYPES.forEach { type ->
                        FilterChip(
                            selected = draft.type == type,
                            onClick = { draft = draft.copy(type = type) },
                            label = { Text(typeLabel(type, language)) },
                        )
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = { showDatePicker = true },
                        modifier = Modifier.weight(1f),
                    ) {
                        Text(
                            draft.date.format(dateFormatter(language)),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                    OutlinedButton(
                        onClick = { showTimePicker = true },
                        modifier = Modifier.weight(1f),
                    ) {
                        Text(
                            java.time.LocalTime.of(draft.hour, draft.minute).format(timeFormatter(language)),
                            maxLines = 1,
                        )
                    }
                }

                // One tap to the times people actually pick.
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TextButton(onClick = { draft = draft.copy(date = LocalDate.now()) }) {
                        Text(tr(language, "Today", "आज", "ಇಂದು"))
                    }
                    TextButton(onClick = { draft = draft.copy(date = LocalDate.now().plusDays(1)) }) {
                        Text(tr(language, "Tomorrow", "कल", "ನಾಳೆ"))
                    }
                    TextButton(onClick = { draft = draft.copy(date = LocalDate.now().plusDays(7)) }) {
                        Text(tr(language, "In a week", "एक हफ्ते में", "ಒಂದು ವಾರದಲ್ಲಿ"))
                    }
                }

                Text(repeatLabelHeader(language), style = MaterialTheme.typography.labelMedium)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    REPEAT_OPTIONS.forEach { repeat ->
                        FilterChip(
                            selected = draft.repeat == repeat,
                            onClick = { draft = draft.copy(repeat = repeat) },
                            label = { Text(repeatLabel(repeat, language)) },
                        )
                    }
                }

                OutlinedTextField(
                    value = draft.notes,
                    onValueChange = { draft = draft.copy(notes = it) },
                    label = { Text(tr(language, "Note (optional)", "नोट (वैकल्पिक)", "ಟಿಪ್ಪಣಿ (ಐಚ್ಛಿಕ)")) },
                    singleLine = false,
                    maxLines = 3,
                    modifier = Modifier.fillMaxWidth(),
                )

                if (error.isNotBlank()) {
                    Text(error, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.labelMedium)
                }
            }
        },
        confirmButton = {
            TextButton(onClick = { if (validate()) onSave(draft) }) {
                Text(
                    if (isEdit) tr(language, "Save", "सहेजें", "ಉಳಿಸಿ")
                    else tr(language, "Add", "जोड़ें", "ಸೇರಿಸಿ"),
                )
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text(tr(language, "Cancel", "रद्द करें", "ರದ್ದುಮಾಡಿ"))
            }
        },
    )

    if (showDatePicker) {
        val state = rememberDatePickerState(
            initialSelectedDateMillis = draft.date.atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli(),
        )
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    val picked = state.selectedDateMillis
                    if (picked != null) {
                        // The picker works in UTC, so read the date back in UTC too.
                        draft = draft.copy(date = Instant.ofEpochMilli(picked).atZone(ZoneOffset.UTC).toLocalDate())
                    }
                    showDatePicker = false
                    error = ""
                }) { Text(tr(language, "OK", "ठीक", "ಸರಿ")) }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) {
                    Text(tr(language, "Cancel", "रद्द करें", "ರದ್ದುಮಾಡಿ"))
                }
            },
        ) {
            DatePicker(state = state, showModeToggle = false)
        }
    }

    if (showTimePicker) {
        val state = rememberTimePickerState(
            initialHour = draft.hour,
            initialMinute = draft.minute,
            is24Hour = false,
        )
        Dialog(onDismissRequest = { showTimePicker = false }) {
            Surface(shape = MaterialTheme.shapes.extraLarge, tonalElevation = 6.dp) {
                Column(
                    modifier = Modifier
                        .padding(16.dp)
                        .verticalScroll(rememberScrollState()),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(
                        tr(language, "Pick a time", "समय चुनें", "ಸಮಯ ಆಯ್ಕೆಮಾಡಿ"),
                        style = MaterialTheme.typography.titleMedium,
                    )
                    Spacer(Modifier.height(12.dp))
                    TimePicker(state = state)
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                        TextButton(onClick = { showTimePicker = false }) {
                            Text(tr(language, "Cancel", "रद्द करें", "ರದ್ದುಮಾಡಿ"))
                        }
                        TextButton(onClick = {
                            draft = draft.copy(hour = state.hour, minute = state.minute)
                            showTimePicker = false
                            error = ""
                        }) { Text(tr(language, "OK", "ठीक", "ಸರಿ")) }
                    }
                }
            }
        }
    }
}

private fun typeLabelHeader(language: AppLanguage) =
    tr(language, "Type", "प्रकार", "ವಿಧ")

private fun repeatLabelHeader(language: AppLanguage) =
    tr(language, "Repeat", "दोहराएं", "ಪುನರಾವರ್ತಿಸಿ")
