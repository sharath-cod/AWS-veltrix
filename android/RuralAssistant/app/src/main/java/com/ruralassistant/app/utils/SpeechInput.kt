package com.ruralassistant.app.utils

import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.speech.SpeechRecognizer

/**
 * Speech input, set up so it works on as many phones as possible.
 *
 * The old code created one online recogniser and gave up when it failed. Two
 * things go wrong in a village: there is no network, and the Hindi or Kannada
 * offline language pack is not downloaded. Both used to show a bare
 * "Speech recognition error (7)".
 *
 * Here:
 *  - Android 12+ uses the on-device recogniser when the phone has one, which
 *    works with no network at all;
 *  - the caller is told, in their language, whether the problem is the network
 *    or a missing language pack, and is offered a one-tap way to fix it;
 *  - a failure never loses the question: the screen can keep the recording and
 *    transcribe it when the phone is back online (VoiceNoteQueue).
 */
object SpeechInput {

    /** BCP-47 tag the recogniser and the voice expect. */
    fun languageTag(code: String): String = when (code) {
        "hi" -> "hi-IN"
        "kn" -> "kn-IN"
        "ta" -> "ta-IN"
        "te" -> "te-IN"
        "bn" -> "bn-IN"
        "mr" -> "mr-IN"
        "gu" -> "gu-IN"
        "ml" -> "ml-IN"
        "pa" -> "pa-IN"
        "ur" -> "ur-IN"
        else -> "en-IN"
    }

    /**
     * A recogniser for this phone: on-device when the OS supports it (so it
     * keeps working offline), otherwise the normal one.
     */
    fun create(context: Context): SpeechRecognizer? {
        if (!SpeechRecognizer.isRecognitionAvailable(context)) return null
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            try {
                if (SpeechRecognizer.isOnDeviceRecognitionAvailable(context)) {
                    return SpeechRecognizer.createOnDeviceSpeechRecognizer(context)
                }
            } catch (_: Exception) {
                // Fall through to the standard recogniser.
            }
        }
        return try {
            SpeechRecognizer.createSpeechRecognizer(context)
        } catch (_: Exception) {
            null
        }
    }

    /** Is this error about the language pack rather than the network? */
    fun isLanguageProblem(error: Int): Boolean =
        error == SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED ||
            error == SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE

    /** Is this error about the network? */
    fun isNetworkProblem(error: Int): Boolean =
        error == SpeechRecognizer.ERROR_NETWORK ||
            error == SpeechRecognizer.ERROR_NETWORK_TIMEOUT ||
            error == SpeechRecognizer.ERROR_SERVER ||
            error == 10 // ERROR_SERVER_DISCONNECTED

    /** Nothing was heard: normal in a call, so retry quietly. */
    fun isSilence(error: Int): Boolean =
        error == SpeechRecognizer.ERROR_NO_MATCH ||
            error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT ||
            error == SpeechRecognizer.ERROR_CLIENT

    /** What to tell the user, in their language. */
    fun errorMessage(error: Int, lang: String): String {
        val languageName = when (lang) {
            "hi" -> "हिंदी"
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
        return when {
            isLanguageProblem(error) -> when (lang) {
                "hi" -> "इस फोन पर $languageName की आवाज़ पहचान उपलब्ध नहीं है। सेटिंग्स में भाषा डाउनलोड करें, या अपना सवाल लिखें।"
                "kn" -> "ಈ ಫೋನ್‌ನಲ್ಲಿ $languageName ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಇಲ್ಲ. ಸೆಟ್ಟಿಂಗ್ಸ್‌ನಲ್ಲಿ ಭಾಷೆ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ, ಅಥವಾ ಪ್ರಶ್ನೆ ಬರೆಯಿರಿ."
                else -> "Voice recognition for $languageName is not installed on this phone. Download the language in Settings, or type your question."
            }
            isNetworkProblem(error) -> when (lang) {
                "hi" -> "इंटरनेट बंद है, इसलिए आवाज़ नहीं पहचानी जा सकी। आप रिकॉर्ड करके रख सकते हैं — इंटरनेट आने पर उसे पाठ में बदल दिया जाएगा, या अभी लिखकर पूछें।"
                "kn" -> "ಇಂಟರ್ನೆಟ್ ಇಲ್ಲ, ಧ್ವನಿ ಗುರುತಿಸಲಾಗಲಿಲ್ಲ. ರೆಕಾರ್ಡ್ ಮಾಡಿಡಿ — ಇಂಟರ್ನೆಟ್ ಬಂದಾಗ ಪಠ್ಯವಾಗಿ ಬದಲಾಗುತ್ತದೆ, ಅಥವಾ ಈಗ ಬರೆಯಿರಿ."
                else -> "You are offline, so the voice could not be recognised. You can save the recording and it will be turned into text when the internet is back — or type now."
            }
            else -> when (lang) {
                "hi" -> "आवाज़ नहीं पकड़ पाया। फिर बोलिए, या लिखकर पूछें।"
                "kn" -> "ಧ್ವನಿ ಸಿಗಲಿಲ್ಲ. ಮತ್ತೆ ಹೇಳಿ, ಅಥವಾ ಬರೆಯಿರಿ."
                else -> "I could not catch that. Please say it again, or type it."
            }
        }
    }

    /** Opens the phone's voice-input settings, where the language packs live. */
    fun voiceSettingsIntent(): Intent? = try {
        Intent(Settings.ACTION_VOICE_INPUT_SETTINGS)
    } catch (_: Exception) {
        null
    }

    /** One-line hint under the mic button, so the user knows what will work. */
    fun hint(lang: String, offline: Boolean): String = when {
        !offline -> ""
        lang == "hi" -> "इंटरनेट बंद है: आवाज़ पहचान सीमित हो सकती है। रिकॉर्ड करके रख सकते हैं, या लिखें।"
        lang == "kn" -> "ಇಂಟರ್ನೆಟ್ ಇಲ್ಲ: ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಸೀಮಿತವಾಗಿರಬಹುದು. ರೆಕಾರ್ಡ್ ಮಾಡಿಡಿ, ಅಥವಾ ಬರೆಯಿರಿ."
        else -> "You are offline: voice may not work. You can save a recording, or type."
    }
}
