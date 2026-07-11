package com.atelicove.repositories;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.atelicove.entities.Project;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.RollbackException;

@DataJpaTest
class OptimisticLockingTest {

    @Autowired private ProjectRepository projectRepository;
    @Autowired private EntityManagerFactory entityManagerFactory;

    @Test
    void staleProjectUpdateRaisesOptimisticLockConflict() {
        Project project = new Project();
        project.setProjectName("Original");
        project = projectRepository.saveAndFlush(project);

        EntityManager first = entityManagerFactory.createEntityManager();
        EntityManager stale = entityManagerFactory.createEntityManager();
        try {
            first.getTransaction().begin();
            stale.getTransaction().begin();
            Project firstCopy = first.find(Project.class, project.getProjectID());
            Project staleCopy = stale.find(Project.class, project.getProjectID());

            firstCopy.setDescription("First update");
            first.getTransaction().commit();

            staleCopy.setDescription("Stale update");
            assertThatThrownBy(() -> stale.getTransaction().commit())
                    .isInstanceOf(RollbackException.class)
                    .hasRootCauseInstanceOf(org.hibernate.StaleObjectStateException.class);
        } finally {
            if (first.getTransaction().isActive()) first.getTransaction().rollback();
            if (stale.getTransaction().isActive()) stale.getTransaction().rollback();
            first.close();
            stale.close();
        }
    }
}
