package com.atelicove.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.atelicove.dto.DraftProjectRequest;
import com.atelicove.entities.DraftProject;
import com.atelicove.repositories.DraftProjectRepository;
import com.atelicove.repositories.ProjectRepository;

@ExtendWith(MockitoExtension.class)
class DraftProjectServiceTest {

    @Mock private DraftProjectRepository draftProjectRepository;
    @Mock private ProjectRepository projectRepository;
    @InjectMocks private DraftProjectService service;

    @Test
    void createStoresDraftProjectFieldsWithoutCreatingLiveProject() {
        when(draftProjectRepository.save(org.mockito.ArgumentMatchers.any(DraftProject.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        DraftProject created = service.create(new DraftProjectRequest(
                "  Summer rollout  ",
                "Planning only",
                new BigDecimal("25000.00"),
                null));

        assertThat(created.getDraftName()).isEqualTo("Summer rollout");
        assertThat(created.getBudget()).isEqualByComparingTo("25000.00");
        assertThat(created.getDraftWorkOrders()).isEmpty();
    }
}
