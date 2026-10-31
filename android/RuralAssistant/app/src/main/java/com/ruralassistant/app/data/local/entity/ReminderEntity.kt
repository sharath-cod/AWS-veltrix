package com.ruralassistant.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * A reminder as this phone knows it.
 *
 * The same row serves two purposes: it is the offline copy of what the server
 * holds (`synced = true`, `serverId` set), and it is the local copy of a
 * reminder created while there was no network (`synced = false`, `clientId`
 * set, a matching row queued in `pending_sync`).
 *
 * `type`, `repeat`, `notes`, `serverId` and `clientId` were added when the
 * reminder screen gained a real add/edit dialog: the previous version could only
 * store a title and a timestamp, so a reminder created offline reached the
 * server without its type or repeat rule.
 */
@Entity(tableName = "reminders")
data class ReminderEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    /** Id on the server, empty until the reminder has been accepted there. */
    val serverId: String = "",
    /** Idempotency key sent with the create, so a retry cannot duplicate. */
    val clientId: String = "",
    val title: String,
    val notes: String = "",
    /** health | medicine | appointment | scheme | scholarship | other */
    val type: String = "other",
    /** none | daily | weekly | monthly | yearly */
    val repeat: String = "none",
    val triggerAtMillis: Long,
    val completed: Boolean = false,
    val createdAt: Long,
    val synced: Boolean = false,
)
