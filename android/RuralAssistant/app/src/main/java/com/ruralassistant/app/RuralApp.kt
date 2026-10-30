package com.ruralassistant.app

import android.app.Application
import android.util.Log
import com.ruralassistant.app.worker.SyncScheduler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class RuralApp : Application() {

    lateinit var container: AppContainer
        private set

    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)

        // WorkManager foundation: periodic sync that only runs when internet is available.
        SyncScheduler.schedulePeriodic(this)

        // Room foundation: opens the DB off the main thread and logs the result (check Logcat tag "RuralApp").
        appScope.launch {
            val pending = container.database.pendingSyncDao().count()
            Log.d(TAG, "Room ready. Pending sync operations: $pending. Backend: ${BuildConfig.API_BASE_URL}")
        }
    }

    private companion object {
        const val TAG = "RuralApp"
    }
}
