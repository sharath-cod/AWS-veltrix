package com.ruralassistant.app.ui.screens.features

import android.speech.tts.TextToSpeech
import android.speech.SpeechRecognizer
import android.speech.RecognizerIntent
import android.content.Intent
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.google.gson.JsonObject
import com.ruralassistant.app.BuildConfig
import com.ruralassistant.app.data.remote.api.FeatureApiClient
import com.ruralassistant.app.domain.model.AppLanguage
import com.ruralassistant.app.utils.DeviceId
import kotlinx.coroutines.launch
import java.util.Locale
import java.util.UUID

private val api by lazy { FeatureApiClient.create(BuildConfig.API_BASE_URL) }
private fun deviceId(context: android.content.Context): String = DeviceId.get(context)

private fun langCode(language: AppLanguage) = language.code
private fun JsonObject.dataObject() = getAsJsonObject("data") ?: JsonObject()
private fun JsonObject.dataArray(): List<JsonObject> {
    val d = get("data") ?: return emptyList()
    if (!d.isJsonArray) return emptyList()
    return d.asJsonArray.mapNotNull { if (it.isJsonObject) it.asJsonObject else null }
}
private fun JsonObject.str(key: String, fallback: String = ""): String =
    try { get(key)?.takeUnless { it.isJsonNull }?.asString ?: fallback } catch (_: Exception) { fallback }
private fun localized(value: com.google.gson.JsonElement?, language: AppLanguage): String {
    if (value == null || value.isJsonNull) return ""
    if (value.isJsonPrimitive) return value.asString
    if (value.isJsonObject) {
        val o = value.asJsonObject
        return o.get(language.code)?.asString ?: o.get("en")?.asString ?: ""
    }
    return ""
}

@Composable
private fun Page(title: String, content: @Composable ColumnScope.() -> Unit) {
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(18.dp), content = {
        Text(title, style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(14.dp))
        content()
    })
}

@Composable
private fun StatusText(message: String, error: Boolean = false) {
    if (message.isNotBlank()) Text(message, color = if (error) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary)
}

