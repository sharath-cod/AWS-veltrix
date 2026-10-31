package com.ruralassistant.app.utils

/**
 * The medical safety rule, on the phone.
 *
 * The server does this for every call and every question, but a phone with no
 * network still has to behave safely — an offline answer must not turn
 * "my father has chest pain" into a chat reply. So the same red-flag list, the
 * same "I am not sure" line and the same 108 / 104 numbers live here too.
 */
object SafetyGuard {

    /** 108 for an ambulance, 104 for free health advice, 14416 for mental health. */
    const val AMBULANCE = "108"
    const val HEALTH_ADVICE = "104"
    const val MENTAL_HEALTH = "14416"

    private val RED_FLAGS = listOf(
        "chest pain", "seene mein dard", "chhati mein dard", "छाती में दर्द", "सीने में दर्द", "ಎದೆ ನೋವು", "ಎದೆನೋವು",
        "cannot breathe", "can not breathe", "breathless", "difficulty breathing", "saans nahi", "saans lene",
        "सांस", "ಉಸಿರಾಟ", "ಉಸಿರು", "ದಮ್ ಘುಟ",
        "bleeding", "blood loss", "khoon", "खून", "ರಕ್ತಸ್ರಾವ", "ರಕ್ತ",
        "unconscious", "behosh", "बेहोश", "fits", "daura", "दौरा", "मिर्गी", "ಪ್ರಜ್ಞೆ", "ಸೆಳವು", "ಮೂರ್ಛೆ",
        "snake", "saanp", "सांप", "सर्प", "ಹಾವು",
        "poison", "zeher", "जहर", "ज़हर", "ವಿಷ", "ಕೀಟನಾಶಕ",
        "stroke", "lakwa", "लकवा", "ಪಾರ್ಶ್ವವಾಯು",
        "burnt", "jal gaya", "जल गया", "ಸುಟ್ಟು",
        "suicide", "atmahatya", "आत्महत्या", "ಆತ್ಮಹತ್ಯೆ", "khudkhushi",
        "accident", "durghatna", "दुर्घटना", "ಅಪಘಾತ", "ಡಿಕ್ಕಿ",
        "doob gaya", "डूब", "ಮುಳುಗ", "current lag", "करंट", "ಕರೆಂಟ್",
    )

    private val MEDICAL_WORDS = listOf(
        "doctor", "dawa", "dawai", "tablet", "medicine", "ilaj", "treatment", "hospital", "bimar", "bimari",
        "fever", "bukhar", "jwara", "pain", "dard", "noyu", "vomit", "ulti", "loose", "dast", "cough",
        "khansi", "swelling", "swollen", "sujan", "wound", "ghav", "pregnan", "garbh", "vaccine", "tika",
        "tb", "cancer", "diabetes", "sugar", "pressure", "infection", "sick", "weakness", "kamzori",
        "डॉक्टर", "दवा", "दवाई", "गोली", "इलाज", "अस्पताल", "बीमार", "बुखार", "दर्द", "खून", "उल्टी",
        "दस्त", "खांसी", "गर्भ", "टीका", "कमजोरी", "सूजन", "घाव",
        "ವೈದ್ಯ", "ಔಷಧ", "ಮಾತ್ರೆ", "ಚಿಕಿತ್ಸೆ", "ಆಸ್ಪತ್ರೆ", "ಅನಾರೋಗ್ಯ", "ಜ್ವರ", "ನೋವು", "ರಕ್ತ", "ವಾಂತಿ",
        "ಭೇದಿ", "ಕೆಮ್ಮು", "ಗರ್ಭ", "ಲಸಿಕೆ", "ದುರ್ಬಲತೆ", "ಊತ", "ಗಾಯ",
    )

    private val DOSE_WORDS = listOf(
        "how many tablets", "how many pills", "how much medicine", "what dose", "dosage", "how many mg",
        "kitni goli", "kitni tablet", "kitna dose", "कितनी गोली", "कितनी दवा", "खुराक", "मात्रा",
        "ಎಷ್ಟು ಮಾತ್ರೆ", "ಎಷ್ಟು ಔಷಧ", "ಡೋಸ್",
    )

    private fun norm(s: String) = s.lowercase().replace(Regex("""[.,!?;:"'()।॥]"""), " ").replace(Regex("""\s+"""), " ").trim()

    fun hasRedFlag(text: String): Boolean {
        val t = norm(text)
        return RED_FLAGS.any { t.contains(it) }
    }

    fun looksMedical(text: String): Boolean {
        val t = norm(text)
        return MEDICAL_WORDS.any { t.contains(it) } || hasRedFlag(text)
    }

    fun isDoseQuestion(text: String): Boolean {
        val t = norm(text)
        return DOSE_WORDS.any { t.contains(it) }
    }

