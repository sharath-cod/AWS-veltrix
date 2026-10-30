package com.ruralassistant.app.ui.screens.call

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.media.MediaRecorder
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.CallEnd
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.PhoneInTalk
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.google.gson.JsonObject
import com.ruralassistant.app.BuildConfig
import com.ruralassistant.app.R
import com.ruralassistant.app.data.remote.api.FeatureApiClient
import com.ruralassistant.app.domain.model.AppLanguage
import com.ruralassistant.app.utils.DeviceId
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.util.Locale
import java.util.concurrent.atomic.AtomicBoolean

/**
 * The call simulation.
 *
 * Tap the call logo on Home and the assistant picks up: it greets the user,
 * listens, and answers whatever is asked, in whichever supported language is
 * spoken. Nothing has to be typed — but a "type instead" box is there for
 * phones with no speech recognition, so the call always works.
 *
 * It works in two modes, so a half-deployed setup still answers questions:
 *
 *   server call  — POST /api/calls (full features: small talk, medical triage,
 *                  108 redirects, eleven languages).
 *   basic call   — if that endpoint is missing (older backend) or unreachable at
 *                  start-up, the call keeps going on POST /api/query, with the
 *                  emergency check done on the phone.
 *
 * Medical safety holds in both modes: red flags (chest pain, bleeding, fits,
 * snake bite, poisoning, self-harm …) get 108 / 14416 and a tappable dial
 * button instead of a chat answer, and a medical question the assistant is not
 * sure about points at 104 / 108.
 */
private data class Bubble(val fromUser: Boolean, val text: String, val language: String)

private data class Redirect(val numbers: List<Pair<String, String>>)

