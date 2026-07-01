package com.atelicove.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import com.atelicove.config.WorkerUserDetailsService;
import com.atelicove.entities.Worker;
import com.atelicove.repositories.WorkerRepository;

@ExtendWith(MockitoExtension.class)
class WorkerUserDetailsServiceTest {

    @Mock
    private WorkerRepository workerRepository;

    @Test
    void loadUserByUsernameCreatesAdminUserDetails() {
        Worker worker = new Worker("Pat", "Lee", "PatLee", "PatLee@test.com", "encoded-password", true);
        when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse("patlee"))
                .thenReturn(Optional.of(worker));
        WorkerUserDetailsService service = new WorkerUserDetailsService(workerRepository);

        UserDetails details = service.loadUserByUsername("patlee");

        assertThat(details.getUsername()).isEqualTo("PatLee");
        assertThat(details.getPassword()).isEqualTo("encoded-password");
        assertThat(details.getAuthorities())
                .extracting("authority")
                .containsExactly("ROLE_ADMIN");
        verify(workerRepository).findByWorkerUserIgnoreCaseAndArchivedFalse("patlee");
    }

    @Test
    void loadUserByUsernameCreatesWorkerUserDetails() {
        Worker worker = new Worker("Sam", "Hill", "shill", "shill@test.com", "encoded-password", false);
        when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse("shill"))
                .thenReturn(Optional.of(worker));
        WorkerUserDetailsService service = new WorkerUserDetailsService(workerRepository);

        UserDetails details = service.loadUserByUsername("shill");

        assertThat(details.getAuthorities())
                .extracting("authority")
                .containsExactly("ROLE_WORKER");
    }

    @Test
    void loadUserByUsernameRejectsUnknownWorker() {
        when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse("missing"))
                .thenReturn(Optional.empty());
        WorkerUserDetailsService service = new WorkerUserDetailsService(workerRepository);

        assertThatThrownBy(() -> service.loadUserByUsername("missing"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessage("Worker not found");
    }
}
