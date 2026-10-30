package com.ruralassistant.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.ruralassistant.app.data.local.entity.ScholarshipEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ScholarshipDao {
    @Query("SELECT * FROM scholarships WHERE language = :language ORDER BY name")
    fun observeByLanguage(language: String): Flow<List<ScholarshipEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(items: List<ScholarshipEntity>)

    @Query("SELECT COUNT(*) FROM scholarships")
    suspend fun count(): Int
}
