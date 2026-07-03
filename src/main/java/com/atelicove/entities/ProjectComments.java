package com.atelicove.entities;

import java.time.LocalDateTime;

import com.atelicove.enums.CommentType;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "project_comment")
public class ProjectComments {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private int projectCommentID;

	@JsonIgnore
	@ManyToOne
	@JoinColumn(name = "project_id")
	private Project project;

	@ManyToOne
	@JoinColumn(name = "worker_id")
	private Worker author;

	@Column(length = 2000)
	private String commentText;

	@Enumerated(EnumType.STRING)
	private CommentType commentType;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	public ProjectComments() {}

	public ProjectComments(String commentText, Worker author) {
		this.commentText = commentText;
		this.author = author;
	}

	@PrePersist
	protected void onCreate() {
		createdAt = LocalDateTime.now();
	}

	public int getProjectCommentID() {
		return projectCommentID;
	}

	public Project getProject() {
		return project;
	}

	public Worker getAuthor() {
		return author;
	}

	public String getCommentText() {
		return commentText;
	}

	public CommentType getCommentType() {
		return commentType;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setProjectCommentID(int projectCommentID) {
		this.projectCommentID = projectCommentID;
	}

	public void setProject(Project project) {
		this.project = project;
	}

	public void setAuthor(Worker author) {
		this.author = author;
	}

	public void setCommentText(String commentText) {
		this.commentText = commentText;
	}

	public void setCommentType(CommentType commentType) {
		this.commentType = commentType;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}
}
