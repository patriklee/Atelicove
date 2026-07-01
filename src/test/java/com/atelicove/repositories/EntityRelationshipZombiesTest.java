package com.atelicove.repositories;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.atelicove.entities.Company;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.WorkOrderDocument;
import com.atelicove.entities.WorkOrderItem;
import com.atelicove.entities.Worker;
import com.atelicove.enums.DocumentType;
import com.atelicove.repositories.CompanyRepository;
import com.atelicove.repositories.WODocumentRepository;
import com.atelicove.repositories.WOItemRepository;
import com.atelicove.repositories.WorkOrderRepository;
import com.atelicove.repositories.WorkerRepository;

import jakarta.persistence.EntityManager;
/**
 * Database-backed entity relationship tests organized with the ZOMBIES
 * heuristic: Zero, One, Many, Boundaries, Interfaces, Exceptions, and Simple.
 *
 * Each persistence test flushes and clears the persistence context before
 * reloading data, proving that relationships were stored in database tables
 * rather than merely updated in Java memory.
 */
@DataJpaTest
class EntityRelationshipZombiesTest {

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private WorkOrderRepository workOrderRepository;

    @Autowired
    private WOItemRepository itemRepository;

    @Autowired
    private WODocumentRepository documentRepository;

    @Autowired
    private EntityManager entityManager;

    @Nested
    class Zero {

        @Test
        void workOrderPersistsWithoutOptionalCompanyOrWorkers() {
            WorkOrder workOrder = workOrderRepository.saveAndFlush(new WorkOrder());
            int workOrderId = workOrder.getWorkOrderID();
            clearPersistenceContext();

            WorkOrder reloaded = workOrderRepository.findById(workOrderId).orElseThrow();

            assertThat(reloaded.getCompany()).isNull();
            assertThat(reloaded.getWorkers()).isEmpty();
            assertThat(reloaded.getItems()).isEmpty();
        }

        @Test
        void companyWithZeroWorkOrdersRemainsPersisted() {
            Company company = companyRepository.saveAndFlush(company("Solo Company"));
            int companyId = company.getCompanyID();
            clearPersistenceContext();

            assertThat(companyRepository.findById(companyId)).isPresent();
            assertThat(workOrderRepository.findByCompany_CompanyIDAndArchivedFalse(companyId)).isEmpty();
        }
    }

    @Nested
    class One {

        @Test
        void oneWorkOrderReferencesOneCompany() {
            Company company = companyRepository.saveAndFlush(company("Acme"));
            WorkOrder workOrder = new WorkOrder();
            workOrder.setCompany(company);
            workOrder = workOrderRepository.saveAndFlush(workOrder);
            int workOrderId = workOrder.getWorkOrderID();
            int companyId = company.getCompanyID();
            clearPersistenceContext();

            WorkOrder reloaded = workOrderRepository.findById(workOrderId).orElseThrow();

            assertThat(reloaded.getCompany().getCompanyID()).isEqualTo(companyId);
            assertThat(workOrderRepository.findByCompany_CompanyIDAndArchivedFalse(companyId))
                    .extracting(WorkOrder::getWorkOrderID)
                    .containsExactly(workOrderId);
        }

        @Test
        void oneWorkerAssignmentPersistsThroughJoinTable() {
            Worker worker = workerRepository.saveAndFlush(worker("worker-one"));
            WorkOrder workOrder = new WorkOrder();
            workOrder.addWorker(worker);
            workOrder = workOrderRepository.saveAndFlush(workOrder);
            int workOrderId = workOrder.getWorkOrderID();
            int workerId = worker.getWorkerID();
            clearPersistenceContext();

            WorkOrder reloadedOrder =
                    workOrderRepository.findById(workOrderId).orElseThrow();
            Worker reloadedWorker = workerRepository.findById(workerId).orElseThrow();

            assertThat(reloadedOrder.getWorkers())
                    .extracting(Worker::getWorkerID)
                    .containsExactly(workerId);
            assertThat(reloadedWorker.getWorkOrders())
                    .extracting(WorkOrder::getWorkOrderID)
                    .containsExactly(workOrderId);
        }

