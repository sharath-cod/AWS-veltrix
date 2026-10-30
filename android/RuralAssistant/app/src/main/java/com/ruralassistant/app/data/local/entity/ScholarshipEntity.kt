package com.ruralassistant.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "scholarships")
data class ScholarshipEntity(
    @PrimaryKey val id: String,
    val language: String,
    val name: String,
    val description: String,
    val eligibility: String,
    val deadline: String?,
    val source: String,
    val updatedAt: Long,
)
