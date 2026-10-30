package com.ruralassistant.app.domain.repository

import com.ruralassistant.app.domain.model.BackendHealth

interface BackendRepository {
    /** Online-only call. Returns a failure (never throws) when the backend is unreachable. */
    suspend fun checkHealth(): Result<BackendHealth>
}