@Composable
fun AssistantFeatureScreen(language: AppLanguage, category: String = "general", title: String = "Ask GramSahayak") {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var question by remember { mutableStateOf("") }
    var answer by remember { mutableStateOf("") }
    var sources by remember { mutableStateOf("") }
    var status by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var listening by remember { mutableStateOf(false) }
    val tts = remember { TextToSpeech(context) {} }
    val recognizer = remember {
        if (SpeechRecognizer.isRecognitionAvailable(context)) SpeechRecognizer.createSpeechRecognizer(context) else null
    }
    DisposableEffect(Unit) {
        onDispose { tts.shutdown(); recognizer?.destroy() }
    }
    val speechPermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) {
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, when (language) {
                    AppLanguage.KANNADA -> "kn-IN"; AppLanguage.HINDI -> "hi-IN"; else -> "en-IN"
                })
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
            }
            recognizer?.setRecognitionListener(object : android.speech.RecognitionListener {
                override fun onReadyForSpeech(params: android.os.Bundle?) { listening = true }
                override fun onBeginningOfSpeech() {}
                override fun onRmsChanged(rmsdB: Float) {}
                override fun onBufferReceived(buffer: ByteArray?) {}
                override fun onEndOfSpeech() { listening = false }
                override fun onError(error: Int) { listening = false; status = "Speech recognition error ($error). You can type your question." }
                override fun onResults(results: android.os.Bundle?) {
                    listening = false
                    question = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull().orEmpty()
                }
                override fun onPartialResults(partialResults: android.os.Bundle?) {}
                override fun onEvent(eventType: Int, params: android.os.Bundle?) {}
            })
            recognizer?.startListening(intent)
        } else status = "Microphone permission is required for voice input."
    }

    Page(title) {
        Text("Ask in ${language.nativeName}. The assistant uses the connected knowledge base.", style = MaterialTheme.typography.bodyLarge)
        OutlinedTextField(
            value = question, onValueChange = { question = it },
            modifier = Modifier.fillMaxWidth(), minLines = 3,
            label = { Text("Type your question") },
        )
        OutlinedButton(
            modifier = Modifier.fillMaxWidth(),
            enabled = recognizer != null && !loading && !listening,
            onClick = {
                if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                    speechPermission.launch(android.Manifest.permission.RECORD_AUDIO)
                } else speechPermission.launch(android.Manifest.permission.RECORD_AUDIO)
            }
        ) { Text(if (listening) "Listening…" else "Speak your question") }
        Button(
            enabled = question.trim().length >= 2 && !loading,
            modifier = Modifier.fillMaxWidth(),
            onClick = {
                scope.launch {
                    loading = true; status = "Getting an answer…"; answer = ""; sources = ""
                    try {
                        val body = JsonObject().apply {
                            addProperty("question", question.trim())
                            addProperty("language", langCode(language))
                            addProperty("category", category)
                        }
                        val response = api.ask(deviceId(context), body).dataObject()
                        answer = localized(response.get("answer"), language).ifBlank { response.str("answer", "No answer returned.") }
                        val src = response.getAsJsonArray("trustedSources")
                        sources = src?.joinToString("\n") { it.asJsonObject.get("name")?.asString.orEmpty() } ?: ""
                        status = if (response.get("grounded")?.asBoolean == true) "Answer based on available knowledge." else "Please verify important details with an official source."
                    } catch (e: Exception) { status = e.message ?: "Unable to connect to backend."; }
                    finally { loading = false }
                }
            }
        ) { Text(if (loading) "Please wait…" else "Ask") }
        StatusText(status, status.contains("Unable"))
        if (answer.isNotBlank()) {
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text("Assistant response", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(8.dp))
                    Text(answer, style = MaterialTheme.typography.bodyLarge)
                    if (sources.isNotBlank()) {
                        Spacer(Modifier.height(10.dp))
                        Text("Trusted sources", style = MaterialTheme.typography.titleSmall)
                        Text(sources)
                    }
                    Spacer(Modifier.height(12.dp))
                    OutlinedButton(onClick = {
                        val locale = when (language) { AppLanguage.KANNADA -> Locale("kn", "IN"); AppLanguage.HINDI -> Locale("hi", "IN"); else -> Locale.US }
                        tts.language = locale
                        tts.speak(answer, TextToSpeech.QUEUE_FLUSH, null, "answer")
                    }) { Text("Read answer aloud") }
                }
            }
        }
    }
}

