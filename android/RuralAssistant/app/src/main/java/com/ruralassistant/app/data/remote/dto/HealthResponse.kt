package com.ruralassistant.app.data.remote.dto

/** Matches GET /api/health. Fields are nullable because Gson ignores Kotlin null-safety. */
data class HealthResponse(
    val success: Boolean? = null,
    val message: String? = null,
    val database: String? = null,
)
