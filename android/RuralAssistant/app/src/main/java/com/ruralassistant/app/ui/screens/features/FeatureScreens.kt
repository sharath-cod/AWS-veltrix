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
import com.ruralassistant.app.RuralApp
import com.ruralassistant.app.data.KnowledgePack
import com.ruralassistant.app.data.LocalAnswer
import com.ruralassistant.app.utils.SafetyGuard
import com.ruralassistant.app.utils.SpeechInput
import com.ruralassistant.app.utils.VoiceNoteQueue
import android.media.MediaRecorder
import java.io.File
import com.ruralassistant.app.utils.ConnectivityMonitor
import com.ruralassistant.app.utils.DeviceId
import com.ruralassistant.app.utils.NumberReadBack
import kotlinx.coroutines.launch
import java.util.Locale

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

/**
 * Pack status that refreshes itself from the server whenever the phone is online.
 * Besides "your copy is old", it now says *what* changed (hurdle 1).
 */
@Composable
private fun rememberPackStatus(): State<KnowledgePack.Status> {
    val context = LocalContext.current
    val state = remember { mutableStateOf(KnowledgePack.status(context)) }
    LaunchedEffect(Unit) { state.value = KnowledgePack.refresh(context) }
    return state
}

/** Opens the official page where a fact can be confirmed. */
private fun openUrl(context: android.content.Context, url: String) {
    try {
        context.startActivity(Intent(Intent.ACTION_VIEW, android.net.Uri.parse(url)))
    } catch (_: Exception) {
        // No browser on the device: the text still names the office to ask.
    }
}

