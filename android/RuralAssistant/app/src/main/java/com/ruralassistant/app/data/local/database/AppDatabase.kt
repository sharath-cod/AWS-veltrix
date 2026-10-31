package com.ruralassistant.app.data.local.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
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
    version = 2,
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

        /**
         * Version 2 adds the fields the reminder dialog needs: the type, the repeat
         * rule, the notes, and the server/client ids that let an offline reminder be
         * matched with the row the server eventually creates. Existing reminders are
         * kept — the defaults make them "other", "none", not yet synced.
         */
        val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE reminders ADD COLUMN serverId TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE reminders ADD COLUMN clientId TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE reminders ADD COLUMN type TEXT NOT NULL DEFAULT 'other'")
                db.execSQL("ALTER TABLE reminders ADD COLUMN repeat TEXT NOT NULL DEFAULT 'none'")
            }
        }

        fun build(context: Context): AppDatabase =
            Room.databaseBuilder(context.applicationContext, AppDatabase::class.java, DB_NAME)
                .addMigrations(MIGRATION_1_2)
                .build()
    }
}