        @Test
        void oneItemPersistsWithItsRequiredWorkOrder() {
            WorkOrder workOrder = workOrderRepository.saveAndFlush(new WorkOrder());
            WorkOrderItem item = itemRepository.saveAndFlush(
                    new WorkOrderItem("Labor", 1, 85.00, workOrder));
            int itemId = item.getWorkOrderItemID();
            int workOrderId = workOrder.getWorkOrderID();
            clearPersistenceContext();

            WorkOrderItem reloaded = itemRepository.findById(itemId).orElseThrow();

            assertThat(reloaded.getWorkOrder().getWorkOrderID()).isEqualTo(workOrderId);
        }
    }

    @Nested
    class Many {

        @Test
        void companyCanHaveManyWorkOrders() {
            Company company = companyRepository.saveAndFlush(company("Busy Company"));
            WorkOrder first = new WorkOrder();
            WorkOrder second = new WorkOrder();
            WorkOrder third = new WorkOrder();
            first.setCompany(company);
            second.setCompany(company);
            third.setCompany(company);
            workOrderRepository.saveAllAndFlush(java.util.List.of(first, second, third));
            int companyId = company.getCompanyID();
            clearPersistenceContext();

            assertThat(workOrderRepository.findByCompany_CompanyIDAndArchivedFalse(companyId))
                    .hasSize(3);
        }

        @Test
        void manyWorkersAndItemsPersistForOneWorkOrder() {
            Worker firstWorker = workerRepository.saveAndFlush(worker("first-worker"));
            Worker secondWorker = workerRepository.saveAndFlush(worker("second-worker"));
            WorkOrder workOrder = new WorkOrder();
            workOrder.addWorker(firstWorker);
            workOrder.addWorker(secondWorker);
            workOrder.addItem(new WorkOrderItem("Labor", 2, 75.00, workOrder));
            workOrder.addItem(new WorkOrderItem("Parts", 3, 20.00, workOrder));
            workOrder.addItem(new WorkOrderItem("Travel", 1, 35.00, workOrder));
            workOrder = workOrderRepository.saveAndFlush(workOrder);
            int workOrderId = workOrder.getWorkOrderID();
            clearPersistenceContext();

            WorkOrder reloaded = workOrderRepository.findById(workOrderId).orElseThrow();

            assertThat(reloaded.getWorkers()).hasSize(2);
            assertThat(reloaded.getItems())
                    .extracting(WorkOrderItem::getItemName)
                    .containsExactlyInAnyOrder("Labor", "Parts", "Travel");
        }
    }

    @Nested
    class Boundaries {

        @Test
        void removingItemDeletesOrphanDatabaseRow() {
            WorkOrder workOrder = new WorkOrder();
            WorkOrderItem item = new WorkOrderItem("Temporary item", 1, 10.00, workOrder);
            workOrder.addItem(item);
            workOrder = workOrderRepository.saveAndFlush(workOrder);
            int workOrderId = workOrder.getWorkOrderID();
            int itemId = workOrder.getItems().get(0).getWorkOrderItemID();

            workOrder.removeItem(item);
            workOrderRepository.saveAndFlush(workOrder);
            clearPersistenceContext();

            assertThat(itemRepository.findById(itemId)).isEmpty();
            assertThat(workOrderRepository.findById(workOrderId).orElseThrow().getItems())
                    .isEmpty();
        }

        @Test
        void deletingWorkOrderCascadesToItsItems() {
            WorkOrder workOrder = new WorkOrder();
            workOrder.addItem(new WorkOrderItem("Cascaded item", 1, 10.00, workOrder));
            workOrder = workOrderRepository.saveAndFlush(workOrder);
            int itemId = workOrder.getItems().get(0).getWorkOrderItemID();

            workOrderRepository.delete(workOrder);
            workOrderRepository.flush();
            clearPersistenceContext();

            assertThat(itemRepository.findById(itemId)).isEmpty();
        }
    }

    @Nested
    class Interfaces {

        @Test
        void removingWorkerDeletesJoinRowWithoutDeletingEitherEntity() {
            Worker worker = workerRepository.saveAndFlush(worker("assigned-worker"));
            WorkOrder workOrder = new WorkOrder();
            workOrder.addWorker(worker);
            workOrder = workOrderRepository.saveAndFlush(workOrder);
            int workOrderId = workOrder.getWorkOrderID();
            int workerId = worker.getWorkerID();

            workOrder.removeWorker(worker);
            workOrderRepository.saveAndFlush(workOrder);
            clearPersistenceContext();

            assertThat(workOrderRepository.findById(workOrderId)).isPresent();
            assertThat(workerRepository.findById(workerId)).isPresent();
            assertThat(workOrderRepository.findById(workOrderId).orElseThrow().getWorkers())
                    .isEmpty();
            assertThat(workerRepository.findById(workerId).orElseThrow().getWorkOrders())
                    .isEmpty();
        }

