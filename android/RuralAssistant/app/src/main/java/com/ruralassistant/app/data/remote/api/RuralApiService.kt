package com.ruralassistant.app.data.remote.api

import com.ruralassistant.app.data.remote.dto.HealthResponse
import retrofit2.http.GET

interface RuralApiService {
    @GET("api/health")
    suspend fun getHealth(): HealthResponse

    // Future phases: /api/knowledge, /api/query, /api/schemes, /api/scholarships,
    // /api/reminders, /api/scam-check, /api/sync
}
