package com.atelicove.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.atelicove.dto.DraftProjectRequest;
import com.atelicove.entities.DraftProject;
import com.atelicove.entities.Project;
import com.atelicove.repositories.DraftProjectRepository;
import com.atelicove.repositories.ProjectRepository;

@Service
public class DraftProjectService {

    private final DraftProjectRepository draftProjectRepository;
    private final ProjectRepository projectRepository;

    public DraftProjectService(
            DraftProjectRepository draftProjectRepository,
            ProjectRepository projectRepository) {
        this.draftProjectRepository = draftProjectRepository;
        this.projectRepository = projectRepository;
    }

    public List<DraftProject> findActive() {
        return draftProjectRepository.findByArchivedFalse();
    }

    public List<DraftProject> findArchived() {
        return draftProjectRepository.findByArchivedTrue();
    }

    public Optional<DraftProject> findById(Long id) {
        return draftProjectRepository.findById(id);
    }

    @Transactional
    public DraftProject create(DraftProjectRequest request) {
        DraftProject draft = new DraftProject();
        applyDraftProject(draft, request);
        draft.setArchived(false);
        draft.setArchivedAt(null);
        return draftProjectRepository.save(draft);
    }

    @Transactional
    public DraftProject update(Long id, DraftProjectRequest request) {
        DraftProject draft = requiredEditable(id);
        applyDraftProject(draft, request);
        return draftProjectRepository.save(draft);
    }

    @Transactional
    public void archive(Long id) {
        DraftProject draft = required(id);
        draft.setArchived(true);
        draft.setArchivedAt(LocalDateTime.now());
        draftProjectRepository.save(draft);
    }

    @Transactional
    public DraftProject restore(Long id) {
        DraftProject draft = required(id);
        draft.setArchived(false);
        draft.setArchivedAt(null);
        return draftProjectRepository.save(draft);
    }

    @Transactional
    public void deletePermanently(Long id) {
        DraftProject draft = required(id);
        if (!draft.isArchived()) {
            throw new IllegalStateException("Only archived draft projects can be permanently deleted");
        }
        draftProjectRepository.delete(draft);
    }

    private void applyDraftProject(DraftProject draft, DraftProjectRequest request) {
        if (request == null || request.draftName() == null || request.draftName().isBlank()) {
            throw new IllegalArgumentException("Draft project name is required");
        }
        if (request.budget() != null && request.budget().signum() < 0) {
            throw new IllegalArgumentException("Draft project budget cannot be negative");
        }
        draft.setDraftName(request.draftName().trim());
        draft.setDescription(request.description());
        draft.setBudget(request.budget());
        draft.setSourceProject(resolveSourceProject(request.sourceProjectID()));
    }

    private Project resolveSourceProject(Integer sourceProjectID) {
        if (sourceProjectID == null) {
            return null;
        }
        return projectRepository.findById(sourceProjectID)
                .orElseThrow(() -> new IllegalArgumentException("Source project not found"));
    }

    private DraftProject requiredEditable(Long id) {
        DraftProject draft = required(id);
        if (draft.isArchived()) {
            throw new IllegalStateException("Archived draft projects cannot be edited");
        }
        return draft;
    }

    private DraftProject required(Long id) {
        return draftProjectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Draft project not found"));
    }
}