/** Tells the user how old their downloaded information is and what changed. */
@Composable
private fun FreshnessBanner(status: KnowledgePack.Status, language: AppLanguage) {
    val context = LocalContext.current
    val online = remember { ConnectivityMonitor(context).currentlyOnline() }
    var expanded by remember { mutableStateOf(false) }
    val changes = remember(status.changedCount) { KnowledgePack.changes(context) }
    val stale = status.stale || status.hasChanges
    Card(
        Modifier.fillMaxWidth().padding(bottom = 12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (stale) MaterialTheme.colorScheme.errorContainer else MaterialTheme.colorScheme.secondaryContainer,
        ),
    ) {
        Column(Modifier.padding(12.dp)) {
            Text(
                (if (stale) "⚠ " else "✓ ") + KnowledgePack.message(status, language.code, online),
                style = MaterialTheme.typography.bodyMedium,
            )
            val checkedOn = KnowledgePack.checkedOnLabel(status, language.code)
            if (checkedOn.isNotBlank()) {
                Spacer(Modifier.height(4.dp))
                Text(checkedOn, style = MaterialTheme.typography.labelSmall)
            }
            if (changes.isNotEmpty()) {
                Spacer(Modifier.height(6.dp))
                TextButton(onClick = { expanded = !expanded }, contentPadding = PaddingValues(0.dp)) {
                    Text(if (expanded) "Hide what changed" else "See what changed (${changes.size})")
                }
                if (expanded) {
                    changes.forEach { change ->
                        Column(Modifier.padding(top = 6.dp)) {
                            Text(KnowledgePack.summaryFor(change, language.code, context), style = MaterialTheme.typography.bodySmall)
                            change.verifyUrl?.let { url ->
                                TextButton(onClick = { openUrl(context, url) }, contentPadding = PaddingValues(0.dp)) {
                                    Text("Verify on the official page")
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

/** Amounts mentioned in a piece of text, shown so the user can double-check them. */
private fun amountsIn(text: String): List<NumberReadBack.Item> =
    NumberReadBack.extract(text).filter { it.kind == "amount" }

private fun ttsLocale(language: AppLanguage) = when (language) {
    AppLanguage.KANNADA -> Locale("kn", "IN"); AppLanguage.HINDI -> Locale("hi", "IN"); else -> Locale.US
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
    var micMode by remember { mutableStateOf("question") }   // "question" | "confirm"
    var verifyNotice by remember { mutableStateOf("") }
    var factAsOf by remember { mutableStateOf("") }
    var factVerifyUrl by remember { mutableStateOf("") }
    var factVerifyAt by remember { mutableStateOf("") }
    var answerAmounts by remember { mutableStateOf(listOf<NumberReadBack.Item>()) }
    var answerSpeech by remember { mutableStateOf(listOf<NumberReadBack.Segment>()) }
    var answerLanguage by remember { mutableStateOf(language.code) }
    // Read-back: numbers and dates heard in the question must be confirmed before
    // the server releases an answer (hurdle 3).
    var pendingItems by remember { mutableStateOf(listOf<NumberReadBack.Item>()) }
    var pendingDates by remember { mutableStateOf(listOf<NumberReadBack.DateItem>()) }
    var pendingToken by remember { mutableStateOf("") }
    var pendingPrompt by remember { mutableStateOf("") }
    // Voice: what went wrong, and the recording we can keep instead of losing.
    var voiceProblem by remember { mutableStateOf(false) }
    var languageProblem by remember { mutableStateOf(false) }
    var savedNotes by remember { mutableStateOf(VoiceNoteQueue.count(context)) }
    var noteRecording by remember { mutableStateOf(false) }
    val noteRecorder = remember { mutableStateOf<MediaRecorder?>(null) }
    val noteFile = remember { mutableStateOf<File?>(null) }
    val pack by rememberPackStatus()
    val tts = remember { TextToSpeech(context) {} }
    // A fresh recogniser is made for every question: the online (cloud) one when
    // there is internet, the on-device one only when offline. See SpeechInput.create.
    val recognizerState = remember { mutableStateOf<SpeechRecognizer?>(null) }
    val micAvailable = remember { SpeechInput.isAvailable(context) }
    DisposableEffect(Unit) {
        onDispose {
            tts.shutdown()
            try { recognizerState.value?.destroy() } catch (_: Exception) {}
            try { noteRecorder.value?.release() } catch (_: Exception) {}
        }
    }

    fun ttsLocaleFor(code: String) = when (code) {
        "kn" -> Locale("kn", "IN"); "hi" -> Locale("hi", "IN"); else -> Locale.US
    }

    fun speakPrompt(text: String, code: String = language.code) {
        if (text.isBlank()) return
        tts.language = ttsLocaleFor(code)
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "readback")
    }

    /** Everything the answer card shows, from either the direct or the confirmed call. */
    fun renderAnswer(data: JsonObject) {
        answerLanguage = data.str("answerLanguage", language.code)
        answer = localized(data.get("answer"), AppLanguage.fromCode(answerLanguage))
            .ifBlank { data.str("answer", "No answer returned.") }
        val src = data.getAsJsonArray("trustedSources")
        sources = src?.joinToString("\n") { it.asJsonObject.get("name")?.asString.orEmpty() } ?: ""
        answerAmounts = amountsIn(answer)
        val speech = data.getAsJsonArray("answerSpeech")
        answerSpeech = speech?.mapNotNull { el ->
            val o = el.asJsonObject
            val type = o.str("type", "text")
            // Prose segments carry "text"; number and date segments carry "display".
            val text = if (type == "text") o.str("text") else o.str("display")
            val readBack = o.str("readBack")
            if (type == "text" && text.isBlank()) null else NumberReadBack.Segment(type, text, readBack)
        } ?: emptyList<NumberReadBack.Segment>()

        // How fresh this particular fact is, and where to confirm it (hurdle 1).
        val fact = data.getAsJsonObject("fact")
        factAsOf = fact?.str("asOf").orEmpty()
        factVerifyUrl = fact?.str("verifyUrl").orEmpty()
        factVerifyAt = fact?.str("verifyAt").orEmpty()
        val recheck = data.getAsJsonObject("recheck")
        verifyNotice = recheck?.let { localized(it.get("message"), AppLanguage.fromCode(answerLanguage)) }.orEmpty()
        if (verifyNotice.isBlank() && data.get("verifyBeforeActing")?.asBoolean == true) {
            verifyNotice = localized(data.get("staleNotice"), AppLanguage.fromCode(answerLanguage))
                .ifBlank { KnowledgePack.message(pack, language.code, true) }
        }
        status = if (data.get("grounded")?.asBoolean == true) "Answer based on available knowledge." else "Please verify important details with an official source."
        if (answerLanguage != language.code) {
            status = "$status Answered in ${AppLanguage.fromCode(answerLanguage).nativeName}."
        }
    }

    /** Show an answer that came from the pack saved on the phone. */
    fun renderLocal(result: LocalAnswer.Result) {
        answerLanguage = result.language
        answer = result.answer
        sources = result.matchedTitle?.let { "Saved on this phone: $it" } ?: ""
        answerAmounts = amountsIn(answer)
        answerSpeech = emptyList()
        factAsOf = ""; factVerifyUrl = ""; factVerifyAt = ""
        verifyNotice = when {
            result.redirect.isNotEmpty() -> "Call " + result.redirect.joinToString(" or ")
            else -> SafetyGuard.offlineNotice(result.language)
        }
        status = if (result.grounded) {
            "Answered from the information saved on this phone."
        } else {
            "Please verify important details with an official source."
        }
        if (result.emergency) speakPrompt(answer, result.language)
    }

    /** Ask the question. language=auto so the answer matches the language asked. */
    fun submit() {
        scope.launch {
            loading = true; status = "Getting an answer…"; answer = ""; sources = ""; verifyNotice = ""
            answerAmounts = emptyList(); answerSpeech = emptyList(); factAsOf = ""; factVerifyUrl = ""; factVerifyAt = ""
            // No internet: answer from the pack already saved on the phone
            // instead of showing a connection error.
            if (!ConnectivityMonitor(context).currentlyOnline()) {
                try {
                    renderLocal(LocalAnswer.answer(context, question.trim(), language.code))
                } catch (e: Exception) {
                    status = e.message ?: "Unable to read the saved information."
                } finally {
                    loading = false
                }
                return@launch
            }
            try {
                val body = JsonObject().apply {
                    addProperty("question", question.trim())
                    // Let the server answer in the language the question is in,
                    // even when the phone's menu is in another one (hurdle 2).
                    addProperty("language", "auto")
                    addProperty("category", category)
                    addProperty("requireConfirmation", true)
                    pack.version?.let { addProperty("packVersion", it) }
                    pack.verifiedAtIso?.let { addProperty("packDownloadedAt", it) }
                }
                val data = api.ask(deviceId(context), body).dataObject()
                if (data.get("requiresConfirmation")?.asBoolean == true) {
                    val confirmation = data.getAsJsonObject("confirmation")
                    pendingToken = confirmation?.str("token").orEmpty()
                    val promptLang = data.str("language", language.code)
                    pendingPrompt = confirmation?.getAsJsonObject("prompt")?.let {
                        it.get(promptLang)?.takeUnless { e -> e.isJsonNull }?.asString
                            ?: it.get("en")?.asString.orEmpty()
                    }.orEmpty()
                    pendingItems = NumberReadBack.extract(question)
                    pendingDates = NumberReadBack.extractDates(question)
                    status = pendingPrompt.ifBlank { NumberReadBack.confirmationPrompt(pendingItems, language.code, pendingDates) }
                    speakPrompt(status, promptLang)
                    return@launch
                }
                renderAnswer(data)
            } catch (e: Exception) {
                // The server could not be reached: fall back to the saved pack.
                try {
                    renderLocal(LocalAnswer.answer(context, question.trim(), language.code))
                } catch (inner: Exception) {
                    status = e.message ?: "Unable to connect to backend."
                }
            } finally {
                loading = false
            }
        }
    }

    /** Ask the server to release the held answer, with the user's yes/no. */
    fun resolveConfirmation(confirmed: Boolean?, utterance: String?) {
        if (pendingToken.isBlank()) {
            // No server token: this was the offline read-back only, so act locally.
            pendingItems = emptyList(); pendingDates = emptyList(); pendingPrompt = ""
            if (confirmed == true) submit() else status = "Please correct the question."
            return
        }
        scope.launch {
            loading = true
            try {
                val body = JsonObject().apply {
                    addProperty("token", pendingToken)
                    if (confirmed != null) addProperty("confirmed", confirmed)
                    if (!utterance.isNullOrBlank()) addProperty("utterance", utterance)
                }
                val data = api.confirmAnswer(deviceId(context), body).dataObject()
                val stillOpen = data.get("retry")?.asBoolean == true
                if (stillOpen) {
                    status = "Please say yes or no."
                    return@launch
                }
                if (data.get("cancelled")?.asBoolean == true) {
                    val msg = localized(data.get("message"), language)
                    status = msg.ifBlank { "Cancelled. Please say the question again." }
                    pendingToken = ""; pendingItems = emptyList(); pendingDates = emptyList(); pendingPrompt = ""
                    speakPrompt(status)
                    return@launch
                }
                pendingToken = ""; pendingItems = emptyList(); pendingDates = emptyList(); pendingPrompt = ""
                renderAnswer(data)
            } catch (e: Exception) {
                status = e.message ?: "Could not confirm. Please try again."
            } finally {
                loading = false
            }
        }
    }

    // Last resort when the in-app recogniser has no Hindi/Kannada: Google's own
    // voice-typing dialog, which supports them whenever the phone is online.
    val dialogResult = rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()) { res ->
        listening = false
        val heard = res.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)?.firstOrNull().orEmpty()
        if (heard.isNotBlank()) {
            voiceProblem = false
            languageProblem = false
            status = ""
            if (micMode == "confirm") resolveConfirmation(null, heard) else question = heard
        }
    }

    val speechPermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (!granted) {
            status = "Microphone permission is required for voice input."
            return@rememberLauncherForActivityResult
        }
        val offline = !ConnectivityMonitor(context).currentlyOnline()
        try { recognizerState.value?.destroy() } catch (_: Exception) {}
        val recognizer = SpeechInput.create(context, online = !offline)
        recognizerState.value = recognizer
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, SpeechInput.languageTag(language.code))
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, SpeechInput.languageTag(language.code))
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
            // Offline the recogniser has to use the downloaded language model.
            putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, offline)
        }
        recognizer?.setRecognitionListener(object : android.speech.RecognitionListener {
            override fun onReadyForSpeech(params: android.os.Bundle?) { listening = true }
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {}
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() { listening = false }
            override fun onError(error: Int) {
                listening = false
                // Online but this recogniser lacks the language: use Google's
                // voice-typing dialog instead of giving up.
                if (!offline && SpeechInput.isLanguageProblem(error)) {
                    val dialog = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                        putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                        putExtra(RecognizerIntent.EXTRA_LANGUAGE, SpeechInput.languageTag(language.code))
                        putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, SpeechInput.languageTag(language.code))
                    }
                    if (runCatching { dialogResult.launch(dialog) }.isSuccess) return
                }
                // Say what actually went wrong, in the user's language: no
                // network, or the Hindi/Kannada voice pack is not installed.
                languageProblem = SpeechInput.isLanguageProblem(error)
                voiceProblem = languageProblem || SpeechInput.isNetworkProblem(error)
                status = SpeechInput.errorMessage(error, language.code)
            }
            override fun onResults(results: android.os.Bundle?) {
                listening = false
                voiceProblem = false
                languageProblem = false
                val heard = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull().orEmpty()
                if (micMode == "confirm") {
                    // A spoken yes/no goes to the server, which understands all
                    // three languages (hurdle 3).
                    resolveConfirmation(null, heard)
                } else {
                    question = heard
                }
            }
            override fun onPartialResults(partialResults: android.os.Bundle?) {}
            override fun onEvent(eventType: Int, params: android.os.Bundle?) {}
        })
        try { recognizer?.startListening(intent) } catch (e: Exception) { listening = false; status = e.message ?: "Voice input failed." }
    }

    /** Keep the question as audio when it cannot be recognised now. */
    fun startNoteRecording() {
        try {
            val file = File(context.cacheDir, "saved_question_${System.currentTimeMillis()}.m4a")
            val mr = MediaRecorder()
            mr.setAudioSource(MediaRecorder.AudioSource.MIC)
            mr.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            mr.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            mr.setAudioSamplingRate(16000)
            mr.setAudioEncodingBitRate(64000)
            mr.setOutputFile(file.absolutePath)
            mr.prepare()
            mr.start()
            noteRecorder.value = mr
            noteFile.value = file
            noteRecording = true
            status = "Recording your question… tap Stop to save it."
        } catch (e: Exception) {
            status = e.message ?: "Could not start recording."
            noteRecording = false
        }
    }

    fun stopNoteRecording() {
        val mr = noteRecorder.value ?: return
        val file = noteFile.value
        try { mr.stop() } catch (_: Exception) { status = "Recording was too short." }
        try { mr.reset(); mr.release() } catch (_: Exception) {}
        noteRecorder.value = null
        noteRecording = false
        if (file == null || !file.exists() || file.length() == 0L) return
        val bytes = runCatching { file.readBytes() }.getOrNull()
        file.delete()
        if (bytes == null) return
        val kept = VoiceNoteQueue.enqueue(context, bytes, language.code)
        savedNotes = VoiceNoteQueue.count(context)
        status = if (kept) {
            "Saved. This recording will be turned into text when the internet is back."
        } else {
            "Too many saved recordings. Please ask by typing."
        }
    }

    // A recording saved while offline becomes text as soon as the phone is online.
    LaunchedEffect(Unit) {
        if (ConnectivityMonitor(context).currentlyOnline() && VoiceNoteQueue.count(context) > 0) {
            val done = VoiceNoteQueue.flush(context) { text, code ->
                question = text
                answerLanguage = code
            }
            if (done > 0) {
                savedNotes = VoiceNoteQueue.count(context)
                status = "Your saved recording was converted to text. Tap Ask."
            }
        }
    }

    fun startListening(mode: String) {
        micMode = mode
        speechPermission.launch(android.Manifest.permission.RECORD_AUDIO)
    }

    Page(title) {
        FreshnessBanner(pack, language)
        Text("Ask in ${language.nativeName}. The assistant uses the connected knowledge base.", style = MaterialTheme.typography.bodyLarge)
        OutlinedTextField(
            value = question, onValueChange = { question = it },
            modifier = Modifier.fillMaxWidth(), minLines = 3,
            label = { Text("Type your question") },
        )
        OutlinedButton(
            modifier = Modifier.fillMaxWidth(),
            enabled = micAvailable && !loading && !listening,
            onClick = { startListening("question") },
        ) { Text(if (listening && micMode == "question") "Listening…" else "Speak your question") }

        // When voice cannot work right now, say why and offer the way out:
        // keep the recording for later, or open the voice settings.
        if (voiceProblem || savedNotes > 0) {
            Text(
                SpeechInput.hint(language.code, offline = !ConnectivityMonitor(context).currentlyOnline()),
                style = MaterialTheme.typography.labelSmall,
            )
        }
        if (voiceProblem) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    modifier = Modifier.weight(1f),
                    onClick = { if (noteRecording) stopNoteRecording() else startNoteRecording() },
                ) { Text(if (noteRecording) "Stop and save" else "Save recording for later") }
                if (languageProblem) {
                    TextButton(onClick = {
                        SpeechInput.voiceSettingsIntent()?.let { intent ->
                            runCatching { context.startActivity(intent) }
                        }
                    }) { Text("Voice settings") }
                }
            }
        }
        if (savedNotes > 0) {
            Text(
                "$savedNotes saved recording(s) waiting to be converted to text.",
                style = MaterialTheme.typography.labelSmall,
            )
        }
        Button(
            enabled = question.trim().length >= 2 && !loading,
            modifier = Modifier.fillMaxWidth(),
            onClick = {
                // Offline guard: if the server cannot be reached, still read the
                // numbers back locally before the question leaves the phone.
                val items = NumberReadBack.extract(question)
                val dates = NumberReadBack.extractDates(question)
                if ((items.any { it.risky } || dates.any { it.risky }) && pendingToken.isBlank()) {
                    pendingItems = items
                    pendingDates = dates
                    pendingPrompt = NumberReadBack.confirmationPrompt(items, language.code, dates)
                    speakPrompt(pendingPrompt)
                }
                submit()
            }
        ) { Text(if (loading) "Please wait…" else "Ask") }

        // Read-back card: the server held the answer until these are confirmed.
        if (pendingToken.isNotBlank() || pendingItems.isNotEmpty()) {
            Card(
                Modifier.fillMaxWidth().padding(top = 10.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.tertiaryContainer),
            ) {
                Column(Modifier.padding(14.dp)) {
                    Text("Please confirm the numbers and dates", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(6.dp))
                    Text(
                        pendingPrompt.ifBlank { NumberReadBack.confirmationPrompt(pendingItems, language.code, pendingDates) },
                        style = MaterialTheme.typography.bodyLarge,
                    )
                    pendingItems.filter { it.confusions.isNotEmpty() }.forEach { item ->
                        item.confusions.forEach { Text("• $it", color = MaterialTheme.colorScheme.error) }
                    }
                    pendingDates.filter { it.ambiguous }.forEach { date ->
                        Text("• ${date.display} — ${date.readBack(language.code)}", color = MaterialTheme.colorScheme.error)
                    }
                    Spacer(Modifier.height(10.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            enabled = !loading,
                            onClick = { resolveConfirmation(true, null) },
                        ) { Text("Yes, correct") }
                        OutlinedButton(
                            enabled = !loading,
                            onClick = { resolveConfirmation(false, null) },
                        ) { Text("No, I will fix it") }
                        TextButton(onClick = { startListening("confirm") }) { Text("Say yes") }
                        TextButton(onClick = { speakPrompt(pendingPrompt) }) { Text("Hear again") }
                    }
                }
            }
        }

        StatusText(status, status.contains("Unable"))
        if (answer.isNotBlank()) {
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text("Assistant response", style = MaterialTheme.typography.titleMedium)
                    if (answerLanguage != language.code) {
                        Text(
                            "Answered in ${AppLanguage.fromCode(answerLanguage).nativeName}",
                            style = MaterialTheme.typography.labelSmall,
                        )
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(answer, style = MaterialTheme.typography.bodyLarge)
                    if (answerAmounts.isNotEmpty()) {
                        Spacer(Modifier.height(10.dp))
                        Text("Check these amounts", style = MaterialTheme.typography.titleSmall)
                        answerAmounts.forEach { Text("${it.display} — ${it.spoken(language.code)}") }
                    }
                    if (factAsOf.isNotBlank()) {
                        Spacer(Modifier.height(10.dp))
                        Text("This rule was checked on $factAsOf", style = MaterialTheme.typography.labelSmall)
                        if (factVerifyAt.isNotBlank()) {
                            Text("Verify at $factVerifyAt", style = MaterialTheme.typography.labelSmall)
                        }
                        if (factVerifyUrl.isNotBlank()) {
                            TextButton(onClick = { openUrl(context, factVerifyUrl) }, contentPadding = PaddingValues(0.dp)) {
                                Text("Open the official page")
                            }
                        }
                    }
                    if (verifyNotice.isNotBlank()) {
                        Spacer(Modifier.height(10.dp))
                        Text("⚠ $verifyNotice", color = MaterialTheme.colorScheme.error)
                    }
                    if (sources.isNotBlank()) {
                        Spacer(Modifier.height(10.dp))
                        Text("Trusted sources", style = MaterialTheme.typography.titleSmall)
                        Text(sources)
                    }
                    Spacer(Modifier.height(12.dp))
                    OutlinedButton(onClick = {
                        tts.language = ttsLocaleFor(answerLanguage)
                        if (answerSpeech.isNotEmpty()) {
                            // Speak amounts and dates one by one, so a misheard
                            // figure cannot slip through (hurdle 3).
                            answerSpeech.forEach { segment ->
                                when (segment.type) {
                                    "text" -> tts.speak(segment.text, TextToSpeech.QUEUE_ADD, null, "seg")
                                    else -> tts.speak("${segment.text}: ${segment.readBack}", TextToSpeech.QUEUE_ADD, null, "num")
                                }
                            }
                        } else {
                            tts.speak(answer, TextToSpeech.QUEUE_FLUSH, null, "answer")
                            answerAmounts.forEach {
                                tts.speak("${it.display}: ${it.readBack(language.code)}", TextToSpeech.QUEUE_ADD, null, "amount")
                            }
                        }
                        if (verifyNotice.isNotBlank()) tts.speak(verifyNotice, TextToSpeech.QUEUE_ADD, null, "verify")
                    }) { Text("Read answer aloud") }
                }
            }
        }
    }
}

