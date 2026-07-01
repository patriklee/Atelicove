package com.atelicove.repositories;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.WorkOrderItem;
import com.atelicove.enums.ItemType;
import com.atelicove.repositories.WOItemRepository;
import com.atelicove.repositories.WorkOrderRepository;

@DataJpaTest
class WOItemRepositoryTest {

    @Autowired
    private WOItemRepository itemRepository;

    @Autowired
    private WorkOrderRepository workOrderRepository;

    @Test
    void saveAndFindByIdPersistsItemAndWorkOrderRelationship() {
        WorkOrder workOrder = workOrderRepository.saveAndFlush(new WorkOrder());
        WorkOrderItem item =
                new WorkOrderItem("Replacement valve", 2, 24.99, ItemType.MATERIAL, workOrder);

        WorkOrderItem saved = itemRepository.saveAndFlush(item);

        assertThat(saved.getWorkOrderItemID()).isPositive();
        assertThat(itemRepository.findById(saved.getWorkOrderItemID()))
                .hasValueSatisfying(found -> {
                    assertThat(found.getItemName()).isEqualTo("Replacement valve");
                    assertThat(found.getQuantity()).isEqualTo(2);
                    assertThat(found.getPrice()).isEqualTo(24.99);
                    assertThat(found.getItemType()).isEqualTo(ItemType.MATERIAL);
                    assertThat(found.getWorkOrder().getWorkOrderID())
                            .isEqualTo(workOrder.getWorkOrderID());
                });
    }

    @Test
    void deleteByIdRemovesItem() {
        WorkOrder workOrder = workOrderRepository.saveAndFlush(new WorkOrder());
        WorkOrderItem saved = itemRepository.saveAndFlush(
                new WorkOrderItem("Labor", 1, 85.00, ItemType.LABOR, workOrder));

        itemRepository.deleteById(saved.getWorkOrderItemID());
        itemRepository.flush();

        assertThat(itemRepository.findById(saved.getWorkOrderItemID())).isEmpty();
    }
}
