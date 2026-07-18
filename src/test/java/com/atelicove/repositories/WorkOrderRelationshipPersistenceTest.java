package com.atelicove.repositories;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.atelicove.entities.Company;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.WorkOrderItem;
import com.atelicove.entities.Worker;
import com.atelicove.enums.ItemType;

import jakarta.persistence.EntityManager;

@DataJpaTest
class WorkOrderRelationshipPersistenceTest {

    @Autowired CompanyRepository companyRepository;
    @Autowired WorkerRepository workerRepository;
    @Autowired WorkOrderRepository workOrderRepository;
    @Autowired WOItemRepository itemRepository;
    @Autowired EntityManager entityManager;

    @Test
    void workerAssignmentPersistsOnBothSides() {
        Worker worker = workerRepository.saveAndFlush(worker("assigned"));
        WorkOrder order = new WorkOrder();
        order.addWorker(worker);
        order = workOrderRepository.saveAndFlush(order);
        int orderId = order.getWorkOrderID();
        int workerId = worker.getWorkerID();
        clear();

        assertThat(workOrderRepository.findById(orderId).orElseThrow().getWorkers())
                .extracting(Worker::getWorkerID).containsExactly(workerId);
        assertThat(workerRepository.findById(workerId).orElseThrow().getWorkOrders())
                .extracting(WorkOrder::getWorkOrderID).containsExactly(orderId);
    }

    @Test
    void duplicateWorkerAssignmentIsPrevented() {
        Worker worker = workerRepository.saveAndFlush(worker("deduplicated"));
        WorkOrder order = new WorkOrder();
        order.addWorker(worker);
        order.addWorker(worker);
        order = workOrderRepository.saveAndFlush(order);
        int orderId = order.getWorkOrderID();
        clear();

        assertThat(workOrderRepository.findById(orderId).orElseThrow().getWorkers())
                .extracting(Worker::getWorkerID).containsExactly(worker.getWorkerID());
    }

    @Test
    void companyAssignmentPersists() {
        Company company = companyRepository.saveAndFlush(
                new Company("Acme", "1 Main", "555-0100", "office@acme.test"));
        WorkOrder order = new WorkOrder();
        order.setCompany(company);
        order = workOrderRepository.saveAndFlush(order);
        int orderId = order.getWorkOrderID();
        int companyId = company.getCompanyID();
        clear();

        assertThat(workOrderRepository.findById(orderId).orElseThrow().getCompany().getCompanyID())
                .isEqualTo(companyId);
    }

    @Test
    void removingItemDeletesTheOrphan() {
        WorkOrder order = new WorkOrder();
        WorkOrderItem item = new WorkOrderItem(
                "Labor", 1, new BigDecimal("50.00"), ItemType.LABOR, order);
        order.addItem(item);
        order = workOrderRepository.saveAndFlush(order);
        int orderId = order.getWorkOrderID();
        int itemId = order.getItems().get(0).getWorkOrderItemID();

        order.removeItem(item);
        workOrderRepository.saveAndFlush(order);
        clear();

        assertThat(itemRepository.findById(itemId)).isEmpty();
        assertThat(workOrderRepository.findById(orderId).orElseThrow().getItems()).isEmpty();
    }

    private Worker worker(String username) {
        return new Worker("Test", "Worker", username, username + "@test.com", "encoded", false);
    }

    private void clear() {
        entityManager.flush();
        entityManager.clear();
    }
}
