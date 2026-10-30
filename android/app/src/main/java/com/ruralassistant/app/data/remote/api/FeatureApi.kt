package com.ruralassistant.app.data.remote.api

import com.google.gson.JsonObject
import retrofit2.http.*
import okhttp3.RequestBody

interface FeatureApi {
    @GET("api/knowledge")
    suspend fun knowledge(@Query("q") q: String? = null, @Query("category") category: String? = null): JsonObject
    @POST("api/query")
    suspend fun ask(@Header("X-Device-Id") deviceId: String, @Body body: JsonObject): JsonObject
    @GET("api/schemes")
    suspend fun schemes(@Query("q") q: String? = null, @Query("category") category: String? = null): JsonObject
    @POST("api/schemes/check")
    suspend fun schemeCheck(@Body body: JsonObject): JsonObject
    @GET("api/scholarships")
    suspend fun scholarships(@Query("q") q: String? = null, @Query("open") open: Boolean? = true): JsonObject
    @GET("api/scholarships/saved")
    suspend fun savedScholarships(@Header("X-Device-Id") deviceId: String): JsonObject
    @POST("api/scholarships/saved")
    suspend fun saveScholarship(@Header("X-Device-Id") deviceId: String, @Body body: JsonObject): JsonObject
    @DELETE("api/scholarships/saved/{id}")
    suspend fun unsaveScholarship(@Header("X-Device-Id") deviceId: String, @Path("id") id: String): JsonObject
    @GET("api/reminders")
    suspend fun reminders(@Header("X-Device-Id") deviceId: String): JsonObject
    @POST("api/reminders")
    suspend fun createReminder(@Header("X-Device-Id") deviceId: String, @Body body: JsonObject): JsonObject
    @PUT("api/reminders/{id}")
    suspend fun updateReminder(@Header("X-Device-Id") deviceId: String, @Path("id") id: String, @Body body: JsonObject): JsonObject
    @DELETE("api/reminders/{id}")
    suspend fun deleteReminder(@Header("X-Device-Id") deviceId: String, @Path("id") id: String): JsonObject
    @POST("api/scam-check")
    suspend fun scamCheck(@Body body: JsonObject): JsonObject
    @POST("api/sms/preview")
    suspend fun smsPreview(@Header("X-Device-Id") deviceId: String, @Body body: JsonObject): JsonObject
    @POST("api/sms/send")
    suspend fun smsSend(@Header("X-Device-Id") deviceId: String, @Body body: JsonObject): JsonObject
    @GET("api/sms")
    suspend fun smsHistory(@Header("X-Device-Id") deviceId: String): JsonObject
    @POST("api/voice-sessions")
    suspend fun startVoiceSession(@Header("X-Device-Id") deviceId: String, @Body body: JsonObject): JsonObject
    @Headers("Content-Type: audio/mp4")
    @POST("api/voice-sessions/{id}/turns")
    suspend fun voiceTurn(@Header("X-Device-Id") deviceId: String, @Path("id") id: String, @Query("language") language: String, @Body audio: RequestBody): JsonObject
    @DELETE("api/voice-sessions/{id}")
    suspend fun endVoiceSession(@Path("id") id: String): JsonObject
}

object FeatureApiClient {
    fun create(baseUrl: String): FeatureApi {
        val normalized = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"
        return retrofit2.Retrofit.Builder()
            .baseUrl(normalized)
            .client(okhttp3.OkHttpClient.Builder()
                .connectTimeout(20, java.util.concurrent.TimeUnit.SECONDS)
                .readTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
                .writeTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
                .build())
            .addConverterFactory(retrofit2.converter.gson.GsonConverterFactory.create())
            .build().create(FeatureApi::class.java)
    }
}
