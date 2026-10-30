package com.ruralassistant.app.data

import android.content.Context
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.ruralassistant.app.BuildConfig
import com.ruralassistant.app.RuralApp
import com.ruralassistant.app.data.local.entity.KnowledgeEntity
import com.ruralassistant.app.data.local.entity.SchemeEntity
import com.ruralassistant.app.data.remote.api.FeatureApiClient
import com.ruralassistant.app.utils.ConnectivityMonitor

/**
 * Tracks how fresh the downloaded knowledge pack is — hurdle 1.
 *
 * "The information on the phone was correct on the day it was downloaded."
 * So we remember three things:
 *
 *   version      which pack we hold (a fingerprint of the content)
 *   verifiedAt   when we last confirmed it against the server
 *   contentAsOf  the date the newest fact in the pack was checked by a human
 *
 * and we ask the server *what changed* rather than only *that something
 * changed*, so the user sees "PM-KISAN — re-checked on 28 Sep, the amount may
 * have changed" instead of a vague "your copy is old".
 *
 * Everything here also works offline: the change list and the dates are cached
 * locally, so the warning still appears with no network.
 */
object KnowledgePack {
    private const val PREFS = "knowledge_pack"
    const val MAX_AGE_DAYS = 14
    private val LANGS = listOf("en", "hi", "kn")

    /** One entry that was re-checked after this phone downloaded its copy. */
    data class Change(
        val id: String,
        val category: String,
        val title: String,
        val asOf: String,
        val fields: List<String>,
        val verifyUrl: String?,
        val summary: String,
    )

    data class Status(
        val version: String?,
        val verifiedAtMillis: Long,   // 0 = never
        val serverSaysBehind: Boolean,
        val contentAsOf: String? = null,
        val changedCount: Int = 0,
    ) {
        val ageDays: Int? get() = if (verifiedAtMillis == 0L) null else ((System.currentTimeMillis() - verifiedAtMillis) / 86_400_000L).toInt()
        val stale: Boolean get() = serverSaysBehind || version == null || (ageDays ?: Int.MAX_VALUE) > MAX_AGE_DAYS
        val verifiedAtIso: String? get() = if (verifiedAtMillis == 0L) null
            else java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", java.util.Locale.US)
                .apply { timeZone = java.util.TimeZone.getTimeZone("UTC") }.format(java.util.Date(verifiedAtMillis))
        /** True when the server told us some answers moved on since our copy. */
        val hasChanges: Boolean get() = changedCount > 0
    }

    private fun prefs(context: Context) = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun status(context: Context): Status {
        val p = prefs(context)
        return Status(
            version = p.getString("version", null),
            verifiedAtMillis = p.getLong("verifiedAt", 0L),
            serverSaysBehind = p.getBoolean("behind", false),
            contentAsOf = p.getString("contentAsOf", null),
            changedCount = p.getInt("changedCount", 0),
        )
    }