@Composable
fun CallScreen(
    language: AppLanguage,
    onBack: () -> Unit = {},
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val api = remember { FeatureApiClient.create(BuildConfig.API_BASE_URL) }
    val deviceId = remember { DeviceId.get(context) }

    var phase by remember { mutableStateOf("dialing") }   // dialing | connected | ended
    var mode by remember { mutableStateOf("server") }     // server | basic
    var sessionId by remember { mutableStateOf<String?>(null) }
    var bubbles by remember { mutableStateOf(listOf<Bubble>()) }
    var status by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var listening by remember { mutableStateOf(false) }
    var muted by remember { mutableStateOf(false) }
    var answerLanguage by remember { mutableStateOf(language.code) }
    var redirect by remember { mutableStateOf<Redirect?>(null) }
    var recording by remember { mutableStateOf(false) }
    var typed by remember { mutableStateOf("") }
    var retries by remember { mutableStateOf(0) }

    val tts = remember { TextToSpeech(context) {} }
    val recognizer = remember {
        if (SpeechRecognizer.isRecognitionAvailable(context)) SpeechRecognizer.createSpeechRecognizer(context) else null
    }
    val recorder = remember { mutableStateOf<MediaRecorder?>(null) }
    val recordingFile = remember { mutableStateOf<File?>(null) }
    val afterSpeak = remember { mutableStateOf<(() -> Unit)?>(null) }
    // The turn loop is circular (answer -> listen -> answer); a ref breaks the
    // forward reference that Kotlin local functions cannot express.
    val listenRef = remember { mutableStateOf<(() -> Unit)?>(null) }
    val listState = rememberLazyListState()
    val main = remember { Handler(Looper.getMainLooper()) }

    fun ttsLocaleFor(code: String) = when (code) {
        "kn" -> Locale("kn", "IN"); "hi" -> Locale("hi", "IN"); "ta" -> Locale("ta", "IN")
        "te" -> Locale("te", "IN"); "bn" -> Locale("bn", "IN"); "mr" -> Locale("mr", "IN")
        "gu" -> Locale("gu", "IN"); "ml" -> Locale("ml", "IN"); "pa" -> Locale("pa", "IN")
        "ur" -> Locale("ur", "IN"); else -> Locale("en", "IN")
    }

    DisposableEffect(Unit) {
        tts.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) {}
            override fun onDone(utteranceId: String?) {
                main.post {
                    val next = afterSpeak.value
                    afterSpeak.value = null
                    next?.invoke()
                }
            }
            override fun onError(utteranceId: String?) {
                main.post {
                    val next = afterSpeak.value
                    afterSpeak.value = null
                    next?.invoke()
                }
            }
        })
        onDispose {
            try { tts.stop() } catch (_: Exception) {}
            tts.shutdown()
            recognizer?.destroy()
            try { recorder.value?.release() } catch (_: Exception) {}
        }
    }

    /**
     * Speak an answer, then do the next thing (usually: listen again). A timeout
     * guards against a phone whose text-to-speech never reports completion, so
     * the conversation can never get stuck waiting for a voice.
     */
    fun speak(text: String, code: String, then: (() -> Unit)? = null) {
        if (text.isBlank()) { then?.invoke(); return }
        val done = AtomicBoolean(false)
        val proceed = {
            if (done.compareAndSet(false, true)) {
                afterSpeak.value = null
                then?.invoke()
            }
        }
        afterSpeak.value = proceed
        tts.language = ttsLocaleFor(code)
        try {
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "call-${System.currentTimeMillis()}")
        } catch (_: Exception) {
            // No speech engine: the text is on screen, so carry on.
            proceed()
            return
        }
        val estimate = (text.length * 90L).coerceIn(2000L, 18000L)
        scope.launch { delay(estimate); proceed() }
    }

    fun addBubble(fromUser: Boolean, text: String, code: String) {
        if (text.isBlank()) return
        bubbles = bubbles + Bubble(fromUser, text, code)
        scope.launch { listState.animateScrollToItem((bubbles.size - 1).coerceAtLeast(0)) }
    }

    // ------------------------------------------------------------ one call turn
    fun showRedirect(numbers: List<Pair<String, String>>) {
        redirect = if (numbers.isEmpty()) null else Redirect(numbers)
    }

    fun handleTurn(data: JsonObject?) {
        if (data == null) { status = "Empty reply from the assistant."; return }
        val said = data.get("transcript")?.asString.orEmpty()
        if (said.isNotBlank() && bubbles.none { it.fromUser && it.text == said }) addBubble(true, said, answerLanguage)
        val code = data.get("language")?.asString
            ?: data.get("answerLanguage")?.asString
            ?: answerLanguage
        answerLanguage = code
        val answer = data.get("answer")?.asString.orEmpty()
        addBubble(false, answer, code)

        // Emergency, or "I am not sure", comes back with numbers to call.
        val redirectJson = data.getAsJsonObject("redirect")
        if (redirectJson != null) {
            val numbers = redirectJson.getAsJsonArray("numbers")?.mapNotNull { el ->
                val o = el.asJsonObject
                val number = o.get("number")?.asString ?: return@mapNotNull null
                number to (o.get("label")?.asString ?: "")
            } ?: emptyList()
            showRedirect(numbers)
        }

        val urgent = data.get("urgency")?.asString == "urgent"
        val ended = data.get("endCall")?.asBoolean == true || data.get("status")?.asString == "ended"
        status = if (urgent) context.getString(R.string.call_emergency) else context.getString(R.string.call_connected)
        retries = 0
        speak(answer, code) {
            when {
                ended -> { phase = "ended"; status = context.getString(R.string.call_ended) }
                !muted -> listenRef.value?.invoke()
            }
        }
    }

    /** The full call endpoint is not on this server: answer through /api/query. */
    fun sendBasicTurn(transcript: String) {
        val lang = answerLanguage
        // Emergency first — this is the safety rule, kept on the phone too.
        val emergency = localEmergency(transcript, lang)
        if (emergency != null) {
            addBubble(false, emergency, lang)
            showRedirect(listOf("108" to "Ambulance"))
            status = context.getString(R.string.call_emergency)
            speak(emergency, lang) { if (!muted) listenRef.value?.invoke() }
            return
        }
        val small = localSmallTalk(transcript, lang)
        if (small != null) {
            addBubble(false, small, lang)
            speak(small, lang) { if (!muted) listenRef.value?.invoke() }
            return
        }

        busy = true
        status = context.getString(R.string.call_thinking)
        scope.launch {
            try {
                val body = JsonObject().apply {
                    addProperty("question", transcript)
                    addProperty("language", "auto")
                    addProperty("category", "general")
                }
                val data = api.ask(deviceId, body).getAsJsonObject("data")
                val code = data?.get("answerLanguage")?.asString
                    ?: data?.get("language")?.asString
                    ?: lang
                answerLanguage = code
                val grounded = data?.get("grounded")?.asBoolean == true
                var answer = data?.get("answer")?.asString.orEmpty()
                if (!grounded && looksMedical(transcript)) {
                    // No verified answer to a medical question: never guess.
                    answer = localUncertain(code)
                    showRedirect(listOf("104" to "Health advice", "108" to "Ambulance"))
                }
                addBubble(false, answer.ifBlank { "I could not reach the assistant. Please try again." }, code)
                status = context.getString(R.string.call_connected)
                retries = 0
                speak(answer, code) { if (!muted) listenRef.value?.invoke() }
            } catch (e: Exception) {
                val sorry = "I cannot reach the assistant right now. Please check the internet and try again."
                addBubble(false, sorry, lang)
                status = e.message ?: sorry
            } finally {
                busy = false
            }
        }
    }

    fun sendTurn(transcript: String?, audioBytes: ByteArray?) {
        if (transcript != null) addBubble(true, transcript, answerLanguage)
        if (mode == "basic") {
            if (transcript != null) sendBasicTurn(transcript)
            else status = "Please type your question instead."
            return
        }
        val id = sessionId
        if (id == null) { if (transcript != null) sendBasicTurn(transcript); return }
        busy = true
        status = context.getString(R.string.call_thinking)
        scope.launch {
            try {
                val body = (audioBytes ?: ByteArray(0)).toRequestBody("audio/mp4".toMediaType())
                val response = api.callTurn(deviceId = deviceId, id = id, transcript = transcript, audio = body)
                handleTurn(response.getAsJsonObject("data"))
            } catch (e: Exception) {
                // The call endpoint went away mid-call: keep the conversation going.
                mode = "basic"
                sessionId = null
                if (transcript != null) sendBasicTurn(transcript)
                else status = e.message ?: "Could not reach the assistant."
            } finally {
                busy = false
            }
        }
    }

    // ------------------------------------------------------------- recording
    fun startRecording() {
        try {
            val file = File(context.cacheDir, "call_turn_${System.currentTimeMillis()}.m4a")
            val mr = MediaRecorder()
            mr.setAudioSource(MediaRecorder.AudioSource.MIC)
            mr.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            mr.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            mr.setAudioSamplingRate(16000)
            mr.setAudioEncodingBitRate(64000)
            mr.setOutputFile(file.absolutePath)
            mr.prepare()
            mr.start()
            recorder.value = mr
            recordingFile.value = file
            recording = true
            status = context.getString(R.string.call_listening)
        } catch (e: Exception) {
            status = e.message ?: "Could not start recording."
            recording = false
        }
    }

    fun stopRecordingAndSend() {
        val mr = recorder.value ?: return
        val file = recordingFile.value
        try { mr.stop() } catch (_: Exception) { status = context.getString(R.string.call_retry) }
        try { mr.reset(); mr.release() } catch (_: Exception) {}
        recorder.value = null
        recording = false
        if (file == null || !file.exists() || file.length() == 0L) return
        val bytes = runCatching { file.readBytes() }.getOrNull()
        file.delete()
        if (bytes != null) sendTurn(null, bytes)
    }

    // -------------------------------------------------------------- listening
    fun startListening() {
        if (muted || phase == "ended") return
        if (recognizer == null) {
            // No on-device recogniser: record and let the server transcribe.
            if (mode == "server") startRecording() else status = "Type your question below."
            return
        }
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            // Ask for the language the assistant last answered in, so a caller who
            // switched language mid-call keeps being understood.
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, when (answerLanguage) {
                "kn" -> "kn-IN"; "hi" -> "hi-IN"; "ta" -> "ta-IN"; "te" -> "te-IN"
                "bn" -> "bn-IN"; "mr" -> "mr-IN"; "gu" -> "gu-IN"; "ml" -> "ml-IN"
                "pa" -> "pa-IN"; "ur" -> "ur-IN"; else -> "en-IN"
            })
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
        }
        recognizer.setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {
                listening = true
                status = context.getString(R.string.call_listening)
            }
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {}
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() { listening = false }
            override fun onError(error: Int) {
                listening = false
                // Silence is normal in a call: try twice more, then let the user tap.
                if (retries < 2 && !muted) {
                    retries += 1
                    status = context.getString(R.string.call_retry)
                    scope.launch { delay(900); listenRef.value?.invoke() }
                } else {
                    status = context.getString(R.string.call_retry)
                }
            }
            override fun onResults(results: Bundle?) {
                listening = false
                val heard = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull().orEmpty()
                if (heard.isBlank()) status = context.getString(R.string.call_retry) else sendTurn(heard, null)
            }
            override fun onPartialResults(partialResults: Bundle?) {}
            override fun onEvent(eventType: Int, params: Bundle?) {}
        })
        try {
            recognizer.startListening(intent)
        } catch (e: Exception) {
            status = e.message ?: context.getString(R.string.call_retry)
        }
    }
    listenRef.value = { startListening() }

    // ----------------------------------------------------------- call control
    fun startCall() {
        phase = "dialing"
        status = context.getString(R.string.call_connecting)
        bubbles = emptyList()
        redirect = null
        scope.launch {
            try {
                val body = JsonObject().apply {
                    // auto: the assistant answers in whatever language the caller uses.
                    addProperty("language", "auto")
                    addProperty("uiLanguage", language.code)
                }
                val data = api.startCall(deviceId, body).getAsJsonObject("data")
                val id = data?.get("id")?.asString
                if (id.isNullOrBlank()) throw IllegalStateException("no call id")
                sessionId = id
                mode = "server"
                val greetingLang = data.get("greeting")?.asJsonObject?.get("language")?.asString ?: language.code
                answerLanguage = greetingLang
                delay(data.get("pickupDelayMs")?.asLong ?: 1200L)
                phase = "connected"
                status = context.getString(R.string.call_connected)
                val greeting = data.get("greeting")?.asJsonObject?.get("text")?.asString.orEmpty()
                addBubble(false, greeting, greetingLang)
                speak(greeting, greetingLang) { if (!muted) listenRef.value?.invoke() }
            } catch (e: Exception) {
                // Older backend or a cold start: run the call on /api/query instead,
                // so pressing the call button still gets the user an answer.
                mode = "basic"
                sessionId = null
                phase = "connected"
                status = context.getString(R.string.call_connected)
                val greeting = localGreeting(language.code)
                addBubble(false, greeting, language.code)
                speak(greeting, language.code) { if (!muted) listenRef.value?.invoke() }
            }
        }
    }

    fun hangUp() {
        val id = sessionId
        try { tts.stop() } catch (_: Exception) {}
        afterSpeak.value = null
        if (id == null) { phase = "ended"; return }
        scope.launch {
            try { api.endCall(deviceId, id) } catch (_: Exception) {}
            phase = "ended"
            status = context.getString(R.string.call_ended)
        }
    }

    val micPermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { _ ->
        // Whether or not the mic is allowed, the call goes ahead: the user can type.
        startCall()
    }

    // Auto-dial: the user already pressed the call logo.
    LaunchedEffect(Unit) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
            startCall()
        } else {
            micPermission.launch(Manifest.permission.RECORD_AUDIO)
        }
    }

    // ------------------------------------------------------------------ screen
    val isEnded = phase == "ended"
    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier.size(44.dp).clip(CircleShape)
                    .background(if (phase == "connected") MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.secondary),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = if (phase == "connected") Icons.Filled.PhoneInTalk else Icons.Filled.Call,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onPrimary,
                )
            }
            Spacer(Modifier.width(12.dp))
            Column {
                Text(
                    stringResource(R.string.call_ai),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    when (phase) {
                        "dialing" -> stringResource(R.string.call_connecting)
                        "connected" -> stringResource(R.string.call_connected)
                        else -> stringResource(R.string.call_ended)
                    },
                    style = MaterialTheme.typography.bodySmall,
                )
            }
        }
        Spacer(Modifier.height(10.dp))
        if (status.isNotBlank()) {
            Text(status, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.primary)
        }
        if (phase == "connected" && answerLanguage != language.code) {
            Text(
                "Answering in ${languageName(answerLanguage)}",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.secondary,
            )
        }

        redirect?.let { info ->
            Card(
                Modifier.fillMaxWidth().padding(vertical = 10.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
            ) {
                Column(Modifier.padding(14.dp)) {
                    Text(stringResource(R.string.call_emergency), style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        info.numbers.forEach { pair ->
                            val number = pair.first
                            val label = pair.second
                            Button(onClick = {
                                try {
                                    context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$number")))
                                } catch (_: Exception) {
                                    // No dialer on the device: the number is on screen anyway.
                                }
                            }) {
                                Icon(Icons.Filled.Call, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(6.dp))
                                Text(if (label.isBlank()) number else "$number · $label")
                            }
                        }
                    }
                }
            }
        }

        LazyColumn(
            state = listState,
            modifier = Modifier.weight(1f).fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            items(bubbles) { bubble ->
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = if (bubble.fromUser) Arrangement.End else Arrangement.Start,
                ) {
                    Card(
                        Modifier.widthIn(max = 320.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (bubble.fromUser) MaterialTheme.colorScheme.primaryContainer
                            else MaterialTheme.colorScheme.surfaceVariant,
                        ),
                        shape = RoundedCornerShape(18.dp),
                    ) {
                        Column(Modifier.padding(12.dp)) {
                            Text(
                                if (bubble.fromUser) stringResource(R.string.call_you) else stringResource(R.string.call_ai),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            Spacer(Modifier.height(2.dp))
                            Text(bubble.text, style = MaterialTheme.typography.bodyLarge)
                        }
                    }
                }
            }
        }

        // Typing fallback: always works, even with no microphone or recogniser.
        if (!isEnded) {
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(
                    value = typed,
                    onValueChange = { typed = it },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("Type your question") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                    keyboardActions = KeyboardActions(onSend = {
                        val q = typed.trim()
                        if (q.isNotEmpty() && !busy) { typed = ""; sendTurn(q, null) }
                    }),
                )
                Spacer(Modifier.width(8.dp))
                FilledIconButton(
                    onClick = {
                        val q = typed.trim()
                        if (q.isNotEmpty() && !busy) { typed = ""; sendTurn(q, null) }
                    },
                    enabled = typed.isNotBlank() && !busy,
                    modifier = Modifier.size(52.dp),
                ) {
                    Icon(Icons.Filled.Send, contentDescription = "Send")
                }
            }
        }

        Spacer(Modifier.height(10.dp))
        if (!isEnded) {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                FilledTonalIconButton(
                    onClick = {
                        muted = !muted
                        if (muted) {
                            try { recognizer?.cancel() } catch (_: Exception) {}
                            if (recording) stopRecordingAndSend()
                            listening = false
                            status = context.getString(R.string.call_mute)
                        } else {
                            listenRef.value?.invoke()
                        }
                    },
                    modifier = Modifier.size(56.dp),
                ) {
                    Icon(
                        imageVector = if (muted) Icons.Filled.MicOff else Icons.Filled.Mic,
                        contentDescription = stringResource(if (muted) R.string.call_unmute else R.string.call_mute),
                    )
                }
                Button(
                    onClick = {
                        when {
                            listening -> try { recognizer?.stopListening() } catch (_: Exception) {}
                            recording -> stopRecordingAndSend()
                            else -> listenRef.value?.invoke()
                        }
                    },
                    enabled = phase == "connected" && !busy && !muted,
                    modifier = Modifier.height(56.dp),
                ) {
                    Icon(Icons.Filled.Mic, contentDescription = null, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(
                        when {
                            listening -> stringResource(R.string.call_listening)
                            recording -> stringResource(R.string.call_thinking)
                            else -> stringResource(R.string.call_say)
                        },
                    )
                }
                IconButton(
                    onClick = { hangUp() },
                    modifier = Modifier.size(64.dp).clip(CircleShape).background(Color(0xFFD32F2F)),
                ) {
                    Icon(Icons.Filled.CallEnd, contentDescription = stringResource(R.string.call_end), tint = Color.White)
                }
            }
        } else {
            Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    stringResource(R.string.call_ended),
                    style = MaterialTheme.typography.titleMedium,
                    textAlign = TextAlign.Center,
                )
                Spacer(Modifier.height(8.dp))
                Button(onClick = { onBack() }, modifier = Modifier.fillMaxWidth()) {
                    Text("Back to home")
                }
            }
        }
    }
}

