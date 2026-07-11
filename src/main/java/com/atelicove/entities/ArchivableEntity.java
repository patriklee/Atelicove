package com.atelicove.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import com.fasterxml.jackson.annotation.JsonProperty;

@MappedSuperclass
public abstract class ArchivableEntity extends BaseEntity {
	
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @Column(nullable = false)
    private boolean archived = false;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @Column
    private LocalDateTime archivedAt;

	public boolean isArchived() {
		return archived;
	}
	
	public LocalDateTime getArchivedAt() {
		return archivedAt;
	}
	
	public void setArchived(boolean archived) {
		this.archived = archived;
	}

	public void setArchivedAt(LocalDateTime archivedAt) {
		this.archivedAt = archivedAt;
	}
}
