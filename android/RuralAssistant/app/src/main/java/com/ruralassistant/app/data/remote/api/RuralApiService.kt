package com.ruralassistant.app.data.remote.api

import com.google.gson.JsonObject
import com.ruralassistant.app.data.remote.dto.HealthResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST

interface RuralApiService {
    @GET("api/health")
    suspend fun getHealth(): HealthResponse

    /** Offline outbox drain: POST /api/sync (see SyncWorker). */
    @POST("api/sync")
    suspend fun pushSync(@Header("X-Device-Id") deviceId: String, @Body body: JsonObject): JsonObject
}