    /** The emergency sentence, or null. */
    fun emergency(text: String, lang: String): String? {
        if (!hasRedFlag(text)) return null
        val mental = norm(text).let { it.contains("suicide") || it.contains("atmahatya") || it.contains("आत्महत्या") || it.contains("ಆತ್ಮಹತ್ಯೆ") }
        if (mental) {
            return when (lang) {
                "hi" -> "आप इसमें अकेले नहीं हैं। कृपया अभी 14416 पर सलाहकार से बात करें, और किसी भरोसेमंद व्यक्ति के साथ रहिए। ज़्यादा परेशानी हो तो 108 पर कॉल करें।"
                "kn" -> "ನೀವು ಇದರಲ್ಲಿ ಒಂಟಿಯಲ್ಲ. ದಯವಿಟ್ಟು ಈಗಲೇ 14416 ನಲ್ಲಿ ಸಲಹೆಗಾರರೊಂದಿಗೆ ಮಾತನಾಡಿ, ಮತ್ತು ನಂಬಿಕೆಯ ವ್ಯಕ್ತಿಯೊಂದಿಗೆ ಇರಿ. ತುರ್ತಾದರೆ 108 ಗೆ ಕರೆ ಮಾಡಿ."
                else -> "You are not alone in this. Please talk to a counsellor on 14416 right now, and stay with someone you trust. If it is urgent, call 108."
            }
        }
        return when (lang) {
            "hi" -> "यह आपातकाल जैसा लगता है। कृपया अभी 108 पर कॉल करें। मरीज़ के पास रहें और कुछ खाने-पीने न दें।"
            "kn" -> "ಇದು ತುರ್ತು ಪರಿಸ್ಥಿತಿ ಎನಿಸುತ್ತದೆ. ದಯವಿಟ್ಟು ಈಗಲೇ 108 ಗೆ ಕರೆ ಮಾಡಿ. ರೋಗಿಯ ಬಳಿ ಇರಿ, ಏನನ್ನೂ ತಿನ್ನಲು ಕೊಡಬೇಡಿ."
            else -> "This sounds urgent. Please call 108 now. Stay with the person and do not give food or water."
        }
    }

    /** Which numbers to offer as buttons. */
    fun emergencyNumbers(text: String): List<String> =
        if (norm(text).let { it.contains("suicide") || it.contains("atmahatya") || it.contains("आत्महत्या") || it.contains("ಆತ್ಮಹತ್ಯೆ") })
            listOf(MENTAL_HEALTH, AMBULANCE)
        else listOf(AMBULANCE)

    fun doseRefusal(lang: String): String = when (lang) {
        "hi" -> "दवा की मात्रा मैं नहीं बता सकता। कृपया डॉक्टर या आशा कार्यकर्ता से पूछें, या 104 पर कॉल करें।"
        "kn" -> "ಔಷಧಿಯ ಪ್ರಮಾಣವನ್ನು ನಾನು ಹೇಳಲಾರೆ. ದಯವಿಟ್ಟು ವೈದ್ಯರು ಅಥವಾ ಆಶಾ ಕಾರ್ಯಕರ್ತೆಯನ್ನು ಕೇಳಿ, ಅಥವಾ 104 ಗೆ ಕರೆ ಮಾಡಿ."
        else -> "I cannot tell you how much medicine to take. Please ask a doctor or the ASHA worker, or call 104."
    }

    fun uncertain(lang: String): String = when (lang) {
        "hi" -> "इस बारे में मुझे पक्का नहीं पता, इसलिए इस पर अमल न करें। स्वास्थ्य सलाह के लिए 104 पर, और ज़्यादा परेशानी हो तो 108 पर कॉल करें।"
        "kn" -> "ಇದರ ಬಗ್ಗೆ ನನಗೆ ಖಚಿತವಿಲ್ಲ, ದಯವಿಟ್ಟು ಇದನ್ನು ಪಾಲಿಸಬೇಡಿ. ಆರೋಗ್ಯ ಸಲಹೆಗೆ 104 ಗೆ, ತುರ್ತಾದರೆ 108 ಗೆ ಕರೆ ಮಾಡಿ."
        else -> "I am not sure about this, so please do not act on it. Call 104 for health advice, or 108 if it is urgent."
    }

    fun notFound(lang: String): String = when (lang) {
        "hi" -> "इस विषय पर मेरे पास सत्यापित जानकारी नहीं है। मैं स्वास्थ्य, सरकारी योजनाओं, छात्रवृत्ति, दस्तावेज़, खेती, आपातकाल और पैसे के मामलों में मदद कर सकता हूँ।"
        "kn" -> "ಈ ವಿಷಯದ ಬಗ್ಗೆ ನನ್ನ ಬಳಿ ದೃಢೀಕರಿಸಿದ ಮಾಹಿತಿ ಇಲ್ಲ. ಆರೋಗ್ಯ, ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು, ವಿದ್ಯಾರ್ಥಿವೇತನ, ದಾಖಲೆಗಳು, ಕೃಷಿ, ತುರ್ತು ಸಹಾಯ ಮತ್ತು ಹಣದ ವಿಷಯಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ."
        else -> "I do not have verified information about that. I can help with health, government schemes, scholarships, documents, farming, emergencies and money matters."
    }

    fun offlineNotice(lang: String): String = when (lang) {
        "hi" -> "इंटरनेट नहीं है — यह जवाब फोन में सहेजी गई जानकारी से है।"
        "kn" -> "ಇಂಟರ್ನೆಟ್ ಇಲ್ಲ — ಈ ಉತ್ತರ ಫೋನ್‌ನಲ್ಲಿ ಉಳಿಸಿದ ಮಾಹಿತಿಯಿಂದ."
        else -> "You are offline — this answer comes from the information saved on your phone."
    }
}
