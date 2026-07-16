package com.atelicove.dto;

import com.atelicove.entities.Project;
import com.atelicove.enums.ProjectStatus;

/** Stable, recursion-safe response returned after launching a draft project. */
public record DraftProjectLaunchResponse(
        Integer projectID,
        String projectName,
        ProjectStatus projectStatus) {

    public static DraftProjectLaunchResponse from(Project project) {
        return new DraftProjectLaunchResponse(
                project.getProjectID(),
                project.getProjectName(),
                project.getProjectStatus());
    }
}
