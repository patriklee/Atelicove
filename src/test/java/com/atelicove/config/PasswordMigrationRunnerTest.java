package com.atelicove.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.atelicove.config.PasswordMigrationRunner;
import com.atelicove.entities.Worker;
import com.atelicove.repositories.WorkerRepository;

@ExtendWith(MockitoExtension.class)
class PasswordMigrationRunnerTest {

    @Mock
    private WorkerRepository workerRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Test
    void runEncodesAndSavesPlainTextPasswords() {
        Worker worker = new Worker("Pat", "Lee", "plee", "plee@test.com", "plain-password", false);
        when(workerRepository.findAll()).thenReturn(List.of(worker));
        when(passwordEncoder.encode("plain-password")).thenReturn("$2a$encoded");
        PasswordMigrationRunner runner =
                new PasswordMigrationRunner(workerRepository, passwordEncoder);

        runner.run();

        assertThat(worker.getWorkerPW()).isEqualTo("$2a$encoded");
        verify(passwordEncoder).encode("plain-password");
        verify(workerRepository).save(worker);
    }

    @Test
    void runDoesNotReencodeBcryptPasswords() {
        Worker workerA = new Worker("A", "Worker", "workerA", "workerA@test.com", "$2a$existing", false);
        Worker workerB = new Worker("B", "Worker", "workerB", "workerB@test.com", "$2b$existing", false);
        Worker workerY = new Worker("Y", "Worker", "workerY", "workerY@test.com", "$2y$existing", false);
        when(workerRepository.findAll()).thenReturn(List.of(workerA, workerB, workerY));
        PasswordMigrationRunner runner =
                new PasswordMigrationRunner(workerRepository, passwordEncoder);

        runner.run();

        verify(passwordEncoder, never()).encode(org.mockito.ArgumentMatchers.anyString());
        verify(workerRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void runSkipsNullPasswords() {
        Worker worker = new Worker();
        when(workerRepository.findAll()).thenReturn(List.of(worker));
        PasswordMigrationRunner runner =
                new PasswordMigrationRunner(workerRepository, passwordEncoder);

        runner.run();

        verify(passwordEncoder, never()).encode(org.mockito.ArgumentMatchers.anyString());
        verify(workerRepository, never()).save(worker);
    }
}