    /** Human wording, in the user's language, for the banner. */
    fun message(status: Status, lang: String, online: Boolean): String {
        val age = status.ageDays
        val changed = status.changedCount
        return when (lang) {
            "hi" -> when {
                status.version == null -> "जानकारी अभी सर्वर से सत्यापित नहीं है। राशि और नियम बदल सकते हैं।"
                changed > 0 -> "$changed उत्तर आपकी कॉपी बनने के बाद फिर से जाँचे गए हैं। कदम उठाने से पहले उन्हें देखें।" + if (online) "" else " (इंटरनेट बंद है)"
                status.stale -> "यह जानकारी ${age ?: "?"} दिन पहले की है और बदल गई हो सकती है। कदम उठाने से पहले ग्राम पंचायत या आधिकारिक पोर्टल पर पुष्टि करें।" + if (online) "" else " (इंटरनेट बंद है)"
                else -> "जानकारी ${age ?: 0} दिन पहले सर्वर से जाँची गई थी।"
            }
            "kn" -> when {
                status.version == null -> "ಮಾಹಿತಿಯನ್ನು ಇನ್ನೂ ಸರ್ವರ್‌ನಿಂದ ಖಚಿತಪಡಿಸಿಲ್ಲ. ಮೊತ್ತ ಮತ್ತು ನಿಯಮಗಳು ಬದಲಾಗಬಹುದು."
                changed > 0 -> "ನಿಮ್ಮ ಪ್ರತಿ ತಯಾರಾದ ನಂತರ $changed ಉತ್ತರಗಳನ್ನು ಮತ್ತೆ ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ಮುಂದುವರಿಯುವ ಮೊದಲು ಅವುಗಳನ್ನು ನೋಡಿ." + if (online) "" else " (ಇಂಟರ್ನೆಟ್ ಇಲ್ಲ)"
                status.stale -> "ಈ ಮಾಹಿತಿ ${age ?: "?"} ದಿನಗಳ ಹಿಂದಿನದು, ಬದಲಾಗಿರಬಹುದು. ಮುಂದುವರಿಯುವ ಮೊದಲು ಗ್ರಾಮ ಪಂಚಾಯತ್ ಅಥವಾ ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ." + if (online) "" else " (ಇಂಟರ್ನೆಟ್ ಇಲ್ಲ)"
                else -> "ಮಾಹಿತಿಯನ್ನು ${age ?: 0} ದಿನಗಳ ಹಿಂದೆ ಸರ್ವರ್‌ನೊಂದಿಗೆ ಪರಿಶೀಲಿಸಲಾಗಿದೆ."
            }
            else -> when {
                status.version == null -> "This information has not been checked against the server yet. Amounts and rules may have changed."
                changed > 0 -> "$changed answer(s) have been re-checked since your copy was made. Open them before you act." + if (online) "" else " (You are offline.)"
                status.stale -> "This information is ${age ?: "?"} days old and may have changed. Confirm at the Gram Panchayat or the official portal before acting." + if (online) "" else " (You are offline.)"
                else -> "Information last checked with the server ${age ?: 0} day(s) ago."
            }
        }
    }

    /** "Checked on 28 Sep 2026" — the date the newest fact was verified. */
    fun checkedOnLabel(status: Status, lang: String): String {
        val date = status.contentAsOf?.take(10) ?: return ""
        return when (lang) {
            "hi" -> "जानकारी $date तक जाँची गई"
            "kn" -> "ಮಾಹಿತಿ $date ರವರೆಗೆ ಪರಿಶೀಲಿಸಲಾಗಿದೆ"
            else -> "Checked on $date"
        }
    }

    /** The cached list of entries that moved on since this copy was made. */
    fun changes(context: Context): List<Change> {
        val raw = prefs(context).getString("changes", null) ?: return emptyList()
        return try {
            val arr = JsonParser.parseString(raw).asJsonArray
            arr.mapNotNull { el ->
                val o = el.asJsonObject
                Change(
                    id = o.str("id"),
                    category = o.str("category"),
                    title = o.str("title"),
                    asOf = o.str("asOf"),
                    fields = o.getAsJsonArray("fields")?.mapNotNull { it.asString } ?: emptyList(),
                    verifyUrl = o.str("verifyUrl").ifBlank { null },
                    summary = o.str("summary"),
                )
            }
        } catch (_: Exception) {
            emptyList()
        }
    }

    /**
     * Ask the server whether our copy is current, what changed, and download the
     * whole pack into Room if it moved on. Safe to call any time: returns the new
     * Status, or the old one unchanged if the phone is offline or the call fails.
     */
    suspend fun refresh(context: Context): Status {
        val app = context.applicationContext
        if (!ConnectivityMonitor(app).currentlyOnline()) return status(app)
        return try {
            val api = FeatureApiClient.create(BuildConfig.API_BASE_URL)
            val before = status(app)
            val manifest = api.knowledgeManifest(before.version, before.verifiedAtIso).obj("data")
            val serverVersion = manifest.str("packVersion")
            if (serverVersion.isBlank()) return before
            val contentAsOf = manifest.str("contentAsOf").ifBlank { before.contentAsOf ?: "" }

            // What actually changed since this copy was made (hurdle 1).
            val changesJson = try {
                api.knowledgeChanges(before.verifiedAtIso, before.version).obj("data")
            } catch (_: Exception) {
                JsonObject()
            }
            val changeArray = changesJson.getAsJsonArray("changes")
            val changedCount = changeArray?.size() ?: 0

            if (before.version != serverVersion) downloadPack(app, api.knowledgePack().obj("data"))

            prefs(app).edit()
                .putString("version", serverVersion)
                .putLong("verifiedAt", System.currentTimeMillis())
                .putBoolean("behind", false)
                .putString("contentAsOf", contentAsOf)
                .putInt("changedCount", changedCount)
                .putString("changes", cacheChanges(changeArray))
                .apply()
            status(app)
        } catch (e: Exception) {
            status(app)
        }
    }

