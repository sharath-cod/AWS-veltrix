package com.ruralassistant.app.utils

import android.content.Context
import java.util.UUID

/**
 * Anonymous per-install identifier sent as X-Device-Id.
 * No account, no phone number, no personal data: just a random UUID that keeps
 * reminders and saved scholarships together for this phone.
 */
object DeviceId {
    private const val PREFS = "rural_assistant_device"
    private const val KEY = "id"

    fun get(context: Context): String {
        val prefs = context.applicationContext.getSharedPreferences(PREFS, 0)
        prefs.getString(KEY, null)?.let { return it }
        val id = UUID.randomUUID().toString()
        prefs.edit().putString(KEY, id).apply()
        return id
    }
}
