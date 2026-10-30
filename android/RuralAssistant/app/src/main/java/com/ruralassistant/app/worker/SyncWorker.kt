package com.ruralassistant.app.worker

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.ruralassistant.app.BuildConfig
import com.ruralassistant.app.RuralApp
import com.ruralassistant.app.data.remote.api.ApiClient
import com.ruralassistant.app.data.remote.api.RuralApiService
import com.ruralassistant.app.utils.DeviceId

/**
 * Drains the Room outbox (pending_sync) to POST /api/sync whenever the network
 * is available. Operations the server accepts are deleted locally; if the call
 * fails the worker returns Result.retry() so WorkManager tries again later.
 */
class SyncWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val container = (applicationContext as RuralApp).container
        val dao = container.database.pendingSyncDao()
        val pending = dao.getAll()
        if (pending.isEmpty()) return Result.success()

        val operations = JsonArray()
        pending.forEach { row ->
            val operation = JsonObject().apply {
                addProperty("id", row.id.toString())
                addProperty("entityType", row.entityType)
                addProperty("entityId", row.entityId)
                addProperty("operation", row.operation)
                addProperty("createdAt", row.createdAt)
                add(
                    "payload",
                    runCatching { JsonParser.parseString(row.payloadJson) }.getOrElse { JsonObject() },
                )
            }
            operations.add(operation)
        }
        val body = JsonObject().apply { add("operations", operations) }

        return try {
            val api = ApiClient.create(BuildConfig.API_BASE_URL, BuildConfig.DEBUG)
                .create(RuralApiService::class.java)
            val response = api.pushSync(DeviceId.get(applicationContext), body)
            val accepted = response.getAsJsonObject("data")?.getAsJsonArray("accepted")

            var cleared = 0
            accepted?.forEach { element ->
                val localId = element.asJsonObject
                    .get("id")
                    ?.takeUnless { it.isJsonNull }
                    ?.asString
                    ?.toLongOrNull()
                if (localId != null) {
                    dao.deleteById(localId)
                    cleared += 1
                }
            }
            Log.d(TAG, "Pushed ${pending.size} operations, cleared $cleared")
            Result.success()
        } catch (e: Exception) {
            Log.w(TAG, "Sync failed, will retry: ${e.message}")
            Result.retry()
        }
    }

    private companion object {
        const val TAG = "SyncWorker"
    }
}
