package com.ruralassistant.app.data.repository

import com.ruralassistant.app.data.remote.api.RuralApiService
import com.ruralassistant.app.domain.model.BackendHealth
import com.ruralassistant.app.domain.repository.BackendRepository
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class BackendRepositoryImpl(private val api: RuralApiService) : BackendRepository {
    override suspend fun checkHealth(): Result<BackendHealth> = withContext(Dispatchers.IO) {
        try {
            val r = api.getHealth()
            Result.success(
                BackendHealth(
                    isRunning = r.success == true,
                    message = r.message.orEmpty(),
                    database = r.database ?: "unknown",
                )
            )
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
