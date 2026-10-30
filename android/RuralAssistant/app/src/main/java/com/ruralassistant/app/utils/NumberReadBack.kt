package com.ruralassistant.app.utils

/**
 * Offline mixed-language number, date and confirmation understanding — the
 * phone-side twin of the backend's services/numbers.js.
 *
 * Hurdle 2: rural users mix languages inside one sentence ("paanch thousand
 * rupaye", "ಐದು hazaar", "२ lakh 50 thousand"), including fraction words such as
 * dedh (1.5) and paune do (1.75).
 *
 * Hurdle 3: a misheard number can cost money, so every amount, ID and
 * ambiguous date is read back in the user's language, digit by digit, and the
 * app waits for an explicit yes (typed, tapped or spoken) before relying on it.
 *
 * Everything here works with no network, which matters because the read-back is
 * exactly what you need when the phone is offline.
 */
object NumberReadBack {

    data class Item(
        val raw: String,
        val kind: String,            // "amount" | "number" | "identifier"
        val value: Double?,
        val digits: String,
        val display: String,
        val confusions: List<String>, // e.g. "saat could also be saath (60), sattar (70)"
    ) {
        val risky: Boolean get() = kind == "amount" || kind == "identifier" || confusions.isNotEmpty()
        // Qualify through the object: a nested class cannot see the outer
        // object's members by simple name.
        fun spoken(lang: String): String =
            if (kind == "identifier") NumberReadBack.digitByDigit(digits, lang)
            else NumberReadBack.spokenValue(value ?: 0.0, lang, kind == "amount")
        fun readBack(lang: String): String =
            if (kind == "identifier") NumberReadBack.digitByDigit(digits, lang)
            else "${spoken(lang)}. ${NumberReadBack.digitByDigit(digits, lang)}"
    }

    /** A date the user said or typed, with both readings when it is ambiguous. */
    data class DateItem(
        val raw: String,
        val day: Int,
        val month: Int,
        val year: Int,
        val ambiguous: Boolean,
        val readings: List<String>,   // ISO strings, both readings when ambiguous
        val display: String,          // dd/MM/yyyy
    ) {
        val risky: Boolean get() = ambiguous
        fun readBack(lang: String): String = readings.joinToString(if (lang == "en") " or " else " या ") { iso ->
            val parts = iso.split("-")
            val y = parts[0].toIntOrNull() ?: year
            val m = parts[1].toIntOrNull() ?: month
            val d = parts[2].toIntOrNull() ?: day
            "$d ${NumberReadBack.monthName(m, lang)} $y"
        }
    }

    data class YesNo(val confirmed: Boolean?, val matched: String?)

    /** One piece of a sentence, so amounts are spoken on their own. */
    data class Segment(val type: String, val text: String, val readBack: String)

    // ---- lexicon ----------------------------------------------------------
    private val small = HashMap<String, Int>()
    private val mult = HashMap<String, Long>()
    /** Fraction word -> add and subtract, e.g. paune = take a quarter off the next number. */
    private val fraction = HashMap<String, Pair<Double, Double>>()

    private val hiRoman = ("ek do teen char paanch chhah saat aath nau das gyarah barah terah chaudah pandrah solah satrah atharah unnis bees " +
        "ikkis baais teis chaubis pachchis chhabbis sattais atthais unatis tees iktis battis tentis chauntis paintis chhattis saintis adtis untalis chalis " +
        "iktalis bayalis taintalis chauvalis paitalis chhiyalis saintalis adtalis unchas pachas ikyavan bavan trepan chauvan pachpan chhappan sattavan atthavan unsath saath " +
        "iksath basath tirsath chausath painsath chiyasath sadsath adsath unhattar sattar ikhattar bahattar tihattar chauhattar pachattar chhihattar satattar athattar unyasi assi " +
        "ikyasi bayasi tirasi chaurasi pachasi chhiyasi satasi athasi nawasi nabbe ikyanve banve tiranve chauranve pachanve chhiyanve sattanve atthanve ninyanve").split(" ")

