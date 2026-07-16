package com.atelicove.services;

import static com.atelicove.support.TestFixtures.EMAIL;
import static com.atelicove.support.TestFixtures.ENCODED_PASSWORD;
import static com.atelicove.support.TestFixtures.RAW_PASSWORD;
import static com.atelicove.support.TestFixtures.USERNAME;
import static com.atelicove.support.TestFixtures.WORKER_ID;
import static com.atelicove.support.TestFixtures.aWorkOrder;
import static com.atelicove.support.TestFixtures.aWorker;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;
import java.util.stream.Stream;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.atelicove.entities.Worker;
import com.atelicove.entities.WorkOrder;
import com.atelicove.enums.WorkOrderStatus;
import com.atelicove.repositories.WorkerRepository;

@ExtendWith(MockitoExtension.class)
class WorkerServiceTest {

    private static final String NEW_PASSWORD = "new-password";

    @Mock private WorkerRepository workerRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @InjectMocks private WorkerService service;

    @Nested
    class CreateWorker {

        @Test
        void createWorker_ShouldNormalizeEncodeAndPersist_WhenRequestIsValid() {
            // Given
            Worker worker = aWorker()
                    .withUsername("  " + USERNAME + "  ")
                    .withEmail("  PAT.LEE@ATELICOVE.TEST  ")
                    .withPassword(RAW_PASSWORD)
                    .archived()
                    .build();
            when(workerRepository.findByWorkerUserIgnoreCase(USERNAME)).thenReturn(Optional.empty());
            when(workerRepository.findByWorkerEmailIgnoreCase(EMAIL)).thenReturn(Optional.empty());
            when(passwordEncoder.encode(RAW_PASSWORD)).thenReturn(ENCODED_PASSWORD);
            when(workerRepository.save(worker)).thenReturn(worker);

            // When
            Worker result = service.createWorker(worker);

            // Then
            assertThat(result).isSameAs(worker);
            assertThat(worker.getWorkerUser()).isEqualTo(USERNAME);
            assertThat(worker.getWorkerEmail()).isEqualTo(EMAIL);
            assertThat(worker.getWorkerPW()).isEqualTo(ENCODED_PASSWORD);
            assertThat(worker.isArchived()).isFalse();
            assertThat(worker.getArchivedAt()).isNull();
            verify(passwordEncoder).encode(RAW_PASSWORD);
            verify(workerRepository).save(worker);
        }

        @ParameterizedTest(name = "invalid profile: {0}")
        @MethodSource("com.atelicove.services.WorkerServiceTest#invalidWorkerProfiles")
        void createWorker_ShouldRejectInvalidRequiredFields(
                String scenario, Consumer<Worker> invalidator, String expectedMessage) {
            // Given
            Worker worker = aWorker().withPassword(RAW_PASSWORD).build();
            invalidator.accept(worker);

            // When / Then
            assertThatThrownBy(() -> service.createWorker(worker))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage(expectedMessage);
            verify(workerRepository, never()).save(worker);
        }

