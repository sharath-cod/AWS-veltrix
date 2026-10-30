package com.ruralassistant.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

/** Outbox: operations made offline that must be sent to /api/sync when internet returns. */
@Entity(tableName = "pending_sync")
data class PendingSyncEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val entityType: String,
    val entityId: String,
    val operation: String,
    val payloadJson: String,
    val createdAt: Long,
    val attempts: Int = 0,
)