// ---------------------------------------------------------------- local helpers
// Used when the full call endpoint is not available, so the safety rules and the
// basics still work on an older backend.

private fun localGreeting(lang: String): String = when (lang) {
    "hi" -> "नमस्कार, मैं ग्रामसहायक हूँ। आप किसी भी भाषा में पूछ सकते हैं। बोलिए या नीचे लिखिए।"
    "kn" -> "ನಮಸ್ಕಾರ, ನಾನು ಗ್ರಾಮಸಹಾಯಕ್. ಯಾವುದೇ ಭಾಷೆಯಲ್ಲಿ ಕೇಳಬಹುದು. ಮಾತನಾಡಿ ಅಥವಾ ಕೆಳಗೆ ಬರೆಯಿರಿ."
    else -> "Namaskara, this is GramSahayak. Ask me anything — speak, or type below."
}

private fun localUncertain(lang: String): String = when (lang) {
    "hi" -> "इस बारे में मुझे पक्का नहीं पता। कृपया इस पर अमल न करें। स्वास्थ्य सलाह के लिए 104 पर, और ज़्यादा परेशानी हो तो 108 पर कॉल करें।"
    "kn" -> "ಇದರ ಬಗ್ಗೆ ನನಗೆ ಖಚಿತವಿಲ್ಲ, ದಯವಿಟ್ಟು ಇದನ್ನು ಪಾಲಿಸಬೇಡಿ. ಆರೋಗ್ಯ ಸಲಹೆಗೆ 104 ಗೆ, ತುರ್ತಾದರೆ 108 ಗೆ ಕರೆ ಮಾಡಿ."
    else -> "I am not sure about this, so please do not act on it. Call 104 for health advice, or 108 if it is urgent."
}

