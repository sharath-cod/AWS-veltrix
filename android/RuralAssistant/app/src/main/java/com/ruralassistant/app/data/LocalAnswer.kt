package com.ruralassistant.app.data

import android.content.Context
import com.ruralassistant.app.RuralApp
import com.ruralassistant.app.utils.NumberReadBack
import com.ruralassistant.app.utils.SafetyGuard

/**
 * Answers with no network.
 *
 * The knowledge pack is already downloaded into Room for offline use, but until
 * now the Ask screen still needed the server to answer. That made "offline" a
 * half-feature: the pack was there, nothing read it.
 *
 * This is the same idea as the server's retrieval, small enough to run on a
 * low-end phone: a question is matched against the saved entries in the user's
 * language, and the medical safety rule is applied first — a red flag gets 108
 * even with no signal, and a medical question with no saved answer gets
 * "I am not sure, call 104".
 */
object LocalAnswer {

    data class Result(
        val answer: String,
        val grounded: Boolean,
        val language: String,
        val matchedTitle: String? = null,
        val emergency: Boolean = false,
        val redirect: List<String> = emptyList(),
        val suggestions: List<String> = emptyList(),
    )

    private val STOPWORDS = setOf(
        "the", "a", "an", "is", "are", "am", "do", "does", "did", "i", "me", "my", "we", "you", "your",
        "what", "which", "who", "how", "when", "where", "why", "can", "could", "should", "would", "will",
        "for", "of", "to", "in", "on", "at", "and", "or", "if", "it", "this", "that", "there", "be",
        "get", "got", "have", "has", "about", "with", "from", "need", "want", "any", "please", "tell",
        "know", "also", "than", "then", "some", "much", "many", "more", "very", "not", "cannot", "cant",
        "kya", "kaise", "kaisa", "hai", "hain", "ka", "ki", "ke", "ko", "me", "mein", "aur", "ya",
        "kar", "karna", "kare", "kaun", "kab", "kahan", "liye", "chahiye", "milta", "mil", "mera", "meri",
        "mere", "mujhe", "kuch", "koi", "bhi", "hoga", "hota", "gaya", "gayi", "raha", "rahi",
        "क्या", "कैसे", "है", "हैं", "का", "की", "के", "को", "में", "और", "या", "कर", "करना", "करें",
        "कौन", "कब", "कहां", "लिए", "चाहिए", "मिलता", "मेरा", "मेरी", "मेरे", "मुझे", "कुछ", "कोई", "भी",
        "enu", "hege", "yake", "ide", "illa", "nanna", "nanage", "beku", "sigutte", "yaaru", "yelli",
        "ಏನು", "ಹೇಗೆ", "ಯಾಕೆ", "ಇದೆ", "ಇಲ್ಲ", "ನನ್ನ", "ನನಗೆ", "ಬೇಕು", "ಸಿಗುತ್ತದೆ", "ಯಾರು", "ಎಲ್ಲಿ",
    )