    private val confusable = listOf(
        listOf("saat", "saath", "sattar"), listOf("pandrah", "pachas", "pachchis"),
        listOf("teen", "tees", "teis"), listOf("nau", "nabbe"), listOf("aath", "assi"),
        listOf("bees", "tees"), listOf("chalis", "chaalis", "char"), listOf("aidu", "aivattu"),
        listOf("aaru", "aravattu"), listOf("elu", "eppattu"), listOf("entu", "embattu"),
        listOf("ombattu", "tombattu"), listOf("ippattu", "muvattu"), listOf("do", "dhai"),
        listOf("ek", "dedh"),
    )

    private val fillers = setOf("and", "aur", "mattu", "और", "ಮತ್ತು", "point")
    private val currency = setOf(
        "rs", "inr", "₹", "rupee", "rupees", "rupaye", "rupaiya", "rupay", "rupayi",
        "रुपये", "रुपए", "रु", "रूपये", "ರೂಪಾಯಿ", "ರೂ", "ರುಪಾಯಿ",
    )

    private val hiMarkers = setOf("kya", "kaise", "kaisa", "hai", "hain", "chahiye", "karna", "karo", "kare",
        "kitna", "kitne", "kaun", "kab", "kahan", "milta", "milega", "paisa", "yojana", "nahi", "nahin",
        "mujhe", "mera", "meri", "batao", "sakta", "sakti", "hoga", "kijiye", "chhatravritti", "bukhar",
        "dawa", "ilaaj", "ghar", "zameen", "kheti", "kisan", "sarkari")
    private val knMarkers = setOf("beku", "hege", "enu", "illa", "haudu", "sari", "yake", "nanna", "nanage",
        "sigutte", "madbeku", "ide", "yelli", "yaaru", "kelsa", "jwara", "yojane", "duddu", "mane",
        "roga", "aushadha", "bhoomi", "raita", "sarkari", "vidyarthi")
    private val enMarkers = setOf("how", "what", "when", "where", "which", "why", "is", "are", "am", "was",
        "can", "could", "should", "would", "need", "want", "please", "my", "the", "of", "to", "for",
        "with", "from", "do", "does", "open", "get", "apply", "give", "money", "help", "tell", "about",
        "much", "many", "and", "not", "i", "you", "we", "they", "it", "have", "has")

    private val yesWords = setOf("yes", "yeah", "yep", "ok", "okay", "correct", "right", "true", "sure", "confirm",
        "haan", "han", "ha", "haa", "ji", "sahi", "sahihai", "theek", "thik", "teek", "bilkul",
        "हाँ", "हां", "जी", "सही", "ठीक", "बिल्कुल", "haudu", "houdu", "howdu", "sari", "sarii", "agide",
        "ಹೌದು", "ಸರಿ", "ಸರಿಯಾಗಿದೆ")
    private val noWords = setOf("no", "nope", "nah", "wrong", "incorrect", "false", "cancel", "stop", "change",
        "nahi", "nahin", "galat", "nako", "नहीं", "नहि", "गलत", "रद्द", "illa", "alla", "tappu", "ಇಲ್ಲ", "ತಪ್ಪು", "ಬೇಡ")