        @Test
        void createWorker_ShouldRejectDuplicateUsernameAndEmail() {
            // Given
            Worker request = aWorker().withPassword(RAW_PASSWORD).build();
            Worker existing = aWorker().withId(999).build();
            when(workerRepository.findByWorkerUserIgnoreCase(USERNAME)).thenReturn(Optional.of(existing));

            // When / Then
            assertThatThrownBy(() -> service.createWorker(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Username already exists");

            // Given
            when(workerRepository.findByWorkerUserIgnoreCase(USERNAME)).thenReturn(Optional.empty());
            when(workerRepository.findByWorkerEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(existing));

            // When / Then
            assertThatThrownBy(() -> service.createWorker(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Email already exists");
        }
    }

    @Nested
    class Queries {

        @Test
        void queryMethods_ShouldReturnExactRepositoryResults() {
            // Given
            Worker worker = aWorker().build();
            List<Worker> workers = List.of(worker);
            when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(USERNAME)).thenReturn(Optional.of(worker));
            when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.of(worker));
            when(workerRepository.findByArchivedFalse()).thenReturn(workers);
            when(workerRepository.findAll()).thenReturn(workers);
            when(workerRepository.findByArchivedTrue()).thenReturn(workers);

            // When / Then
            assertThat(service.findByUsername(USERNAME)).containsSame(worker);
            assertThat(service.findById(WORKER_ID)).containsSame(worker);
            assertThat(service.findActive()).isSameAs(workers);
            assertThat(service.findAll()).isSameAs(workers);
            assertThat(service.findArchived()).isSameAs(workers);
        }
    }

    @Nested
    class Updates {

        @Test
        void updateWorker_ShouldApplyAdminManagedFields_WhenRequestIsValid() {
            // Given
            Worker existing = aWorker().build();
            Worker request = aWorker().withUsername("new.user").withEmail("NEW@TEST.COM").asAdmin().build();
            request.setWorkerDisplayName("New Display");
            request.setRoleTitle("Inspector");
            when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.of(existing));
            when(workerRepository.findByWorkerUserIgnoreCase("new.user")).thenReturn(Optional.empty());
            when(workerRepository.findByWorkerEmailIgnoreCase("new@test.com")).thenReturn(Optional.empty());
            when(workerRepository.save(existing)).thenReturn(existing);

            // When
            Worker result = service.updateWorker(WORKER_ID, request);

            // Then
            assertThat(result).isSameAs(existing);
            assertThat(existing.getWorkerUser()).isEqualTo("new.user");
            assertThat(existing.getWorkerEmail()).isEqualTo("new@test.com");
            assertThat(existing.getWorkerDisplayName()).isEqualTo("New Display");
            assertThat(existing.getRoleTitle()).isEqualTo("Inspector");
            assertThat(existing.isAdmin()).isTrue();
        }

        @Test
        void updateProfile_ShouldNotChangeUsernameOrAdminRole() {
            // Given
            Worker existing = aWorker().build();
            Worker request = aWorker().withUsername("ignored").withEmail("PROFILE@TEST.COM").asAdmin().build();
            when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.of(existing));
            when(workerRepository.findByWorkerEmailIgnoreCase("profile@test.com")).thenReturn(Optional.empty());
            when(workerRepository.save(existing)).thenReturn(existing);

            // When
            Worker result = service.updateProfile(WORKER_ID, request);

            // Then
            assertThat(result).isSameAs(existing);
            assertThat(existing.getWorkerUser()).isEqualTo(USERNAME);
            assertThat(existing.getWorkerEmail()).isEqualTo("profile@test.com");
            assertThat(existing.isAdmin()).isFalse();
        }

        @Test
        void updateMethods_ShouldRejectUnknownWorkerAndFinalAdminDemotion() {
            // Given
            when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> service.updateWorker(WORKER_ID, aWorker().build()))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Worker not found");
            assertThatThrownBy(() -> service.updateProfile(WORKER_ID, aWorker().build()))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Worker not found");

            // Given
            Worker admin = aWorker().asAdmin().build();
            Worker demotion = aWorker().build();
            when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.of(admin));
            when(workerRepository.findByWorkerUserIgnoreCase(USERNAME)).thenReturn(Optional.of(admin));
            when(workerRepository.findByWorkerEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(admin));
            when(workerRepository.countByIsAdminTrueAndArchivedFalse()).thenReturn(1L);