    /** Keep only what the screen shows, in the user's three languages. */
    private fun cacheChanges(arr: com.google.gson.JsonArray?): String {
        if (arr == null) return "[]"
        val out = com.google.gson.JsonArray()
        arr.forEach { el ->
            val o = el.asJsonObject
            val summary = o.getAsJsonObject("summary") ?: JsonObject()
            val item = JsonObject().apply {
                addProperty("id", o.str("id"))
                addProperty("category", o.str("category"))
                addProperty("asOf", o.str("asOf"))
                addProperty("verifyUrl", o.str("verifyUrl"))
                addProperty("title", loc(o.get("title"), "en"))
                val fields = com.google.gson.JsonArray()
                o.getAsJsonArray("changedFields")?.forEach { f -> fields.add(f.asString) }
                add("fields", fields)
                val sums = JsonObject().apply {
                    LANGS.forEach { l -> addProperty(l, loc(summary.get(l), l)) }
                }
                add("summary", sums)
            }
            out.add(item)
        }
        return out.toString()
    }

    /** Pick the change summary in the user's language, falling back to English. */
    fun summaryFor(change: Change, lang: String, context: Context): String {
        val raw = prefs(context).getString("changes", null) ?: return change.summary
        return try {
            JsonParser.parseString(raw).asJsonArray.firstOrNull { it.asJsonObject.str("id") == change.id }
                ?.asJsonObject?.getAsJsonObject("summary")?.let { loc(it.get(lang), lang) }
                ?.ifBlank { change.summary } ?: change.summary
        } catch (_: Exception) {
            change.summary
        }
    }

    private suspend fun downloadPack(context: Context, data: JsonObject) {
        val db = (context as RuralApp).container.database
        val now = System.currentTimeMillis()
        val schemes = ArrayList<SchemeEntity>()
        data.getAsJsonArray("schemes")?.forEach { el ->
            val s = el.asJsonObject
            val id = s.str("id")
            LANGS.forEach { lang ->
                schemes.add(SchemeEntity("$id|$lang", lang, loc(s.get("name"), lang), loc(s.get("description"), lang),
                    loc(s.get("eligibility"), lang), s.str("source"), now))
            }
        }
        val knowledge = ArrayList<KnowledgeEntity>()
        data.getAsJsonArray("knowledge")?.forEach { el ->
            val k = el.asJsonObject
            val id = k.str("id")
            LANGS.forEach { lang ->
                knowledge.add(KnowledgeEntity("$id|$lang", k.str("category"), lang, loc(k.get("question"), lang),
                    loc(k.get("answer"), lang), "", now))
            }
        }
        if (schemes.isNotEmpty()) db.schemeDao().upsertAll(schemes)
        if (knowledge.isNotEmpty()) db.knowledgeDao().upsertAll(knowledge)
    }

    private fun JsonObject.obj(key: String): JsonObject = getAsJsonObject(key) ?: JsonObject()
    private fun JsonObject.str(key: String): String =
        try { get(key)?.takeUnless { it.isJsonNull }?.asString ?: "" } catch (_: Exception) { "" }
    private fun loc(v: JsonElement?, lang: String): String {
        if (v == null || v.isJsonNull) return ""
        if (v.isJsonPrimitive) return v.asString
        if (v.isJsonObject) return v.asJsonObject.get(lang)?.takeUnless { it.isJsonNull }?.asString
            ?: v.asJsonObject.get("en")?.takeUnless { it.isJsonNull }?.asString ?: ""
        return ""
    }
}