    init {
        listOf("zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
            "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen").forEachIndexed { i, w -> small[w] = i }
        mapOf("twenty" to 20, "thirty" to 30, "forty" to 40, "fifty" to 50, "sixty" to 60, "seventy" to 70, "eighty" to 80, "ninety" to 90)
            .forEach { (k, v) -> small[k] = v }
        hiRoman.forEachIndexed { i, w -> small[w] = i + 1 }
        small["panch"] = 5; small["chhe"] = 6; small["che"] = 6; small["chah"] = 6; small["shunya"] = 0; small["sifar"] = 0
        mapOf("शून्य" to 0, "एक" to 1, "दो" to 2, "तीन" to 3, "चार" to 4, "पांच" to 5, "पाँच" to 5, "छह" to 6, "छः" to 6,
            "सात" to 7, "आठ" to 8, "नौ" to 9, "दस" to 10, "बीस" to 20, "तीस" to 30, "चालीस" to 40, "पचास" to 50,
            "साठ" to 60, "सत्तर" to 70, "अस्सी" to 80, "नब्बे" to 90).forEach { (k, v) -> small[k] = v }
        mapOf("ondu" to 1, "eradu" to 2, "mooru" to 3, "nalku" to 4, "naalku" to 4, "aidu" to 5, "aaru" to 6, "elu" to 7,
            "entu" to 8, "ombattu" to 9, "hattu" to 10, "hannondu" to 11, "hanneradu" to 12, "hadimooru" to 13,
            "hadinaalku" to 14, "hadinaidu" to 15, "hadinaaru" to 16, "hadinelu" to 17, "hadinentu" to 18, "hontombattu" to 19,
            "ippattu" to 20, "muvattu" to 30, "naalvattu" to 40, "naluvattu" to 40, "aivattu" to 50, "aravattu" to 60,
            "eppattu" to 70, "embattu" to 80, "tombattu" to 90, "sonne" to 0).forEach { (k, v) -> small[k] = v }
        mapOf("ಸೊನ್ನೆ" to 0, "ಒಂದು" to 1, "ಎರಡು" to 2, "ಮೂರು" to 3, "ನಾಲ್ಕು" to 4, "ಐದು" to 5, "ಆರು" to 6, "ಏಳು" to 7,
            "ಎಂಟು" to 8, "ಒಂಬತ್ತು" to 9, "ಹತ್ತು" to 10, "ಇಪ್ಪತ್ತು" to 20, "ಮೂವತ್ತು" to 30, "ನಲವತ್ತು" to 40, "ಐವತ್ತು" to 50,
            "ಅರವತ್ತು" to 60, "ಎಪ್ಪತ್ತು" to 70, "ಎಂಬತ್ತು" to 80, "ತೊಂಬತ್ತು" to 90).forEach { (k, v) -> small[k] = v }

        "hundred sau सौ nooru ನೂರು".split(" ").forEach { mult[it] = 100L }
        "thousand hazaar hazar hajar हजार हज़ार saavira savira ಸಾವಿರ".split(" ").forEach { mult[it] = 1_000L }
        "lakh lac lakhs laksha लाख ಲಕ್ಷ".split(" ").forEach { mult[it] = 100_000L }
        "crore karod koti कोटि करोड़ करोड ಕೋಟಿ".split(" ").forEach { mult[it] = 10_000_000L }

        // add to the next number, subtract from it
        mapOf(
            "adha" to (0.5 to 0.0), "aadha" to (0.5 to 0.0), "ardha" to (0.5 to 0.0), "half" to (0.5 to 0.0),
            "आधा" to (0.5 to 0.0), "अर्ध" to (0.5 to 0.0), "ಅರ್ಧ" to (0.5 to 0.0),
            "paune" to (0.0 to 0.25), "पौने" to (0.0 to 0.25), "ಒಂದೂಕಾಲು" to (0.0 to 0.25),
            "dedh" to (1.5 to 0.0), "dedha" to (1.5 to 0.0), "देढ़" to (1.5 to 0.0), "डेढ़" to (1.5 to 0.0), "ಒಂದೂವರೆ" to (1.5 to 0.0),
            "sava" to (1.25 to 0.0), "sawa" to (1.25 to 0.0), "सवा" to (1.25 to 0.0),
            "dhai" to (2.5 to 0.0), "ढाई" to (2.5 to 0.0), "ಎರಡೂವರೆ" to (2.5 to 0.0),
            "sarhe" to (0.5 to 0.0), "sadhe" to (0.5 to 0.0), "साढ़े" to (0.5 to 0.0), "ಎರಡೂಕಾಲು" to (0.5 to 0.0),
        ).forEach { (k, v) -> fraction[k] = v }
    }

    // ---- spoken forms -------------------------------------------------------
    private val digitNames = mapOf(
        "en" to listOf("zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"),
        "hi" to listOf("शून्य", "एक", "दो", "तीन", "चार", "पांच", "छह", "सात", "आठ", "नौ"),
        "kn" to listOf("ಸೊನ್ನೆ", "ಒಂದು", "ಎರಡು", "ಮೂರು", "ನಾಲ್ಕು", "ಐದು", "ಆರು", "ಏಳು", "ಎಂಟು", "ಒಂಬತ್ತು"),
    )
    private class Units(val crore: String, val lakh: String, val thousand: String, val hundred: String, val rupees: String, val point: String)
    private val units = mapOf(
        "en" to Units("crore", "lakh", "thousand", "hundred", "rupees", "point"),
        "hi" to Units("करोड़", "लाख", "हज़ार", "सौ", "रुपये", "दशमलव"),
        "kn" to Units("ಕೋಟಿ", "ಲಕ್ಷ", "ಸಾವಿರ", "ನೂರು", "ರೂಪಾಯಿ", "ದಶಮಾಂಶ"),
    )

