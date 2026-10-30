package com.ruralassistant.app.domain.repository

import kotlinx.coroutines.flow.Flow

interface SyncRepository {
    val pendingCount: Flow<Int>
    fun syncNow()
}
