package com.atelicove.repositories;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.atelicove.entities.Worker;
import com.atelicove.repositories.WorkerRepository;

@DataJpaTest
class WorkerRepositoryTest {

    @Autowired
    private WorkerRepository workerRepository;

    @Test
    void findByWorkerUserIgnoreCaseFindsUsernameRegardlessOfCase() {
        Worker worker = new Worker("Pat", "Lee", "PatLee", "PatLee@test.com", "encoded-password", false);
        workerRepository.saveAndFlush(worker);

        assertThat(workerRepository.findByWorkerUserIgnoreCase("patlee"))
                .containsSame(worker);
        assertThat(workerRepository.findByWorkerUserIgnoreCase("PATLEE"))
                .containsSame(worker);
        assertThat(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse("patlee"))
                .containsSame(worker);
        assertThat(workerRepository.findByWorkerEmailIgnoreCase("patlee@test.com"))
                .containsSame(worker);
    }

    @Test
    void findByWorkerUserIgnoreCaseReturnsEmptyForUnknownUsername() {
        assertThat(workerRepository.findByWorkerUserIgnoreCase("missing")).isEmpty();
    }

    @Test
    void saveAndDeleteWorker() {
        Worker saved = workerRepository.saveAndFlush(
                new Worker("Sam", "Taylor", "staylor", "staylor@test.com", "encoded-password", true));

        assertThat(saved.getWorkerID()).isPositive();

        workerRepository.deleteById(saved.getWorkerID());
        workerRepository.flush();

        assertThat(workerRepository.findById(saved.getWorkerID())).isEmpty();
    }

    @Test
    void archiveQueriesSeparateActiveAndArchivedWorkers() {
        Worker active = new Worker("Active", "Worker", "active", "active@test.com", "encoded-password", false);
        Worker archived = new Worker("Archived", "Worker", "archived", "archived@test.com", "encoded-password", false);
        archived.setArchived(true);
        workerRepository.saveAllAndFlush(java.util.List.of(active, archived));

        assertThat(workerRepository.findByArchivedFalse()).contains(active).doesNotContain(archived);
        assertThat(workerRepository.findByArchivedTrue()).contains(archived).doesNotContain(active);
    }
}