    private val monthNames = mapOf(
        "en" to listOf("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"),
        "hi" to listOf("जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"),
        "kn" to listOf("ಜನವರಿ", "ಫೆಬ್ರವರಿ", "ಮಾರ್ಚ್", "ಏಪ್ರಿಲ್", "ಮೇ", "ಜೂನ್", "ಜುಲೈ", "ಆಗಸ್ಟ್", "ಸೆಪ್ಟೆಂಬರ್", "ಅಕ್ಟೋಬರ್", "ನವೆಂಬರ್", "ಡಿಸೆಂಬರ್"),
    )

    fun monthName(month: Int, lang: String): String {
        val names = monthNames[lang] ?: monthNames.getValue("en")
        return names.getOrElse(month - 1) { month.toString() }
    }

    fun digitByDigit(digits: String, lang: String): String {
        val names = digitNames[lang] ?: digitNames.getValue("en")
        return digits.map { c -> if (c in '0'..'9') names[c - '0'] else c.toString() }.joinToString(", ")
    }

    fun spokenValue(value: Double, lang: String, withRupees: Boolean): String {
        val u = units[lang] ?: units.getValue("en")
        var rest = kotlin.math.abs(value).toLong()
        val parts = ArrayList<String>()
        fun take(size: Long, word: String) { if (rest >= size) { parts.add("${rest / size} $word"); rest %= size } }
        take(10_000_000L, u.crore); take(100_000L, u.lakh); take(1_000L, u.thousand); take(100L, u.hundred)
        if (rest > 0 || parts.isEmpty()) parts.add(rest.toString())
        val frac = kotlin.math.round((kotlin.math.abs(value) - kotlin.math.abs(value).toLong()) * 100) / 100
        var out = parts.joinToString(" ")
        if (frac > 0) out += " ${u.point} ${frac.toString().removePrefix("0.")}"
        return out + if (withRupees) " ${u.rupees}" else ""
    }

    /** Indian digit grouping: 1234567 -> 12,34,567 */
    fun groupIndian(n: Long): String {
        val s = n.toString()
        if (s.length <= 3) return s
        val head = s.dropLast(3).reversed().chunked(2).joinToString(",").reversed()
        return "$head,${s.takeLast(3)}"
    }

    // ---- parsing --------------------------------------------------------------
    private enum class T { SMALL, DIGITS, MULT, FRACTION, FILLER, CURRENCY, OTHER }
    private class Tok(
        val text: String, val start: Int, val end: Int, val type: T,
        val value: Long = 0, val add: Double = 0.0, val sub: Double = 0.0,
        val word: String = "", val digits: String = "",
    )

    private fun normalizeDigits(text: String): String = buildString {
        for (c in text) {
            when (c) {
                in '०'..'९' -> append('0' + (c - '०'))
                in '೦'..'೯' -> append('0' + (c - '೦'))
                else -> append(c)
            }
        }
    }

    private val tokenRegex = Regex("""[\p{L}\p{M}]+\.?|\d[\d,]*(?:\.\d+)?|₹""")

    private fun tokenize(text: String): List<Tok> = tokenRegex.findAll(text).map { m ->
        val raw = m.value
        val w = raw.lowercase().trimEnd('.')
        val type: T; var value = 0L; var digits = ""; var add = 0.0; var sub = 0.0
        when {
            w.isNotEmpty() && w[0].isDigit() -> {
                type = T.DIGITS; digits = w.replace(",", "")
                value = digits.substringBefore('.').toLongOrNull() ?: 0L
            }
            mult.containsKey(w) -> { type = T.MULT; value = mult.getValue(w) }
            fraction.containsKey(w) -> {
                type = T.FRACTION
                val pair = fraction.getValue(w); add = pair.first; sub = pair.second
            }
            small.containsKey(w) -> { type = T.SMALL; value = small.getValue(w).toLong() }
            w in fillers -> type = T.FILLER
            w in currency || raw in currency -> type = T.CURRENCY
            else -> type = T.OTHER
        }
        Tok(raw, m.range.first, m.range.last + 1, type, value, add, sub, w, digits)
    }.toList()

