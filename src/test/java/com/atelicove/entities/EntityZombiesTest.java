package com.atelicove.entities;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.atelicove.entities.Company;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.WorkOrderDocument;
import com.atelicove.entities.WorkOrderItem;
import com.atelicove.entities.Worker;

/**
 * Entity tests organized with the ZOMBIES testing heuristic:
 * Zero, One, Many, Boundaries, Interfaces, Exceptions, and Simple scenarios.
 */
class EntityZombiesTest {

    @Nested
    class Zero {

        @Test
        void newWorkOrderStartsWithZeroWorkersAndItems() {
            WorkOrder workOrder = new WorkOrder();

            assertTrue(workOrder.getWorkers().isEmpty());
            assertTrue(workOrder.getItems().isEmpty());
        }

        @Test
        void entityIdsDefaultToZeroBeforePersistence() {
            assertEquals(0, new Company().getCompanyID());
            assertEquals(0, new Worker().getWorkerID());
            assertEquals(0, new WorkOrder().getWorkOrderID());
            assertEquals(0, new WorkOrderItem().getWorkOrderItemID());
            assertEquals(0, new WorkOrderDocument().getDocumentID());
        }
    }

    @Nested
    class One {

        @Test
        void workOrderCanContainOneWorker() {
            WorkOrder workOrder = new WorkOrder();
            Worker worker = new Worker();

            workOrder.addWorker(worker);

            assertEquals(1, workOrder.getWorkers().size());
            assertTrue(workOrder.getWorkers().contains(worker));
            assertTrue(worker.getWorkOrders().contains(workOrder));
        }

        @Test
        void workOrderCanContainOneItem() {
            WorkOrder workOrder = new WorkOrder();
            WorkOrderItem item = new WorkOrderItem();

            workOrder.addItem(item);

            assertEquals(1, workOrder.getItems().size());
            assertSame(workOrder, item.getWorkOrder());
        }
    }

    @Nested
    class Many {

        @Test
        void workOrderCanContainManyWorkersAndItems() {
            WorkOrder workOrder = new WorkOrder();
            Worker firstWorker = new Worker();
            Worker secondWorker = new Worker();
            WorkOrderItem firstItem = new WorkOrderItem();
            WorkOrderItem secondItem = new WorkOrderItem();
            WorkOrderItem thirdItem = new WorkOrderItem();

            workOrder.setWorkers(Set.of(firstWorker, secondWorker));
            workOrder.setItems(List.of(firstItem, secondItem, thirdItem));

            assertEquals(2, workOrder.getWorkers().size());
            assertEquals(3, workOrder.getItems().size());
            assertTrue(firstWorker.getWorkOrders().contains(workOrder));
            assertTrue(secondWorker.getWorkOrders().contains(workOrder));
            assertSame(workOrder, firstItem.getWorkOrder());
            assertSame(workOrder, secondItem.getWorkOrder());
            assertSame(workOrder, thirdItem.getWorkOrder());
        }
    }

    @Nested
    class Boundaries {

        @Test
        void itemAcceptsZeroQuantityAndPrice() {
            WorkOrderItem item = new WorkOrderItem("Free sample", 0, 0.0, new WorkOrder());

            assertEquals(0, item.getQuantity());
            assertEquals(0.0, item.getPrice());
        }

        @Test
        void documentAcceptsEmptyDataAndZeroFileSize() {
            WorkOrderDocument document = new WorkOrderDocument();

            document.setDocumentData(new byte[0]);
            document.setFileSize(0);

            assertEquals(0, document.getDocumentData().length);
            assertEquals(0, document.getFileSize());
        }
    }

    @Nested
    class Interfaces {

        @Test
        void removingWorkerUpdatesBothEntityCollections() {
            WorkOrder workOrder = new WorkOrder();
            Worker worker = new Worker();
            workOrder.addWorker(worker);

            workOrder.removeWorker(worker);

            assertFalse(workOrder.getWorkers().contains(worker));
            assertFalse(worker.getWorkOrders().contains(workOrder));
        }

        @Test
        void replacingItemsDisconnectsOldItemsAndConnectsNewItems() {
            WorkOrder workOrder = new WorkOrder();
            WorkOrderItem oldItem = new WorkOrderItem();
            WorkOrderItem newItem = new WorkOrderItem();
            workOrder.addItem(oldItem);

            workOrder.setItems(List.of(newItem));

            assertNull(oldItem.getWorkOrder());
            assertSame(workOrder, newItem.getWorkOrder());
        }
    }

    @Nested
    class Exceptions {

        @Test
        void nullRelationshipCollectionsAreHandledWithoutExceptions() {
            WorkOrder workOrder = new WorkOrder();
            Worker worker = new Worker();

            assertDoesNotThrow(() -> workOrder.setWorkers(null));
            assertDoesNotThrow(() -> workOrder.setItems(null));
            assertDoesNotThrow(() -> worker.setWorkOrders(null));

            assertTrue(workOrder.getWorkers().isEmpty());
            assertTrue(workOrder.getItems().isEmpty());
            assertTrue(worker.getWorkOrders().isEmpty());
        }

        @Test
        void nullWorkerCanBeAddedAndRemovedWithoutExceptions() {
            WorkOrder workOrder = new WorkOrder();

            assertDoesNotThrow(() -> workOrder.addWorker(null));
            assertDoesNotThrow(() -> workOrder.removeWorker(null));
            assertTrue(workOrder.getWorkers().isEmpty());
        }
    }

    @Nested
    class Simple {

        @Test
        void companyStoresBasicContactInformation() {
            Company company = new Company(
                    "Acme Services",
                    "100 Main Street",
                    "555-0100",
                    "office@acme.test");

            assertEquals("Acme Services", company.getCompanyName());
            assertEquals("100 Main Street", company.getCompanyAddress());
            assertEquals("555-0100", company.getCompanyPhone());
            assertEquals("office@acme.test", company.getCompanyEmail());
        }

        @Test
        void workerStoresBasicAccountInformation() {
            Worker worker = new Worker("Pat", "Lee", "plee", "plee@test.com", "secret", true);

            assertEquals("Pat", worker.getWorkerFName());
            assertEquals("Lee", worker.getWorkerLName());
            assertEquals("plee", worker.getWorkerUser());
            assertEquals("secret", worker.getWorkerPW());
            assertTrue(worker.isAdmin());
        }
    }
}
