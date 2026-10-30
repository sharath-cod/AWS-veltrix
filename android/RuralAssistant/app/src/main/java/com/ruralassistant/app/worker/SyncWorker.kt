package com.ruralassistant.app.worker

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.ruralassistant.app.RuralApp

/**
 * Foundation only (Phase 1). Later phases: read pending_sync rows, POST them to /api/sync,
 * delete the ones the server accepted, and return Result.retry() on network errors.
 */
class SyncWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val container = (applicationContext as RuralApp).container
        val pending = container.database.pendingSyncDao().count()
        Log.d(TAG, "SyncWorker ran. Pending operations: $pending (sync logic comes in a later phase)")
        return Result.success()
    }

    private companion object {
        const val TAG = "SyncWorker"
    }
}