    private fun isNum(t: Tok?) = t != null &&
        (t.type == T.SMALL || t.type == T.DIGITS || t.type == T.MULT || t.type == T.FRACTION)

    private fun evalRun(run: List<Tok>): Double {
        var total = 0.0
        var current = 0.0
        var pendingAdd = 0.0
        var pendingSub = 0.0
        fun hasPending() = pendingAdd != 0.0 || pendingSub != 0.0
        fun clear() { pendingAdd = 0.0; pendingSub = 0.0 }
        for (t in run) when (t.type) {
            T.FRACTION -> { pendingAdd += t.add; pendingSub += t.sub }
            T.SMALL, T.DIGITS -> {
                var v = t.value.toDouble()
                if (hasPending()) { v = pendingAdd + t.value - pendingSub; clear() }
                current += v
            }
            T.MULT -> {
                val size = t.value.toDouble()
                if (hasPending()) { total += (pendingAdd - pendingSub) * size; clear() }
                else if (t.value == 100L) current = (if (current == 0.0) 1.0 else current) * 100
                else { total += (if (current == 0.0) 1.0 else current) * size; current = 0.0 }
            }
            else -> {}
        }
        if (hasPending()) current += pendingAdd - pendingSub
        return total + current
    }

    private fun confusionsFor(run: List<Tok>): List<String> {
        val out = ArrayList<String>()
        for (t in run) {
            if (t.type != T.SMALL && t.type != T.FRACTION) continue
            confusable.filter { t.word in it }.forEach { group ->
                val alts = group.filter { it != t.word && (small.containsKey(it) || fraction.containsKey(it)) }
                    .map { w ->
                        val v = if (small.containsKey(w)) small.getValue(w).toDouble()
                        else fraction.getValue(w).let { it.first - it.second }
                        "$w ($v)"
                    }
                if (alts.isNotEmpty()) out.add("${t.word} could also be " + alts.joinToString(", "))
            }
        }
        return out.distinct()
    }

    fun extract(input: String): List<Item> {
        val text = normalizeDigits(input).replace("₹", " ₹ ")
        val toks = tokenize(text)
        val items = ArrayList<Item>()
        var i = 0
        while (i < toks.size) {
            if (!isNum(toks[i])) { i++; continue }
            val start = i
            val run = ArrayList<Tok>()
            while (i < toks.size) {
                val c = toks[i]
                if (isNum(c)) { run.add(c); i++ }
                else if (c.type == T.FILLER && run.isNotEmpty() && isNum(toks.getOrNull(i + 1))) i++
                else break
            }
            val money = toks.getOrNull(start - 1)?.type == T.CURRENCY || toks.getOrNull(i)?.type == T.CURRENCY
            val raw = text.substring(toks[start].start, toks[i - 1].end).trim()
            val conf = confusionsFor(run)
            val allSingle = run.size >= 3 && run.all {
                (it.type == T.SMALL || it.type == T.DIGITS) && it.value in 0..9 && (it.type == T.SMALL || it.digits.length == 1)
            }
            val longDigits = run.size == 1 && run[0].type == T.DIGITS && run[0].digits.length >= 9 && run[0].digits.all { it.isDigit() }
            if (allSingle || longDigits) {
                val d = if (longDigits) run[0].digits else run.joinToString("") { it.value.toString() }
                items.add(Item(raw, "identifier", null, d, d.chunked(4).joinToString(" "), conf))
            } else {
                val v = evalRun(run)
                val whole = v.toLong()
                val frac = kotlin.math.round((v - whole) * 100) / 100
                val shown = if (frac > 0) "${groupIndian(whole)}${frac.toString().removePrefix("0")}" else groupIndian(whole)
                items.add(Item(raw, if (money) "amount" else "number", v, whole.toString(),
                    if (money) "₹$shown" else shown, conf))
            }
        }
        return items
    }

