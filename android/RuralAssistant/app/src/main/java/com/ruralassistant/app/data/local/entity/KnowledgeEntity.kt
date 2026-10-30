package com.ruralassistant.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

/** Cached trusted knowledge (health answers etc.) used for offline answers. */
@Entity(tableName = "knowledge_items")
data class KnowledgeEntity(
    @PrimaryKey val id: String,
    val category: String,
    val language: String,
    val title: String,
    val answer: String,
    val source: String,
    val updatedAt: Long,
)
