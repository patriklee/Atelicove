package com.atelicove.entities;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;

import org.junit.jupiter.api.Test;

import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.WorkOrderItem;
import com.atelicove.enums.ItemType;

class WorkOrderItemTest {

    @Test
    void constructorSetsItemDetails() {
        WorkOrder workOrder = new WorkOrder();
        WorkOrderItem item = new WorkOrderItem("Replacement valve", 3, 24.99, ItemType.MATERIAL, workOrder);

        assertAll(
                () -> assertEquals("Replacement valve", item.getItemName()),
                () -> assertEquals(3, item.getQuantity()),
                () -> assertEquals(24.99, item.getPrice()),
                () -> assertEquals(ItemType.MATERIAL, item.getItemType()),
                () -> assertSame(workOrder, item.getWorkOrder()));
    }

    @Test
    void settersUpdateItemDetails() {
        WorkOrderItem item = new WorkOrderItem();
        WorkOrder workOrder = new WorkOrder();

        item.setWorkOrderItemID(15);
        item.setItemName("Labor");
        item.setQuantity(2);
        item.setPrice(85.50);
        item.setItemType(ItemType.LABOR);
        item.setWorkOrder(workOrder);

        assertAll(
                () -> assertEquals(15, item.getWorkOrderItemID()),
                () -> assertEquals("Labor", item.getItemName()),
                () -> assertEquals(2, item.getQuantity()),
                () -> assertEquals(85.50, item.getPrice()),
                () -> assertEquals(ItemType.LABOR, item.getItemType()),
                () -> assertSame(workOrder, item.getWorkOrder()));
    }
}
