package com.atelicove.services;

import static com.atelicove.support.TestFixtures.PROJECT_ID;
import static com.atelicove.support.TestFixtures.aProject;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.atelicove.dto.DraftProjectRequest;
import com.atelicove.entities.DraftProject;
import com.atelicove.entities.Project;
import com.atelicove.repositories.DraftProjectRepository;
import com.atelicove.repositories.ProjectRepository;

@ExtendWith(MockitoExtension.class)
class DraftProjectServiceTest {

    private static final long DRAFT_ID = 15L;
    private static final String DRAFT_NAME = "Summer rollout";

    @Mock private DraftProjectRepository draftProjectRepository;
    @Mock private ProjectRepository projectRepository;
    @InjectMocks private DraftProjectService service;

    @Nested
    class Queries {

        @Test
        void queryMethods_ShouldReturnExactRepositoryResults() {
            // Given
            DraftProject draft = draft();
            List<DraftProject> drafts = List.of(draft);
            when(draftProjectRepository.findByArchivedFalse()).thenReturn(drafts);
            when(draftProjectRepository.findByArchivedTrue()).thenReturn(drafts);
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(draft));

            // When / Then
            assertThat(service.findActive()).isSameAs(drafts);
            assertThat(service.findArchived()).isSameAs(drafts);
            assertThat(service.findById(DRAFT_ID)).containsSame(draft);
        }
    }

    @Nested
    class CreateAndUpdate {

        @Test
        void create_ShouldNormalizeFieldsAndResolveSourceProject() {
            // Given
            Project source = aProject().build();
            DraftProjectRequest request = request("  " + DRAFT_NAME + "  ", new BigDecimal("25000.00"), PROJECT_ID);
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(source));
            when(draftProjectRepository.save(any(DraftProject.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            DraftProject created = service.create(request);

            // Then
            assertThat(created.getDraftName()).isEqualTo(DRAFT_NAME);
            assertThat(created.getDescription()).isEqualTo("Planning only");
            assertThat(created.getBudget()).isEqualByComparingTo("25000.00");
            assertThat(created.getSourceProject()).isSameAs(source);
            assertThat(created.isArchived()).isFalse();
        }

        @Test
        void update_ShouldModifyEditableDraft_WhenRequestIsValid() {
            // Given
            DraftProject draft = draft();
            DraftProjectRequest request = request("Updated", BigDecimal.TEN, null);
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(draft));
            when(draftProjectRepository.save(draft)).thenReturn(draft);

            // When
            DraftProject result = service.update(DRAFT_ID, request);

            // Then
            assertThat(result).isSameAs(draft);
            assertThat(draft.getDraftName()).isEqualTo("Updated");
            assertThat(draft.getBudget()).isEqualByComparingTo(BigDecimal.TEN);
        }

        @ParameterizedTest
        @NullAndEmptySource
        void create_ShouldRejectMissingName(String name) {
            // Given
            DraftProjectRequest request = request(name, BigDecimal.ZERO, null);

            // When / Then
            assertThatThrownBy(() -> service.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Draft project name is required");
            verify(draftProjectRepository, never()).save(any());
        }

        @Test
        void create_ShouldRejectNullRequestNegativeBudgetAndUnknownSource() {
            // When / Then
            assertThatThrownBy(() -> service.create(null))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Draft project name is required");
            assertThatThrownBy(() -> service.create(request(DRAFT_NAME, BigDecimal.valueOf(-1), null)))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Draft project budget cannot be negative");

            // Given
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> service.create(request(DRAFT_NAME, BigDecimal.ZERO, PROJECT_ID)))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Source project not found");
        }

        @Test
        void update_ShouldRejectUnknownOrArchivedDraft() {
            // Given
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> service.update(DRAFT_ID, request(DRAFT_NAME, BigDecimal.ZERO, null)))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Draft project not found");

            // Given
            DraftProject archived = draft();
            archived.setArchived(true);
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(archived));

            // When / Then
            assertThatThrownBy(() -> service.update(DRAFT_ID, request(DRAFT_NAME, BigDecimal.ZERO, null)))
                    .isInstanceOf(IllegalStateException.class).hasMessage("Archived draft projects cannot be edited");
        }
    }

    @Nested
    class Lifecycle {

        @Test
        void archiveAndRestore_ShouldManageArchiveMetadata() {
            // Given
            DraftProject draft = draft();
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(draft));
            when(draftProjectRepository.save(draft)).thenReturn(draft);

            // When
            service.archive(DRAFT_ID);

            // Then
            assertThat(draft.isArchived()).isTrue();
            assertThat(draft.getArchivedAt()).isNotNull();

            // When
            DraftProject restored = service.restore(DRAFT_ID);

            // Then
            assertThat(restored).isSameAs(draft);
            assertThat(draft.isArchived()).isFalse();
            assertThat(draft.getArchivedAt()).isNull();
        }

        @Test
        void lifecycleMethods_ShouldRejectUnknownDraft() {
            // Given
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> service.archive(DRAFT_ID))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Draft project not found");
            assertThatThrownBy(() -> service.restore(DRAFT_ID))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Draft project not found");
            assertThatThrownBy(() -> service.deletePermanently(DRAFT_ID))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Draft project not found");
        }

        @Test
        void deletePermanently_ShouldDeleteOnlyArchivedDraft() {
            // Given
            DraftProject active = draft();
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(active));

            // When / Then
            assertThatThrownBy(() -> service.deletePermanently(DRAFT_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Only archived draft projects can be permanently deleted");

            // Given
            active.setArchived(true);

            // When
            service.deletePermanently(DRAFT_ID);

            // Then
            verify(draftProjectRepository).delete(active);
        }
    }

    private DraftProject draft() {
        DraftProject draft = new DraftProject();
        draft.setDraftProjectId(DRAFT_ID);
        draft.setDraftName(DRAFT_NAME);
        return draft;
    }

    private DraftProjectRequest request(String name, BigDecimal budget, Integer sourceProjectId) {
        return new DraftProjectRequest(name, "Planning only", budget, sourceProjectId);
    }
}
