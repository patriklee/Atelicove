package com.atelicove.entities;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;

import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.WorkOrderItem;
import com.atelicove.entities.Worker;
import com.atelicove.enums.WorkOrderStatus;

class WorkOrderTest {

    @Test
    void newWorkOrderHasExpectedDefaults() {
        LocalDateTime beforeCreation = LocalDateTime.now();
        WorkOrder workOrder = new WorkOrder();
        LocalDateTime afterCreation = LocalDateTime.now();

        assertAll(
                () -> assertEquals(WorkOrderStatus.OPEN, workOrder.getStatus()),
                () -> assertTrue(workOrder.getWorkers().isEmpty()),
                () -> assertTrue(workOrder.getItems().isEmpty()),
                () -> assertFalse(workOrder.getStartDateTime().isBefore(beforeCreation)),
                () -> assertFalse(workOrder.getStartDateTime().isAfter(afterCreation)));
    }

    @Test
    void addAndRemoveWorkerKeepsBothSidesInSync() {
        WorkOrder workOrder = new WorkOrder();
        Worker worker = new Worker();

        workOrder.addWorker(worker);

        assertAll(
                () -> assertTrue(workOrder.getWorkers().contains(worker)),
                () -> assertTrue(worker.getWorkOrders().contains(workOrder)));

        workOrder.removeWorker(worker);

        assertAll(
                () -> assertFalse(workOrder.getWorkers().contains(worker)),
                () -> assertFalse(worker.getWorkOrders().contains(workOrder)));
    }

    @Test
    void setWorkersReplacesWorkersOnBothSides() {
        WorkOrder workOrder = new WorkOrder();
        Worker oldWorker = new Worker();
        Worker newWorker = new Worker();
        workOrder.addWorker(oldWorker);

        workOrder.setWorkers(Set.of(newWorker));

        assertAll(
                () -> assertEquals(Set.of(newWorker), workOrder.getWorkers()),
                () -> assertFalse(oldWorker.getWorkOrders().contains(workOrder)),
                () -> assertTrue(newWorker.getWorkOrders().contains(workOrder)));
    }

    @Test
    void addAndRemoveItemKeepsBothSidesInSync() {
        WorkOrder workOrder = new WorkOrder();
        WorkOrderItem item = new WorkOrderItem();

        workOrder.addItem(item);

        assertAll(
                () -> assertTrue(workOrder.getItems().contains(item)),
                () -> assertSame(workOrder, item.getWorkOrder()));

        workOrder.removeItem(item);

        assertAll(
                () -> assertFalse(workOrder.getItems().contains(item)),
                () -> assertNull(item.getWorkOrder()));
    }

    @Test
    void setItemsReplacesItemsAndUpdatesTheirWorkOrder() {
        WorkOrder workOrder = new WorkOrder();
        WorkOrderItem oldItem = new WorkOrderItem();
        WorkOrderItem newItem = new WorkOrderItem();
        workOrder.addItem(oldItem);

        workOrder.setItems(List.of(newItem));

        assertAll(
                () -> assertEquals(List.of(newItem), workOrder.getItems()),
                () -> assertNull(oldItem.getWorkOrder()),
                () -> assertSame(workOrder, newItem.getWorkOrder()));
    }
}