@Composable
fun SchemesFeatureScreen(language: AppLanguage) {
    val context = LocalContext.current
    val pack by rememberPackStatus()
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
                // Offline: fall back to the downloaded pack (and say how old it is).
                val cached = runCatching {
                    (context.applicationContext as RuralApp).container.database.schemeDao().getByLanguage(language.code)
                }.getOrDefault(emptyList()).filter { q.isBlank() || it.name.contains(q, true) || it.description.contains(q, true) }
                if (cached.isNotEmpty()) {
                    items = cached.map {
                        JsonObject().apply {
                            addProperty("id", it.id.substringBefore("|"))
                            addProperty("name", it.name); addProperty("description", it.description)
                            addProperty("eligibility", it.eligibility)
                        }
                    }
                    status = "Offline: showing ${items.size} saved schemes."
                } else status = e.message ?: "Could not load schemes."
            }
        }
    }
    // Reload when the downloaded pack changes so newer rules replace old ones.
    LaunchedEffect(pack.version) { load() }

    Page("Government schemes") {
        FreshnessBanner(pack, language)
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
            val amounts = amountsIn(descriptionText)
            if (amounts.isNotEmpty()) {
                Spacer(Modifier.height(8.dp))
                Text("Amounts: " + amounts.joinToString(", ") { it.display } + " — confirm on the official portal before applying.",
                    color = if (pack.stale) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface)
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
            // When was this rule last checked, and where can it be confirmed?
            // A scheme's amount or last date may have moved since the download.
            val asOf = item.str("asOf")
            val verifyAt = item.str("verifyAt")
            val verifyUrl = item.str("verifyUrl")
            if (asOf.isNotBlank()) {
                Spacer(Modifier.height(10.dp))
                Text("This rule was checked on $asOf", style = MaterialTheme.typography.labelSmall)
                if (verifyAt.isNotBlank()) Text("Verify at $verifyAt", style = MaterialTheme.typography.labelSmall)
                if (verifyUrl.isNotBlank()) {
                    TextButton(onClick = { openUrl(context, verifyUrl) }, contentPadding = PaddingValues(0.dp)) {
                        Text("Open the official page")
                    }
                }
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