private fun localEmergency(text: String, lang: String): String? {
    val t = text.lowercase()
    val flags = listOf(
        "chest pain", "seene mein dard", "छाती में दर्द", "सीने में दर्द", "ಎದೆ ನೋವು",
        "cannot breathe", "breathless", "saans nahi", "सांस", "ದಮ ಘುಟ", "ಉಸಿರಾಟ",
        "bleeding", "khoon", "खून", "ರಕ್ತ",
        "unconscious", "behosh", "बेहोश", "fits", "daura", "दौरा", "मिर्गी", "ಪ್ರಜ್ಞೆ", "ಸೆಳವು",
        "snake", "saanp", "सांप", "ಹಾವು",
        "poison", "zeher", "जहर", "ವಿಷ",
        "suicide", "atmahatya", "आत्महत्या", "ಆತ್ಮಹತ್ಯೆ",
        "accident", "durghatna", "दुर्घटना", "ಅಪಘಾತ",
    )
    if (flags.none { t.contains(it) }) return null
    return when (lang) {
        "hi" -> "यह आपातकाल जैसा लगता है। कृपया अभी 108 पर कॉल करें। मरीज़ के पास रहें और कुछ खाने-पीने न दें।"
        "kn" -> "ಇದು ತುರ್ತು ಪರಿಸ್ಥಿತಿ ಎನಿಸುತ್ತದೆ. ದಯವಿಟ್ಟು ಈಗಲೇ 108 ಗೆ ಕರೆ ಮಾಡಿ. ರೋಗಿಯ ಬಳಿ ಇರಿ, ಏನನ್ನೂ ತಿನ್ನಲು ಕೊಡಬೇಡಿ."
        else -> "This sounds urgent. Please call 108 now. Stay with the person and do not give food or water."
    }
}

