package com.ruralassistant.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.ruralassistant.app.data.local.entity.ReminderEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ReminderDao {
    @Query("SELECT * FROM reminders ORDER BY completed ASC, triggerAtMillis ASC")
    fun observeAll(): Flow<List<ReminderEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(reminder: ReminderEntity): Long

    @Query("DELETE FROM reminders WHERE id = :id")
    suspend fun deleteById(id: Long)

    @Query("SELECT COUNT(*) FROM reminders")
    suspend fun count(): Int

    /**
     * Drop the cached copies of what the server holds, before writing a fresh
     * list. Rows created on this phone that have not synced yet are kept, so a
     * refresh cannot throw away something the user just added offline.
     */
    @Query("DELETE FROM reminders WHERE synced = 1")
    suspend fun clearSynced(): Int
}
