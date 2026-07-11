package com.atelicove.services;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.atelicove.entities.DraftProject;
import com.atelicove.repositories.DraftProjectRepository;

@Service
public class DraftProjectService {

    private final DraftProjectRepository draftProjectRepository;

    public DraftProjectService(DraftProjectRepository draftProjectRepository) {
        this.draftProjectRepository = draftProjectRepository;
    }

    public List<DraftProject> findActive() {
        return draftProjectRepository.findByArchivedFalse();
    }

    public List<DraftProject> findArchived() {
        return draftProjectRepository.findByArchivedTrue();
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

    private DraftProject required(Long id) {
        return draftProjectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Draft project not found"));
    }
}
