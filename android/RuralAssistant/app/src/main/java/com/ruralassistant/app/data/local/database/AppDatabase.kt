package com.ruralassistant.app.data.local.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.ruralassistant.app.data.local.dao.KnowledgeDao
import com.ruralassistant.app.data.local.dao.PendingSyncDao
import com.ruralassistant.app.data.local.dao.ReminderDao
import com.ruralassistant.app.data.local.dao.SchemeDao
import com.ruralassistant.app.data.local.dao.ScholarshipDao
import com.ruralassistant.app.data.local.entity.KnowledgeEntity
import com.ruralassistant.app.data.local.entity.PendingSyncEntity
import com.ruralassistant.app.data.local.entity.ReminderEntity
import com.ruralassistant.app.data.local.entity.SchemeEntity
import com.ruralassistant.app.data.local.entity.ScholarshipEntity

@Database(
    entities = [
        KnowledgeEntity::class,
        SchemeEntity::class,
        ScholarshipEntity::class,
        ReminderEntity::class,
        PendingSyncEntity::class,
    ],
    version = 1,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun knowledgeDao(): KnowledgeDao
    abstract fun schemeDao(): SchemeDao
    abstract fun scholarshipDao(): ScholarshipDao
    abstract fun reminderDao(): ReminderDao
    abstract fun pendingSyncDao(): PendingSyncDao

    companion object {
        private const val DB_NAME = "rural_assistant.db"

        fun build(context: Context): AppDatabase =
            Room.databaseBuilder(context.applicationContext, AppDatabase::class.java, DB_NAME).build()
    }
}