            // When / Then
            assertThatThrownBy(() -> service.updateWorker(WORKER_ID, demotion))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("The final active administrator cannot be demoted");
        }
    }

    @Nested
    class LoginAndPassword {

        @Test
        void recordLogin_ShouldTimestampAndPersistActiveWorker() {
            // Given
            Worker worker = aWorker().build();
            when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(USERNAME)).thenReturn(Optional.of(worker));
            when(workerRepository.save(worker)).thenReturn(worker);

            // When
            Worker result = service.recordLogin(USERNAME);

            // Then
            assertThat(result).isSameAs(worker);
            assertThat(worker.getLastLoginAt()).isNotNull();
            verify(workerRepository).save(worker);
        }

        @Test
        void recordLogin_ShouldRejectUnknownWorker() {
            // Given
            when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(USERNAME)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> service.recordLogin(USERNAME))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Worker not found");
        }

        @Test
        void resetPassword_ShouldEncodeAndPersistValidPassword() {
            // Given
            Worker worker = aWorker().build();
            when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.of(worker));
            when(passwordEncoder.encode(NEW_PASSWORD)).thenReturn(ENCODED_PASSWORD);

            // When
            service.resetPassword(WORKER_ID, NEW_PASSWORD);

            // Then
            assertThat(worker.getWorkerPW()).isEqualTo(ENCODED_PASSWORD);
            verify(workerRepository).save(worker);
        }

        @ParameterizedTest
        @NullAndEmptySource
        void resetPassword_ShouldRejectMissingPassword(String password) {
            // When / Then
            assertThatThrownBy(() -> service.resetPassword(WORKER_ID, password))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Password is required");
        }

        @Test
        void resetPassword_ShouldRejectShortPasswordAndUnknownWorker() {
            // When / Then
            assertThatThrownBy(() -> service.resetPassword(WORKER_ID, "short"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Password must contain at least 8 characters");

            // Given
            when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> service.resetPassword(WORKER_ID, NEW_PASSWORD))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Worker not found");
        }
    }

    @Nested
    class ArchiveRestoreAndDelete {

        @Test
        void archiveAndRestore_ShouldManageArchiveMetadata_WhenWorkerHasNoOpenAssignments() {
            // Given
            Worker worker = aWorker().build();
            assign(worker, WorkOrderStatus.COMPLETE);
            when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.of(worker));
            when(workerRepository.save(worker)).thenReturn(worker);

            // When
            service.archiveById(WORKER_ID);

            // Then
            assertThat(worker.isArchived()).isTrue();
            assertThat(worker.getArchivedAt()).isNotNull();

            // When
            Worker restored = service.restoreById(WORKER_ID);

            // Then
            assertThat(restored).isSameAs(worker);
            assertThat(worker.isArchived()).isFalse();
            assertThat(worker.getArchivedAt()).isNull();
        }

        @Test
        void archiveById_ShouldRejectUnknownWorkerOpenAssignmentAndFinalAdmin() {
            // Given
            when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> service.archiveById(WORKER_ID))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Worker not found");

            // Given
            Worker assigned = aWorker().build();
            assign(assigned, WorkOrderStatus.ACTIVE);
            when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.of(assigned));

            // When / Then
            assertThatThrownBy(() -> service.archiveById(WORKER_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Worker cannot be archived while assigned to open work orders");

            // Given
            Worker admin = aWorker().asAdmin().build();
            when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.of(admin));
            when(workerRepository.countByIsAdminTrueAndArchivedFalse()).thenReturn(1L);

            // When / Then
            assertThatThrownBy(() -> service.archiveById(WORKER_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("The final active administrator cannot be archived");
        }

        @Test
        void restoreById_ShouldRejectUnknownWorker() {
            // Given
            when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> service.restoreById(WORKER_ID))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Worker not found");
        }

        @Test
        void deletePermanentlyById_ShouldDeleteOnlyActiveUnassignedWorker() {
            // Given
            Worker worker = aWorker().build();
            when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.of(worker));

            // When
            service.deletePermanentlyById(WORKER_ID);

            // Then
            verify(workerRepository).delete(worker);
        }

        @Test
        void deletePermanentlyById_ShouldRejectUnknownArchivedAssignedOrFinalAdmin() {
            // Given / When / Then
            when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.deletePermanentlyById(WORKER_ID))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Worker not found");

            // Given / When / Then
            Worker archived = aWorker().archived().build();
            when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.of(archived));
            assertThatThrownBy(() -> service.deletePermanentlyById(WORKER_ID))
                    .isInstanceOf(IllegalStateException.class).hasMessage("Archived workers can only be restored");

            // Given / When / Then
            Worker assigned = aWorker().build();
            assign(assigned, WorkOrderStatus.OPEN);
            when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.of(assigned));
            assertThatThrownBy(() -> service.deletePermanentlyById(WORKER_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Worker cannot be permanently deleted while work orders are attached");

            // Given / When / Then
            Worker admin = aWorker().asAdmin().build();
            when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.of(admin));
            when(workerRepository.countByIsAdminTrueAndArchivedFalse()).thenReturn(1L);
            assertThatThrownBy(() -> service.deletePermanentlyById(WORKER_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("The final active administrator cannot be deleted");
        }
    }

    static Stream<Arguments> invalidWorkerProfiles() {
        return Stream.of(
                Arguments.of("missing first name", (Consumer<Worker>) worker -> worker.setWorkerFName(" "), "First name is required"),
                Arguments.of("missing last name", (Consumer<Worker>) worker -> worker.setWorkerLName(null), "Last name is required"),
                Arguments.of("missing username", (Consumer<Worker>) worker -> worker.setWorkerUser(" "), "Username is required"),
                Arguments.of("missing email", (Consumer<Worker>) worker -> worker.setWorkerEmail(null), "Email is required"),
                Arguments.of("missing password", (Consumer<Worker>) worker -> worker.setWorkerPW(" "), "Password is required"),
                Arguments.of("short password", (Consumer<Worker>) worker -> worker.setWorkerPW("short"), "Password must contain at least 8 characters"));
    }

    private static void assign(Worker worker, WorkOrderStatus status) {
        WorkOrder order = aWorkOrder().withStatus(status).build();
        order.addWorker(worker);
    }
}