    /**
     * Dates, because a deadline read the wrong way round (01/11 vs 11/01) makes
     * someone miss it. Numeric dates where both sides are 12 or less are
     * reported with both readings spelled out.
     */
    private val monthWords = mapOf(
        "jan" to 1, "feb" to 2, "mar" to 3, "apr" to 4, "may" to 5, "jun" to 6, "jul" to 7,
        "aug" to 8, "sep" to 9, "oct" to 10, "nov" to 11, "dec" to 12,
        "january" to 1, "february" to 2, "march" to 3, "april" to 4, "june" to 6, "july" to 7,
        "august" to 8, "september" to 9, "october" to 10, "november" to 11, "december" to 12,
    )

    fun extractDates(input: String): List<DateItem> {
        val text = normalizeDigits(input)
        val found = ArrayList<Triple<Int, Int, DateItem>>() // index, length, item

        fun add(raw: String, index: Int, y: Int, m: Int, d: Int, ambiguous: Boolean) {
            if (m !in 1..12 || d !in 1..31) return
            val readings = if (ambiguous) {
                listOf(iso(y, m, d), iso(y, d, m))
            } else listOf(iso(y, m, d))
            val display = "%02d/%02d/%d".format(d, m, y)
            found.add(Triple(index, raw.length, DateItem(raw, d, m, y, ambiguous, readings, display)))
        }

        Regex("""(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})""").findAll(text).forEach { m ->
            add(m.value, m.range.first, m.groupValues[1].toInt(), m.groupValues[2].toInt(), m.groupValues[3].toInt(), false)
        }
        Regex("""(?<!\d)(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})(?!\d)""").findAll(text).forEach { m ->
            val a = m.groupValues[1].toInt()
            val b = m.groupValues[2].toInt()
            var y = m.groupValues[3].toInt()
            if (y < 100) y += 2000
            add(m.value, m.range.first, y, b, a, a <= 12 && b <= 12)
        }
        Regex("""(?<!\d)(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})""").findAll(text).forEach { m ->
            val mon = monthWords[m.groupValues[2].lowercase()] ?: return@forEach
            add(m.value, m.range.first, m.groupValues[3].toInt(), mon, m.groupValues[1].toInt(), false)
        }
        Regex("""([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})""").findAll(text).forEach { m ->
            val mon = monthWords[m.groupValues[1].lowercase()] ?: return@forEach
            add(m.value, m.range.first, m.groupValues[3].toInt(), mon, m.groupValues[2].toInt(), false)
        }

        // Keep the longest non-overlapping match for each position.
        val sorted = found.sortedWith(compareBy({ it.first }, { -it.second }))
        val kept = ArrayList<DateItem>()
        val taken = ArrayList<IntRange>()
        for ((index, length, item) in sorted) {
            val range = index until (index + length)
            if (taken.none { it.first <= range.last && range.first <= it.last }) {
                kept.add(item)
                taken.add(range)
            }
        }
        return kept
    }

    private fun iso(y: Int, m: Int, d: Int) = "%04d-%02d-%02d".format(y, m, d)

    /** Understand a spoken confirmation: "haan", "sari", "illa", "no". */
    fun parseYesNo(utterance: String): YesNo {
        val text = utterance.lowercase().replace(Regex("""[.,!?]"""), " ").replace(Regex("""\s+"""), " ").trim()
        if (text.isEmpty()) return YesNo(null, null)
        val words = text.split(" ")
        for (i in 0 until words.size - 1) {
            val pair = "${words[i]} ${words[i + 1]}"
            if (pair in noWords) return YesNo(false, pair)
            if (pair in yesWords) return YesNo(true, pair)
        }
        for (w in words) {
            if (w in noWords) return YesNo(false, w)
            if (w in yesWords) return YesNo(true, w)
        }
        if (Regex("""हाँ|हां|सही""").containsMatchIn(text)) return YesNo(true, "हाँ")
        if (Regex("""नहीं|गलत""").containsMatchIn(text)) return YesNo(false, "नहीं")
        if (Regex("""ಹೌದು|ಸರಿ""").containsMatchIn(text)) return YesNo(true, "ಹೌದು")
        if (Regex("""ಇಲ್ಲ|ತಪ್ಪು""").containsMatchIn(text)) return YesNo(false, "ಇಲ್ಲ")
        return YesNo(null, null)
    }

