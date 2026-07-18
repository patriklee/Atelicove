package com.atelicove.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.atelicove.entities.Worker;
import com.atelicove.repositories.ProjectRepository;
import com.atelicove.repositories.WorkOrderRepository;
import com.atelicove.repositories.WorkerRepository;

@ExtendWith(MockitoExtension.class)
class WorkerApiBoundaryTest {

    private static final String USERNAME = "pat.lee";
    private static final String RAW_PASSWORD = "password123";
    private static final String ENCODED_PASSWORD = "$2a$10$encoded";

    @Mock private WorkerRepository workerRepository;
    @Mock private WorkOrderRepository workOrderRepository;
    @Mock private ProjectRepository projectRepository;
    @Mock private PasswordEncoder passwordEncoder;

    private WorkerService workerService;
    private AuthorizationService authorizationService;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        workerService = new WorkerService(workerRepository, passwordEncoder);
        authorizationService = new AuthorizationService(
                workerRepository, workOrderRepository, projectRepository);
        authentication = new TestingAuthenticationToken(USERNAME, "n/a", "ROLE_WORKER");
    }

    @Test
    void createAndResetPasswordStoreOnlyEncodedValues() {
        Worker worker = new Worker("Pat", "Lee", USERNAME, "pat@example.com", RAW_PASSWORD, false);
        worker.setWorkerID(7);
        when(workerRepository.findByWorkerUserIgnoreCase(USERNAME)).thenReturn(Optional.empty());
        when(workerRepository.findByWorkerEmailIgnoreCase("pat@example.com")).thenReturn(Optional.empty());
        when(workerRepository.findById(7)).thenReturn(Optional.of(worker));
        when(passwordEncoder.encode(RAW_PASSWORD)).thenReturn(ENCODED_PASSWORD);
        when(passwordEncoder.encode("replacement-password")).thenReturn("$2a$10$replacement");
        when(workerRepository.save(worker)).thenReturn(worker);

        workerService.createWorker(worker);
        assertThat(worker.getWorkerPW()).isEqualTo(ENCODED_PASSWORD);

        workerService.resetPassword(7, "replacement-password");
        assertThat(worker.getWorkerPW()).isEqualTo("$2a$10$replacement");
        verify(passwordEncoder).encode(RAW_PASSWORD);
        verify(passwordEncoder).encode("replacement-password");
    }

    @Test
    void profileAuthorizationAllowsOwnerAndAdminButRejectsAnotherWorker() {
        Worker owner = new Worker("Pat", "Lee", USERNAME, "pat@example.com", "encoded", false);
        owner.setWorkerID(7);
        when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(USERNAME))
                .thenReturn(Optional.of(owner));

        assertThat(authorizationService.requireOwnWorkerOrAdmin(7, authentication)).isSameAs(owner);
        assertThatThrownBy(() -> authorizationService.requireOwnWorkerOrAdmin(8, authentication))
                .isInstanceOf(AccessDeniedException.class);

        Worker admin = new Worker("Admin", "User", USERNAME, "admin@example.com", "encoded", true);
        admin.setWorkerID(1);
        when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(USERNAME))
                .thenReturn(Optional.of(admin));

        assertThat(authorizationService.requireOwnWorkerOrAdmin(8, authentication)).isSameAs(admin);
        assertThat(authorizationService.requireOwnUsernameOrAdmin("another.worker", authentication))
                .isSameAs(admin);
    }
}
