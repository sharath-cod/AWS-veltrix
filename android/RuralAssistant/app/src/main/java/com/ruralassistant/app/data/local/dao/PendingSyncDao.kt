package com.ruralassistant.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import com.ruralassistant.app.data.local.entity.PendingSyncEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface PendingSyncDao {
    @Query("SELECT COUNT(*) FROM pending_sync")
    fun observeCount(): Flow<Int>

    @Query("SELECT COUNT(*) FROM pending_sync")
    suspend fun count(): Int

    @Query("SELECT * FROM pending_sync ORDER BY createdAt")
    suspend fun getAll(): List<PendingSyncEntity>

    @Insert
    suspend fun insert(operation: PendingSyncEntity): Long

    @Query("DELETE FROM pending_sync WHERE id = :id")
    suspend fun deleteById(id: Long)

    /**
     * Cancel a queued create.
     *
     * Used when a reminder that was added offline is either deleted before it
     * ever reached the server, or saved again once the network came back — in
     * both cases the queued create must not be sent, or the reminder would
     * appear twice. For a create, `entityId` holds the client id.
     */
    @Query("DELETE FROM pending_sync WHERE entityType = 'reminder' AND operation = 'create' AND entityId = :entityId")
    suspend fun deleteQueuedCreate(entityId: String): Int
}
