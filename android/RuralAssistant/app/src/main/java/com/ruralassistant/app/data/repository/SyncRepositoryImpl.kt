package com.ruralassistant.app.data.repository

import android.content.Context
import com.ruralassistant.app.data.local.dao.PendingSyncDao
import com.ruralassistant.app.domain.repository.SyncRepository
import com.ruralassistant.app.worker.SyncScheduler
import kotlinx.coroutines.flow.Flow

class SyncRepositoryImpl(
    private val context: Context,
    private val dao: PendingSyncDao,
) : SyncRepository {
    override val pendingCount: Flow<Int> = dao.observeCount()
    override fun syncNow() = SyncScheduler.syncNow(context)
}
