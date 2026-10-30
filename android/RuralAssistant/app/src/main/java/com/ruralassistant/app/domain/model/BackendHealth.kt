package com.ruralassistant.app.domain.model

data class BackendHealth(
    val isRunning: Boolean,
    val message: String,
    val database: String,
)