    /** One idea, several spellings — the offline twin of the server's concept map. */
    private val CONCEPTS: List<List<String>> = listOf(
        listOf("fever", "bukhar", "bukhaar", "jwara", "jvara", "बुखार", "ज्वर", "ಜ್ವರ"),
        listOf("diarrhoea", "diarrhea", "loose", "motion", "dast", "vomit", "ulti", "दस्त", "उल्टी", "ಭೇದಿ", "ವಾಂತಿ"),
        listOf("pregnancy", "pregnant", "garbh", "prasav", "गर्भ", "गर्भावस्था", "प्रसव", "ಗರ್ಭ", "ಹೆರಿಗೆ"),
        listOf("tb", "tuberculosis", "cough", "khansi", "तपेदिक", "खांसी", "ಕ್ಷಯ", "ಕೆಮ್ಮು"),
        listOf("bp", "pressure", "sugar", "diabetes", "बीपी", "शुगर", "ಮಧುಮೇಹ", "ರಕ್ತದೊತ್ತಡ"),
        listOf("anaemia", "anemia", "iron", "haemoglobin", "एनीमिया", "खून की कमी", "ರಕ್ತಹೀನತೆ"),
        listOf("vaccine", "vaccination", "tika", "polio", "टीका", "टीकाकरण", "ಲಸಿಕೆ"),
        listOf("snake", "saap", "saanp", "सांप", "सर्प", "ಹಾವು"),
        listOf("heat", "garmi", "loo", "गर्मी", "लू", "ಬಿಸಿಲು", "ಬೇಸಿಗೆ"),
        listOf("mental", "tension", "stress", "depression", "sleep", "तनाव", "उदासी", "मानसिक", "ಒತ್ತಡ", "ಖಿನ್ನತೆ"),
        listOf("scheme", "yojana", "सरकारी", "योजना", "ಯೋಜನೆ", "ಸರ್ಕಾರಿ"),
        listOf("kisan", "farmer", "kheti", "crop", "fasal", "किसान", "खेती", "फसल", "ರೈತ", "ಕೃಷಿ", "ಬೆಳೆ"),
        listOf("scholarship", "chhatravritti", "nsp", "छात्रवृत्ति", "स्कॉलरशिप", "ವಿದ್ಯಾರ್ಥಿವೇತನ"),
        listOf("school", "student", "college", "padhai", "स्कूल", "छात्र", "पढ़ाई", "ಶಾಲೆ", "ಕಾಲೇಜು", "ಓದು"),
        listOf("scam", "fraud", "otp", "dhokha", "thagi", "ओटीपी", "धोखा", "ठगी", "ಮೋಸ", "ವಂಚನೆ"),
        listOf("pension", "widow", "disability", "पेंशन", "विधवा", "विकलांग", "ಪಿಂಚಣಿ", "ವಿಧವೆ"),
        listOf("ration", "pds", "राशन", "ರೇಷನ್", "ಅಕ್ಕಿ"),
        listOf("aadhaar", "aadhar", "uid", "आधार", "ಆಧಾರ್"),
        listOf("certificate", "caste", "income", "जाति", "प्रमाण पत्र", "आय", "ಜಾತಿ", "ಪ್ರಮಾಣಪತ್ರ", "ಆದಾಯ"),
        listOf("land", "rtc", "pahani", "zameen", "जमीन", "ज़मीन", "खतौनी", "ಭೂಮಿ", "ಪಹಣಿ", "ನಾಮಾಂತರ"),
        listOf("job", "mgnrega", "work", "wage", "मनरेगा", "नौकरी", "मजदूरी", "ಮನರೇಗಾ", "ಕೆಲಸ", "ಕೂಲಿ"),
        listOf("gas", "lpg", "cylinder", "ujjwala", "गैस", "सिलेंडर", "उज्ज्वला", "ಗ್ಯಾಸ್", "ಸಿಲಿಂಡರ್"),
        listOf("house", "housing", "pmay", "ghar", "मकान", "घर", "आवास", "ಮನೆ", "ವಸತಿ"),
        listOf("bank", "account", "khata", "बैंक", "खाता", "ಪಾಸ್ಬುಕ್", "ಬ್ಯಾಂಕ್", "ಖಾತೆ"),
        listOf("loan", "credit", "karz", "mudra", "कर्ज", "ऋण", "ब्याज", "ಸಾಲ", "ಬಡ್ಡಿ"),
        listOf("insurance", "bima", "claim", "बीमा", "दावा", "ವಿಮೆ"),
        listOf("ambulance", "hospital", "emergency", "अस्पताल", "एम्बुलेंस", "ಆಸ್ಪತ್ರೆ", "ಆಂಬ್ಯುಲೆನ್ಸ್"),
        listOf("flood", "rain", "water", "बाढ़", "बारिश", "पानी", "ಪ್ರವಾಹ", "ಮಳೆ", "ನೀರು"),
        listOf("fire", "burn", "aag", "आग", "जलना", "ಬೆಂಕಿ", "ಸುಟ್ಟ"),
        listOf("women", "mahila", "girl", "beti", "महिला", "बेटी", "लड़की", "ಮಹಿಳೆ", "ಹುಡುಗಿ", "ಮಗಳು"),
        listOf("child", "bachcha", "baby", "anganwadi", "बच्चा", "बच्चे", "आंगनवाड़ी", "ಮಗು", "ಮಕ್ಕಳ"),
        listOf("panchayat", "gram", "village", "gaon", "पंचायत", "गांव", "ಗ್ರಾಮ", "ಪಂಚಾಯತ್"),
    )

