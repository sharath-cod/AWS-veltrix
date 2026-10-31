package com.ruralassistant.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.ruralassistant.app.data.local.entity.KnowledgeEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface KnowledgeDao {
    @Query("SELECT * FROM knowledge_items WHERE language = :language ORDER BY title")
    fun observeByLanguage(language: String): Flow<List<KnowledgeEntity>>

    /** Offline answers: the whole pack for one language, read once per question. */
    @Query("SELECT * FROM knowledge_items WHERE language = :language")
    suspend fun getByLanguage(language: String): List<KnowledgeEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(items: List<KnowledgeEntity>)

    @Query("SELECT COUNT(*) FROM knowledge_items")
    suspend fun count(): Int
}
