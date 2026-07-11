package com.atelicove.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Version;

import com.fasterxml.jackson.annotation.JsonProperty;

@MappedSuperclass
public abstract class BaseEntity {
	
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @Column(nullable = false, updatable = false)
    protected LocalDateTime createdAt;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @Column(nullable = false)
    protected LocalDateTime lastModifiedAt;

    @Version
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long version;

    @PrePersist
    protected final void onCreate() {
        createdAt = LocalDateTime.now();
        lastModifiedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected final void onUpdate() {
    	lastModifiedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getLastModifiedAt() {
        return lastModifiedAt;
    }

    public Long getVersion() {
        return version;
    }
}