    private val TOKEN_CONCEPT = HashMap<String, Int>()
    private val CONCEPT_TOKENS = ArrayList<List<String>>()

    init {
        CONCEPTS.forEachIndexed { index, forms ->
            val tokens = ArrayList<String>()
            forms.forEach { form ->
                form.lowercase().split(' ', '-').forEach { raw ->
                    val clean = raw.trim()
                    if (clean.length >= 2) {
                        tokens.add(clean)
                        if (!TOKEN_CONCEPT.containsKey(clean)) TOKEN_CONCEPT[clean] = index
                    }
                }
            }
            CONCEPT_TOKENS.add(tokens)
        }
    }

    private fun tokenize(text: String): List<String> =
        text.lowercase()
            .replace(Regex("""[^\p{L}\p{N}\p{M}\s]"""), " ")
            .split(Regex("""\s+"""))
            .map { it.trim() }
            .filter { it.length >= 2 && !STOPWORDS.contains(it) }

    /** Widen the question with the other spellings of the ideas it mentions. */
    private fun expand(tokens: List<String>): List<String> {
        val out = LinkedHashSet(tokens)
        tokens.forEach { token ->
            val concept = TOKEN_CONCEPT[token]
            if (concept != null) out.addAll(CONCEPT_TOKENS[concept])
        }
        return out.toList()
    }

    private fun score(title: List<String>, body: List<String>, tokens: List<String>): Int {
        var total = 0
        for (token in tokens) {
            when {
                title.contains(token) -> total += 6
                body.contains(token) -> total += 2
                token.length >= 3 && title.any { it.length >= 3 && (it.startsWith(token) || token.startsWith(it)) } -> total += 2
            }
        }
        return total
    }

    /** Answer from the pack saved on the phone. */
    suspend fun answer(context: Context, question: String, uiLanguage: String): Result {
        val lang = when (val detected = NumberReadBack.detectLanguage(question)) {
            "hi", "kn" -> detected
            else -> if (uiLanguage == "hi" || uiLanguage == "kn") uiLanguage else "en"
        }

        // Safety first: an emergency is never answered from a cached entry.
        val emergency = SafetyGuard.emergency(question, lang)
        if (emergency != null) {
            return Result(emergency, grounded = false, language = lang, emergency = true,
                redirect = SafetyGuard.emergencyNumbers(question))
        }
        if (SafetyGuard.isDoseQuestion(question)) {
            return Result(SafetyGuard.doseRefusal(lang), grounded = false, language = lang,
                redirect = listOf(SafetyGuard.HEALTH_ADVICE))
        }

        val dao = (context.applicationContext as RuralApp).container.database.knowledgeDao()
        var rows = dao.getByLanguage(lang)
        if (rows.isEmpty()) rows = dao.getByLanguage("en")
        if (rows.isEmpty()) {
            return Result(SafetyGuard.notFound(lang), grounded = false, language = lang)
        }

        val tokens = expand(tokenize(question))
        if (tokens.isEmpty()) {
            return Result(SafetyGuard.notFound(lang), grounded = false, language = lang,
                suggestions = rows.take(2).map { it.title })
        }

        var bestScore = 0
        var bestTitle: String? = null
        var bestAnswer: String? = null
        for (row in rows) {
            val title = tokenize(row.title)
            val body = tokenize(row.answer)
            val s = score(title, body, tokens)
            if (s > bestScore) {
                bestScore = s
                bestTitle = row.title
                bestAnswer = row.answer
            }
        }

        if (bestScore >= 6 && bestAnswer != null) {
            return Result(bestAnswer, grounded = true, language = lang, matchedTitle = bestTitle)
        }
        // A medical question the pack does not cover: never guess.
        if (SafetyGuard.looksMedical(question)) {
            return Result(SafetyGuard.uncertain(lang), grounded = false, language = lang,
                redirect = listOf(SafetyGuard.HEALTH_ADVICE, SafetyGuard.AMBULANCE))
        }
        return Result(SafetyGuard.notFound(lang), grounded = false, language = lang,
            suggestions = rows.take(2).map { it.title })
    }
}