private fun looksMedical(text: String): Boolean {
    val t = text.lowercase()
    val words = listOf(
        "doctor", "dawa", "tablet", "medicine", "ilaj", "hospital", "bimar", "fever", "bukhar",
        "dard", "pain", "jwara", "noyu", "vomit", "ulti", "loose", "dast", "cough", "khansi",
        "swelling", "sujan", "wound", "ghav", "डॉक्टर", "दवा", "बुखार", "दर्द", "उल्टी", "खांसी",
        "ವೈದ್ಯ", "ಔಷಧ", "ಜ್ವರ", "ನೋವು", "ವಾಂತಿ", "ಕೆಮ್ಮು",
    )
    return words.any { t.contains(it) }
}

private fun localSmallTalk(text: String, lang: String): String? {
    val t = text.trim().lowercase()
    // No \b here: JavaScript-style word boundaries do not work on Devanagari.
    val isHello = Regex("^(hi|hello|hey)(?![a-z])|^(namaste|namaskar|namaskara|नमस्ते|नमस्कार|ನಮಸ್ಕಾರ)").containsMatchIn(t)
    val isThanks = t.contains("thank") || t.contains("dhanyavad") || t.contains("धन्यवाद") || t.contains("ಧನ್ಯವಾದ")
    val isBye = t.contains("bye") || t.contains("फोन रख") || t.contains("अलविदा") || t.contains("ಮುಗಿಸಿ")
    return when {
        isBye -> when (lang) {
            "hi" -> "नमस्ते, अपना ध्यान रखिए।"
            "kn" -> "ವಂದನೆಗಳು, ಆರೋಗ್ಯ ನೋಡಿಕೊಳ್ಳಿ."
            else -> "Goodbye, take care."
        }
        isThanks -> when (lang) {
            "hi" -> "आपका स्वागत है। कुछ और पूछना है?"
            "kn" -> "ಸ್ವಾಗತ. ಇನ್ನೇನಾದರೂ ಕೇಳಬೇಕೇ?"
            else -> "You are welcome. Anything else?"
        }
        isHello -> localGreeting(lang)
        else -> null
    }
}

private fun languageName(code: String): String = when (code) {
    "hi" -> "हिन्दी"
    "kn" -> "ಕನ್ನಡ"
    "ta" -> "தமிழ்"
    "te" -> "తెలుగు"
    "bn" -> "বাংলা"
    "mr" -> "मराठी"
    "gu" -> "ગુજરાતી"
    "ml" -> "മലയാളം"
    "pa" -> "ਪੰਜਾਬੀ"
    "ur" -> "اردو"
    else -> "English"
}