    /** Which language the user is speaking or typing, so the answer can match it. */
    fun detectLanguage(text: String): String {
        val devanagari = Regex("""[\u0900-\u097F]""").findAll(text).count()
        val kannada = Regex("""[\u0C80-\u0CFF]""").findAll(text).count()
        val latin = Regex("""[A-Za-z]""").findAll(text).count()
        if (kannada > devanagari && kannada > latin) return "kn"
        if (devanagari > latin) return "hi"
        if (kannada > latin) return "kn"
        val words = text.lowercase().split(Regex("""[^a-z]+""")).filter { it.isNotEmpty() }
        var hi = 0; var kn = 0; var en = 0
        for (w in words) {
            if (w in hiMarkers) hi += 2
            if (w in knMarkers) kn += 2
            if (w in enMarkers) en += 1
        }
        if (kn > hi && kn >= en) return "kn"
        if (hi > en && hi > kn) return "hi"
        return "en"
    }

    /** The answer split into prose and numbers, so "read aloud" never runs an amount together. */
    fun speechScript(text: String, lang: String): List<Segment> {
        val marks = ArrayList<Pair<String, Segment>>()
        extract(text).forEach { n ->
            marks.add(n.raw to Segment(n.kind, n.display, n.readBack(lang)))
        }
        extractDates(text).forEach { d ->
            marks.add(d.raw to Segment("date", d.display, d.readBack(lang)))
        }
        marks.sortByDescending { it.first.length }
        var segments = listOf(Segment("text", text, ""))
        for ((raw, seg) in marks) {
            val next = ArrayList<Segment>()
            for (s in segments) {
                if (s.type != "text") { next.add(s); continue }
                val parts = s.text.split(raw)
                parts.forEachIndexed { i, part ->
                    if (part.isNotEmpty()) next.add(Segment("text", part, ""))
                    if (i < parts.size - 1) next.add(seg)
                }
            }
            segments = next
        }
        return segments.filter { it.type != "text" || it.text.trim().isNotEmpty() }
    }

    /** Sentence to show and speak so the user can say yes / no. */
    fun confirmationPrompt(items: List<Item>, lang: String, dates: List<DateItem> = emptyList()): String {
        if (items.isEmpty() && dates.isEmpty()) return ""
        val head = mapOf("en" to "I understood:", "hi" to "मैंने समझा:", "kn" to "ನಾನು ಅರ್ಥಮಾಡಿಕೊಂಡದ್ದು:")
        val ask = mapOf("en" to "Is this correct? Say yes or no.", "hi" to "क्या यह सही है? हाँ या ना कहें।", "kn" to "ಇದು ಸರಿಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎನ್ನಿ.")
        val risk = mapOf("en" to "Careful: this word can sound like another number.",
            "hi" to "ध्यान दें: यह शब्द किसी दूसरी संख्या जैसा सुनाई दे सकता है।", "kn" to "ಎಚ್ಚರ: ಈ ಪದ ಬೇರೆ ಸಂಖ್ಯೆಯಂತೆ ಕೇಳಿಸಬಹುದು.")
        val dateRisk = mapOf("en" to "Careful: this date can be read two ways.",
            "hi" to "ध्यान दें: यह तारीख दो तरह से पढ़ी जा सकती है।", "kn" to "ಎಚ್ಚರ: ಈ ದಿನಾಂಕವನ್ನು ಎರಡು ರೀತಿಯಲ್ಲಿ ಓದಬಹುದು.")
        val bits = items.map { "${it.display} (${it.readBack(lang)})" } + dates.map { "${it.display} (${it.readBack(lang)})" }
        val warn = buildList {
            if (items.any { it.confusions.isNotEmpty() }) add(risk[lang] ?: risk.getValue("en"))
            if (dates.any { it.ambiguous }) add(dateRisk[lang] ?: dateRisk.getValue("en"))
        }.joinToString(" ")
        return "${head[lang] ?: head.getValue("en")} ${bits.joinToString("; ")}.${if (warn.isNotEmpty()) " $warn" else ""} ${ask[lang] ?: ask.getValue("en")}"
    }
}