@Composable
fun SchemesFeatureScreen(language: AppLanguage) {
    val scope = rememberCoroutineScope()
    var items by remember { mutableStateOf(listOf<JsonObject>()) }
    var query by remember { mutableStateOf("") }
    var status by remember { mutableStateOf("Loading schemes…") }
    var selected by remember { mutableStateOf<JsonObject?>(null) }
    var checkSummary by remember { mutableStateOf("") }
    var checkDocuments by remember { mutableStateOf(listOf<String>()) }
    var checkLikely by remember { mutableStateOf(listOf<String>()) }
    var checking by remember { mutableStateOf(false) }

    fun load(q: String = "") {
        scope.launch {
            status = "Loading…"
            try {
                items = api.schemes(q.ifBlank { null }).dataArray()
                status = "${items.size} schemes found."
            } catch (e: Exception) {
                status = e.message ?: "Could not load schemes."
            }
        }
    }
    LaunchedEffect(Unit) { load() }

    Page("Government schemes") {
        OutlinedTextField(query, { query = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Search schemes") })
        Button(onClick = { load(query) }, modifier = Modifier.fillMaxWidth()) { Text("Search") }
        StatusText(status, status.contains("Could not"))

        items.forEach { item ->
            val name = localized(item.get("name"), language).ifBlank { item.str("name", item.str("title")) }
            val desc = localized(item.get("description"), language).ifBlank { item.str("description") }
            Card(
                onClick = {
                    selected = item
                    checkSummary = ""
                    checkDocuments = emptyList()
                    checkLikely = emptyList()
                },
                modifier = Modifier.fillMaxWidth().padding(vertical = 5.dp),
            ) {
                Column(Modifier.padding(14.dp)) {
                    Text(name, style = MaterialTheme.typography.titleMedium)
                    if (desc.isNotBlank()) Text(desc, maxLines = 3)
                    Text("View details", color = MaterialTheme.colorScheme.primary)
                }
            }
        }

        selected?.let { item ->
            Spacer(Modifier.height(18.dp))
            Text(
                localized(item.get("name"), language).ifBlank { item.str("name") },
                style = MaterialTheme.typography.titleLarge,
            )
            val eligibilityText = localized(item.get("eligibility"), language)
            val applyText = localized(item.get("apply"), language)
            val descriptionText = localized(item.get("description"), language)
            if (descriptionText.isNotBlank()) {
                Spacer(Modifier.height(8.dp))
                Text(descriptionText)
            }
            if (eligibilityText.isNotBlank()) {
                Spacer(Modifier.height(10.dp))
                Text("Who can apply", style = MaterialTheme.typography.titleSmall)
                Text(eligibilityText)
            }
            if (applyText.isNotBlank()) {
                Spacer(Modifier.height(10.dp))
                Text("How to apply", style = MaterialTheme.typography.titleSmall)
                Text(applyText)
            }
            Spacer(Modifier.height(12.dp))
            Button(
                modifier = Modifier.fillMaxWidth(),
                enabled = !checking,
                onClick = {
                    scope.launch {
                        checking = true
                        try {
                            val body = JsonObject().apply { addProperty("language", language.code) }
                            val data = api.schemeCheck(body).dataObject()
                            checkSummary = data.str("summary")
                            checkDocuments = data.getAsJsonArray("documents")
                                ?.mapNotNull { element -> element.takeUnless { it.isJsonNull }?.asString }
                                .orEmpty()
                            checkLikely = data.getAsJsonArray("results")
                                ?.mapNotNull { element ->
                                    val row = element.asJsonObject
                                    if (row.str("status") == "likely") row.str("name") else null
                                }
                                .orEmpty()
                        } catch (e: Exception) {
                            checkSummary = e.message ?: "Eligibility check unavailable."
                        } finally {
                            checking = false
                        }
                    }
                },
            ) { Text(if (checking) "Checking…" else "Check general eligibility") }

            if (checkSummary.isNotBlank()) {
                Spacer(Modifier.height(10.dp))
                Text(checkSummary)
            }
            if (checkLikely.isNotEmpty()) {
                Spacer(Modifier.height(8.dp))
                Text("Schemes that look relevant", style = MaterialTheme.typography.titleSmall)
                checkLikely.forEach { Text("- $it") }
            }
            if (checkDocuments.isNotEmpty()) {
                Spacer(Modifier.height(8.dp))
                Text("Keep these documents ready", style = MaterialTheme.typography.titleSmall)
                checkDocuments.forEach { Text("- $it") }
            }
            TextButton(onClick = { selected = null }) { Text("Close details") }
        }
    }
}

@Composable
fun ScholarshipsFeatureScreen(language: AppLanguage) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var items by remember { mutableStateOf(listOf<JsonObject>()) }
    var saved by remember { mutableStateOf(setOf<String>()) }
    var status by remember { mutableStateOf("Loading scholarships…") }
    var query by remember { mutableStateOf("") }
    suspend fun refresh() {
        val response = api.scholarships(query.ifBlank { null }, true)
        items = response.dataArray()
        val savedResponse = api.savedScholarships(deviceId(context))
        saved = savedResponse.dataArray().map { it.str("id") }.toSet()
        status = "${items.size} scholarships found."
    }
    LaunchedEffect(Unit) { try { refresh() } catch (e: Exception) { status = e.message ?: "Could not load scholarships." } }
    Page("Scholarships") {
        OutlinedTextField(query, { query = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Search scholarships") })
        Button(onClick = { scope.launch { try { refresh() } catch (e: Exception) { status = e.message ?: "Search failed." } } }, modifier = Modifier.fillMaxWidth()) { Text("Search") }
        StatusText(status, status.contains("Could not") || status.contains("failed"))
        items.forEach { item ->
            val id = item.str("id", item.str("slug"))
            val name = localized(item.get("name"), language).ifBlank { item.str("name", item.str("title")) }
            Card(Modifier.fillMaxWidth().padding(vertical = 5.dp)) {
                Column(Modifier.padding(14.dp)) {
                    Text(name, style = MaterialTheme.typography.titleMedium)
                    Text(localized(item.get("description"), language).ifBlank { item.str("description") }, maxLines = 3)
                    TextButton(onClick = {
                        scope.launch {
                            try {
                                val body = JsonObject().apply { addProperty("scholarship", id) }
                                if (id in saved) api.unsaveScholarship(deviceId(context), id) else api.saveScholarship(deviceId(context), body)
                                refresh()
                            } catch (e: Exception) { status = e.message ?: "Could not update saved list." }
                        }
                    }) { Text(if (id in saved) "Remove saved" else "Save scholarship") }
                }
            }
        }
    }
}

@Composable
fun RemindersFeatureScreen(language: AppLanguage) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var items by remember { mutableStateOf(listOf<JsonObject>()) }
    var title by remember { mutableStateOf("") }
    var date by remember { mutableStateOf("") }
    var status by remember { mutableStateOf("Loading reminders…") }
    suspend fun refresh() { items = api.reminders(deviceId(context)).dataArray(); status = "${items.size} reminders." }
    LaunchedEffect(Unit) { try { refresh() } catch (e: Exception) { status = e.message ?: "Could not load reminders." } }
    Page("Reminders") {
        OutlinedTextField(title, { title = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Reminder title") })
        OutlinedTextField(date, { date = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Date and time (ISO 8601)") }, placeholder = { Text("2026-11-01T09:00:00+05:30") })
        Button(enabled = title.isNotBlank() && date.isNotBlank(), modifier = Modifier.fillMaxWidth(), onClick = {
            scope.launch {
                try {
                    val body = JsonObject().apply {
                        addProperty("title", title.trim()); addProperty("type", "other")
                        addProperty("remindAt", date.trim()); addProperty("repeat", "none")
                        addProperty("clientId", UUID.randomUUID().toString())
                    }
                    api.createReminder(deviceId(context), body); title = ""; date = ""; refresh()
                } catch (e: Exception) { status = e.message ?: "Could not create reminder." }
            }
        }) { Text("Add reminder") }
        StatusText(status)
        items.forEach { item ->
            val id = item.str("id")
            Card(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                Column(Modifier.padding(12.dp)) {
                    Text(item.str("title"), style = MaterialTheme.typography.titleMedium)
                    Text(item.str("remindAt"))
                    Row {
                        TextButton(onClick = { scope.launch { try { api.updateReminder(deviceId(context), id, JsonObject().apply { addProperty("completed", true) }); refresh() } catch (e: Exception) { status = e.message ?: "Update failed." } } }) { Text("Complete") }
                        TextButton(onClick = { scope.launch { try { api.deleteReminder(deviceId(context), id); refresh() } catch (e: Exception) { status = e.message ?: "Delete failed." } } }) { Text("Delete") }
                    }
                }
            }
        }
    }
}

@Composable
fun ScamFeatureScreen(language: AppLanguage) {
    val scope = rememberCoroutineScope()
    var text by remember { mutableStateOf("") }
    var risk by remember { mutableStateOf("") }
    var reasons by remember { mutableStateOf(listOf<String>()) }
    var advice by remember { mutableStateOf("") }
    var status by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }

    Page("Scam checker") {
        Text("Paste a suspicious SMS, WhatsApp message or call description. Nothing is stored on the server.")
        OutlinedTextField(
            text, { text = it },
            modifier = Modifier.fillMaxWidth(), minLines = 5,
            label = { Text("Suspicious message") },
        )
        Button(
            enabled = text.trim().length >= 3 && !loading,
            modifier = Modifier.fillMaxWidth(),
            onClick = {
                scope.launch {
                    loading = true
                    risk = ""
                    reasons = emptyList()
                    advice = ""
                    try {
                        val body = JsonObject().apply {
                            addProperty("text", text.trim())
                            addProperty("language", language.code)
                        }
                        val data = api.scamCheck(body).dataObject()
                        risk = when (data.str("riskLevel")) {
                            "high" -> "HIGH RISK"
                            "medium" -> "MEDIUM RISK"
                            "low" -> "LOW RISK"
                            else -> data.str("riskLevel").uppercase()
                        }
                        reasons = data.getAsJsonArray("reasons")
                            ?.mapNotNull { element -> element.asJsonObject.get("text")?.asString }
                            .orEmpty()
                        advice = data.str("advice")
                        status = "Assessment complete."
                    } catch (e: Exception) {
                        status = e.message ?: "Unable to check message."
                    } finally {
                        loading = false
                    }
                }
            },
        ) { Text(if (loading) "Checking…" else "Check message") }

        StatusText(status, status.contains("Unable"))

        if (risk.isNotBlank()) {
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text(
                        risk,
                        style = MaterialTheme.typography.titleMedium,
                        color = if (risk.startsWith("HIGH")) MaterialTheme.colorScheme.error
                        else MaterialTheme.colorScheme.primary,
                    )
                    if (reasons.isNotEmpty()) {
                        Spacer(Modifier.height(10.dp))
                        Text("What looks wrong", style = MaterialTheme.typography.titleSmall)
                        reasons.forEach { Text("- $it") }
                    }
                    if (advice.isNotBlank()) {
                        Spacer(Modifier.height(10.dp))
                        Text("What to do", style = MaterialTheme.typography.titleSmall)
                        Text(advice)
                    }
                }
            }
        }
    }
}

@Composable
fun SmsFeatureScreen(language: AppLanguage) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var phone by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var consent by remember { mutableStateOf(false) }
    var status by remember { mutableStateOf("") }
    var history by remember { mutableStateOf(listOf<JsonObject>()) }
    fun reload() { scope.launch { try { history = api.smsHistory(deviceId(context)).dataArray() } catch (e: Exception) { status = e.message ?: "History unavailable." } } }
    LaunchedEffect(Unit) { reload() }
    Page("SMS Centre — Demo") {
        Text("Demo only: no message will be delivered to a real phone.")
        OutlinedTextField(phone, { phone = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Indian mobile number") })
        OutlinedTextField(message, { message = it }, modifier = Modifier.fillMaxWidth(), minLines = 3, label = { Text("Message") })
        Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
            Checkbox(consent, { consent = it })
            Text("I have permission to record this simulated send.")
        }
        Button(enabled = phone.isNotBlank() && message.isNotBlank() && consent, modifier = Modifier.fillMaxWidth(), onClick = {
            scope.launch {
                try {
                    val body = JsonObject().apply {
                        addProperty("to", phone); addProperty("message", message)
                        addProperty("language", language.code); addProperty("category", "other"); addProperty("consent", true)
                    }
                    val data = api.smsSend(deviceId(context), body).dataObject()
                    status = data.str("statusLabel", "SMS simulated; not delivered.")
                    reload()
                } catch (e: Exception) { status = e.message ?: "SMS simulation failed." }
            }
        }) { Text("Simulate SMS send") }
        StatusText(status)
        Text("Message history", style = MaterialTheme.typography.titleLarge)
        history.forEach { item ->
            Card(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                Column(Modifier.padding(12.dp)) {
                    Text(item.str("toMasked"))
                    Text(item.str("message"))
                    Text(item.str("statusLabel", item.str("status")), color = MaterialTheme.colorScheme.primary)
                }
            }
        }
    }
}
