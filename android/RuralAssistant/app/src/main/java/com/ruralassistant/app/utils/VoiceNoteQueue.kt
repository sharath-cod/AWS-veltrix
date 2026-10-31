package com.ruralassistant.app.utils

import android.content.Context
import com.google.gson.JsonObject
import com.ruralassistant.app.BuildConfig
import com.ruralassistant.app.data.remote.api.FeatureApiClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

/**
 * A spoken question is never lost to a bad network.
 *
 * Hindi and Kannada voice input needs either the offline language pack or the
 * network. When neither is available the phone keeps the recording instead of
 * throwing it away: the clip waits in app storage and is turned into text by the
 * server's /api/transcribe the moment the phone is back online. The user sees
 * "saved — it will be converted when you are online" and the text appears in the
 * question box next time.
 *
 * Files live in filesDir/voice-notes, with a small .json sidecar holding the
 * language, so a queued note survives a restart.
 */
object VoiceNoteQueue {

    private const val DIR = "voice-notes"
    private const val MAX_NOTES = 20

    data class Pending(val file: File, val language: String, val createdAt: Long)

    private fun dir(context: Context): File =
        File(context.applicationContext.filesDir, DIR).apply { if (!exists()) mkdirs() }

    private fun sidecar(audio: File) = File(audio.parentFile, "${audio.nameWithoutExtension}.json")

    /** Keep a recording for later transcription. Returns false if the queue is full. */
    fun enqueue(context: Context, bytes: ByteArray, language: String): Boolean {
        if (pending(context).size >= MAX_NOTES) return false
        return try {
            val stamp = System.currentTimeMillis()
            val audio = File(dir(context), "note-$stamp.m4a")
            audio.writeBytes(bytes)
            sidecar(audio).writeText("""{"language":"$language","createdAt":$stamp}""")
            true
        } catch (_: Exception) {
            false
        }
    }

    fun pending(context: Context): List<Pending> {
        val files = dir(context).listFiles { f -> f.extension == "m4a" } ?: return emptyList()
        return files.sortedBy { it.name }.map { audio ->
            val language = try {
                val json = sidecar(audio).takeIf { it.exists() }?.readText().orEmpty()
                // Escaped rather than a raw string: a raw string ending in a
                // quote is legal Kotlin but very easy to misread.
                Regex("\"language\"\\s*:\\s*\"([a-z]{2})\"").find(json)?.groupValues?.get(1) ?: "auto"
            } catch (_: Exception) {
                "auto"
            }
            Pending(audio, language, audio.lastModified())
        }
    }

    fun count(context: Context): Int = pending(context).size

    /**
     * Upload every queued clip and turn it into text.
     * @param onText called with (transcript, language) for each clip that comes back
     * @return how many were transcribed and removed
     */
    suspend fun flush(context: Context, onText: (String, String) -> Unit): Int = withContext(Dispatchers.IO) {
        val notes = pending(context)
        if (notes.isEmpty()) return@withContext 0
        val api = FeatureApiClient.create(BuildConfig.API_BASE_URL)
        val deviceId = DeviceId.get(context)
        var done = 0
        for (note in notes) {
            try {
                val body = note.file.readBytes().toRequestBody("audio/mp4".toMediaType())
                val response = api.transcribe(deviceId, note.language, body)
                val data = response.getAsJsonObject("data") ?: JsonObject()
                val text = data.get("transcript")?.asString.orEmpty().trim()
                if (text.isNotEmpty()) {
                    val lang = data.get("language")?.asString ?: note.language
                    onText(text, lang)
                    note.file.delete()
                    sidecar(note.file).delete()
                    done += 1
                }
            } catch (_: Exception) {
                // Still offline or the server refused: keep the clip for next time.
                break
            }
        }
        done
    }
}
