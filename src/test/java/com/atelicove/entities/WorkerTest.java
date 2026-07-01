package com.atelicove.entities;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Set;

import org.junit.jupiter.api.Test;

import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.Worker;

class WorkerTest {

    @Test
    void constructorSetsWorkerDetails() {
        Worker worker = new Worker("Pat", "Lee", "plee", "plee@test.com", "secret", true);

        assertAll(
                () -> assertEquals("Pat", worker.getWorkerFName()),
                () -> assertEquals("Lee", worker.getWorkerLName()),
                () -> assertEquals("plee", worker.getWorkerUser()),
                () -> assertEquals("plee@test.com", worker.getWorkerEmail()),
                () -> assertEquals("secret", worker.getWorkerPW()),
                () -> assertTrue(worker.isAdmin()),
                () -> assertTrue(worker.getWorkOrders().isEmpty()));
    }

    @Test
    void settersUpdateWorkerDetails() {
        Worker worker = new Worker();

        worker.setWorkerID(7);
        worker.setWorkerFName("Sam");
        worker.setWorkerLName("Taylor");
        worker.setWorkerUser("staylor");
        worker.setWorkerEmail("staylor@test.com");
        worker.setWorkerPW("new-secret");
        worker.setAdmin(false);

        assertAll(
                () -> assertEquals(7, worker.getWorkerID()),
                () -> assertEquals("Sam", worker.getWorkerFName()),
                () -> assertEquals("Taylor", worker.getWorkerLName()),
                () -> assertEquals("staylor", worker.getWorkerUser()),
                () -> assertEquals("staylor@test.com", worker.getWorkerEmail()),
                () -> assertEquals("new-secret", worker.getWorkerPW()),
                () -> assertFalse(worker.isAdmin()));
    }

    @Test
    void setWorkOrdersKeepsBothSidesOfRelationshipInSync() {
        Worker worker = new Worker();
        WorkOrder first = new WorkOrder();
        WorkOrder second = new WorkOrder();

        worker.setWorkOrders(Set.of(first, second));

        assertAll(
                () -> assertEquals(Set.of(first, second), worker.getWorkOrders()),
                () -> assertTrue(first.getWorkers().contains(worker)),
                () -> assertTrue(second.getWorkers().contains(worker)));

        worker.setWorkOrders(Set.of(second));

        assertAll(
                () -> assertFalse(first.getWorkers().contains(worker)),
                () -> assertTrue(second.getWorkers().contains(worker)),
                () -> assertEquals(Set.of(second), worker.getWorkOrders()));
    }
}