        @Test
        void documentReferencesWorkOrderAndUploadingWorkerAfterReload() {
            WorkOrder workOrder = workOrderRepository.saveAndFlush(new WorkOrder());
            Worker worker = workerRepository.saveAndFlush(worker("uploader"));
            WorkOrderDocument document = new WorkOrderDocument(
                    workOrder,
                    "receipt.pdf",
                    DocumentType.RECEIPT,
                    new byte[] { 1, 2, 3 },
                    worker,
                    "application/pdf",
                    3);
            document = documentRepository.saveAndFlush(document);
            int documentId = document.getDocumentID();
            int workOrderId = workOrder.getWorkOrderID();
            int workerId = worker.getWorkerID();
            clearPersistenceContext();

            WorkOrderDocument reloaded =
                    documentRepository.findById(documentId).orElseThrow();

            assertThat(reloaded.getWorkOrder().getWorkOrderID()).isEqualTo(workOrderId);
            assertThat(reloaded.getUploadedByWorker().getWorkerID()).isEqualTo(workerId);
        }
    }

    @Nested
    class Exceptions {

        @Test
        void itemWithoutRequiredWorkOrderCannotBePersisted() {
            WorkOrderItem item = new WorkOrderItem();
            item.setItemName("Invalid item");
            item.setQuantity(1);
            item.setPrice(10.00);

            assertThatThrownBy(() -> itemRepository.saveAndFlush(item))
                    .isInstanceOf(RuntimeException.class);
        }

        @Test
        void duplicateWorkerUsernameViolatesUniqueConstraint() {
            workerRepository.saveAndFlush(worker("duplicate-user"));

            assertThatThrownBy(() ->
                    workerRepository.saveAndFlush(worker("duplicate-user")))
                    .isInstanceOf(RuntimeException.class);
        }
    }

    @Nested
    class Simple {

        @Test
        void fullRelationshipGraphSurvivesDatabaseReload() {
            Company company = companyRepository.saveAndFlush(company("Complete Graph Co"));
            Worker worker = workerRepository.saveAndFlush(worker("graph-worker"));

            WorkOrder workOrder = new WorkOrder();
            workOrder.setCompany(company);
            workOrder.addWorker(worker);
            workOrder.addItem(new WorkOrderItem("Service", 2, 50.00, workOrder));
            workOrder = workOrderRepository.saveAndFlush(workOrder);

            WorkOrderDocument document = new WorkOrderDocument(
                    workOrder,
                    "work-order.txt",
                    DocumentType.WORK_ORDER,
                    new byte[] { 4, 5 },
                    worker,
                    "text/plain",
                    2);
            documentRepository.saveAndFlush(document);

            int workOrderId = workOrder.getWorkOrderID();
            int documentId = document.getDocumentID();
            clearPersistenceContext();

            WorkOrder reloadedOrder =
                    workOrderRepository.findById(workOrderId).orElseThrow();
            WorkOrderDocument reloadedDocument =
                    documentRepository.findById(documentId).orElseThrow();

            assertThat(reloadedOrder.getCompany().getCompanyName())
                    .isEqualTo("Complete Graph Co");
            assertThat(reloadedOrder.getWorkers())
                    .extracting(Worker::getWorkerUser)
                    .containsExactly("graph-worker");
            assertThat(reloadedOrder.getItems())
                    .extracting(WorkOrderItem::getItemName)
                    .containsExactly("Service");
            assertThat(reloadedDocument.getWorkOrder().getWorkOrderID())
                    .isEqualTo(workOrderId);
            assertThat(reloadedDocument.getUploadedByWorker().getWorkerUser())
                    .isEqualTo("graph-worker");
        }
    }

    private Company company(String name) {
        return new Company(
                name,
                "100 Main Street",
                "555-0100",
                name.toLowerCase().replace(" ", "") + "@test.com");
    }

    private Worker worker(String username) {
        return new Worker(
                "Test",
                "Worker",
                username,
                username + "@test.com",
                "encoded-password",
                false);
    }

    private void clearPersistenceContext() {
        entityManager.flush();
        entityManager.clear();
    }
}
