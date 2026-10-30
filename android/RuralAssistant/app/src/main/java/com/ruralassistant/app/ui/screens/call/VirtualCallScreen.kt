package com.ruralassistant.app.ui.screens.call

import android.Manifest
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.speech.tts.TextToSpeech
import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import android.content.pm.PackageManager
import com.google.gson.JsonObject
import com.ruralassistant.app.BuildConfig
import com.ruralassistant.app.data.remote.api.FeatureApiClient
import com.ruralassistant.app.domain.model.AppLanguage
import com.ruralassistant.app.utils.DeviceId
import com.ruralassistant.app.utils.NumberReadBack
import kotlinx.coroutines.launch
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.MediaType.Companion.toMediaType
import java.io.File
import java.util.Locale

/**
 * Simulated voice conversation.
 *
 * Hurdle 3 lives here in its hardest form: the user is speaking, so an amount
 * can be misheard. With confirm=true the server does not answer a question that
 * contains an amount, an ID or an ambiguous date. It reads the number back,
 * returns a token, and only answers once the user says yes — in English, Hindi
 * or Kannada.
 */
@Composable
fun VirtualCallScreen(language: AppLanguage) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val api = remember { FeatureApiClient.create(BuildConfig.API_BASE_URL) }
    val deviceId = remember { DeviceId.get(context) }
    var sessionId by remember { mutableStateOf<String?>(null) }
    var recorder by remember { mutableStateOf<MediaRecorder?>(null) }
    var recordingFile by remember { mutableStateOf<File?>(null) }
    var isRecording by remember { mutableStateOf(false) }
    var busy by remember { mutableStateOf(false) }
    var status by remember { mutableStateOf("Start a virtual call, then record your question.") }
    var transcript by remember { mutableStateOf("") }
    var answer by remember { mutableStateOf("") }
    var player by remember { mutableStateOf<MediaPlayer?>(null) }
    // Read-back state: the server is holding an answer until we confirm.
    var pendingToken by remember { mutableStateOf("") }
    var pendingPrompt by remember { mutableStateOf("") }
    var confirmedNote by remember { mutableStateOf("") }
    val tts = remember { TextToSpeech(context) {} }

    fun ttsLocale() = when (language) {
        AppLanguage.KANNADA -> Locale("kn", "IN"); AppLanguage.HINDI -> Locale("hi", "IN"); else -> Locale.US
    }

    fun speak(text: String) {
        if (text.isBlank()) return
        tts.language = ttsLocale()
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "voice")
    }

    fun playReply(encoded: String) {
        if (encoded.isBlank()) return
        val audio = Base64.decode(encoded, Base64.DEFAULT)
        val output = File(context.cacheDir, "assistant_reply.mp3")
        output.writeBytes(audio)
        player?.release()
        player = MediaPlayer().apply {
            setDataSource(output.absolutePath)
            setOnCompletionListener { it.release(); player = null }
            prepare()
            start()
        }
    }

    /** Read one server response, whichever path it came from. */
    fun handleResponse(data: JsonObject?) {
        if (data == null) return
        transcript = data.get("transcript")?.asString.orEmpty()
        answer = data.get("answer")?.asString.orEmpty()
        val encoded = data.get("audio")?.asString.orEmpty()

        if (data.get("requiresConfirmation")?.asBoolean == true) {
            pendingToken = data.get("confirmationToken")?.asString.orEmpty()
            pendingPrompt = answer
            status = "Please confirm the amount, then say yes."
            if (encoded.isNotBlank()) playReply(encoded) else speak(pendingPrompt)
            return
        }

        val cancelled = data.get("cancelled")?.asBoolean == true
        if (cancelled) {
            pendingToken = ""; pendingPrompt = ""
            status = answer.ifBlank { "Cancelled. Please record the question again." }
            if (encoded.isNotBlank()) playReply(encoded) else speak(status)
            return
        }

        val retry = data.get("retryConfirmation")?.asBoolean == true
        if (retry) {
            status = "Please say yes or no."
            speak(status)
            return
        }

        pendingToken = ""; pendingPrompt = ""
        // What was confirmed, read back for the record.
        confirmedNote = data.getAsJsonArray("confirmedNumbers")?.mapNotNull { el ->
            val o = el.asJsonObject
            val display = o.get("display")?.asString ?: return@mapNotNull null
            val readBack = o.getAsJsonObject("readBack")?.get(language.code)?.asString.orEmpty()
            if (readBack.isBlank()) display else "$display — $readBack"
        }?.joinToString("; ").orEmpty()

        if (encoded.isNotBlank()) {
            playReply(encoded)
            status = "Assistant replied. You can record another turn."
        } else {
            status = "Answer received, but spoken audio is unavailable. $answer"
            speak(answer)
        }
    }

    /** Send a turn: recorded audio, or a bare "haan"/"illa" when confirming. */
    fun sendTurn(audioBytes: ByteArray?, token: String?, transcriptText: String?) {
        busy = true
        scope.launch {
            try {
                val body = (audioBytes ?: ByteArray(0)).toRequestBody("audio/mp4".toMediaType())
                val response = api.voiceTurn(
                    deviceId = deviceId,
                    id = sessionId!!,
                    language = language.code,
                    confirm = true,
                    confirmationToken = token,
                    transcript = transcriptText,
                    audio = body,
                )
                handleResponse(response.getAsJsonObject("data"))
            } catch (e: Exception) {
                status = e.message ?: "Could not process this voice turn. Check speech API configuration."
            } finally {
                busy = false
            }
        }
    }

    fun startRecording() {
        try {
            val file = File(context.cacheDir, "voice_turn_${System.currentTimeMillis()}.m4a")
            val mediaRecorder = MediaRecorder()
            mediaRecorder.setAudioSource(MediaRecorder.AudioSource.MIC)
            mediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            mediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            mediaRecorder.setAudioSamplingRate(16000)
            mediaRecorder.setAudioEncodingBitRate(64000)
            mediaRecorder.setOutputFile(file.absolutePath)
            mediaRecorder.prepare()
            mediaRecorder.start()
            recorder = mediaRecorder
            recordingFile = file
            isRecording = true
            status = "Recording… Tap Stop when you finish speaking."
        } catch (e: Exception) {
            status = e.message ?: "Could not start microphone recording."
            recorder?.release()
            recorder = null
            isRecording = false
        }
    }

    fun stopAndSend() {
        val activeRecorder = recorder ?: return
        val file = recordingFile
        try {
            activeRecorder.stop()
        } catch (_: Exception) {
            status = "Recording was too short. Please try again."
        } finally {
            activeRecorder.reset()
            activeRecorder.release()
            recorder = null
            isRecording = false
        }
        if (file == null || !file.exists() || file.length() == 0L) return
        status = "Understanding your question…"
        sendTurn(file.readBytes(), null, null)
        file.delete()
    }

    val micPermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) startRecording() else status = "Microphone permission is required."
    }

    DisposableEffect(Unit) {
        onDispose {
            try { recorder?.stop() } catch (_: Exception) {}
            recorder?.release()
            player?.release()
            tts.shutdown()
        }
    }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Virtual voice call", style = MaterialTheme.typography.headlineMedium)
        Text("A simulated internet voice conversation. This is not a telephone-network call.")
        if (sessionId == null) {
            Button(
                modifier = Modifier.fillMaxWidth(),
                enabled = !busy,
                onClick = {
                    scope.launch {
                        busy = true
                        try {
                            val body = JsonObject().apply { addProperty("language", language.code) }
                            val result = api.startVoiceSession(deviceId, body).getAsJsonObject("data")
                            sessionId = result?.get("id")?.asString
                            status = if (sessionId != null) "Call connected. Tap Record to speak." else "Could not start a session."
                        } catch (e: Exception) { status = e.message ?: "Could not start call." }
                        finally { busy = false }
                    }
                }
            ) { Text(if (busy) "Connecting…" else "Start call") }
        } else {
            Text("Connected · Session active", color = MaterialTheme.colorScheme.primary)
            Button(
                modifier = Modifier.fillMaxWidth(),
                enabled = !busy && pendingToken.isBlank(),
                onClick = {
                    if (isRecording) stopAndSend()
                    else if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) startRecording()
                    else micPermission.launch(Manifest.permission.RECORD_AUDIO)
                }
            ) { Text(if (isRecording) "Stop and send" else if (busy) "Processing…" else "Record question") }
            OutlinedButton(
                modifier = Modifier.fillMaxWidth(),
                enabled = !busy && !isRecording,
                onClick = {
                    val id = sessionId ?: return@OutlinedButton
                    scope.launch {
                        busy = true
                        try {
                            api.endVoiceSession(id); sessionId = null; transcript = ""; answer = ""
                            pendingToken = ""; pendingPrompt = ""; confirmedNote = ""
                            status = "Call ended."
                        } catch (e: Exception) { status = e.message ?: "Could not end call." }
                        finally { busy = false }
                    }
                }
            ) { Text("End call") }
        }
        Text(status, color = MaterialTheme.colorScheme.primary)

        // Read-back card: the answer is held until the user confirms.
        if (pendingToken.isNotBlank()) {
            Card(
                Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.tertiaryContainer),
            ) {
                Column(Modifier.padding(14.dp)) {
                    Text("Please confirm", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(6.dp))
                    Text(pendingPrompt, style = MaterialTheme.typography.bodyLarge)
                    Spacer(Modifier.height(10.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(enabled = !busy, onClick = { sendTurn(null, pendingToken, "haan") }) { Text("Yes, correct") }
                        OutlinedButton(enabled = !busy, onClick = { sendTurn(null, pendingToken, "nahi") }) { Text("No, fix it") }
                        TextButton(onClick = { speak(pendingPrompt) }) { Text("Hear again") }
                    }
                }
            }
        }

        if (transcript.isNotBlank()) {
            Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(14.dp)) {
                Text("You said", style = MaterialTheme.typography.titleSmall)
                Text(transcript)
            } }
        }
        if (confirmedNote.isNotBlank()) {
            Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(14.dp)) {
                Text("Confirmed amount", style = MaterialTheme.typography.titleSmall)
                Text(confirmedNote)
            } }
        }
        if (answer.isNotBlank() && pendingToken.isBlank()) {
            Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(14.dp)) {
                Text("GramSahayak", style = MaterialTheme.typography.titleSmall)
                Text(answer)
            } }
        }
    }
}
