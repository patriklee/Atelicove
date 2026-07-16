package com.atelicove.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.atelicove.dto.DraftWorkOrderRequest;
import com.atelicove.entities.Company;
import com.atelicove.entities.DraftProject;
import com.atelicove.entities.PlannedStaffing;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.WorkOrderItem;
import com.atelicove.enums.ItemType;
import com.atelicove.enums.WorkOrderStatus;
import com.atelicove.repositories.CompanyRepository;
import com.atelicove.repositories.DraftProjectRepository;
import com.atelicove.repositories.DraftWorkOrderRepository;
import com.atelicove.repositories.ProjectRepository;
import com.atelicove.repositories.WorkOrderRepository;

@ExtendWith(MockitoExtension.class)
class DraftWorkOrderServiceTest {

    @Mock private DraftProjectRepository draftProjectRepository;
    @Mock private DraftWorkOrderRepository draftWorkOrderRepository;
    @Mock private WorkOrderRepository workOrderRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private ProjectRepository projectRepository;
    @InjectMocks private DraftWorkOrderService service;

    @Test
    void createCopiesSourceItemsAndUsesPlannedStaffing() {
        DraftProject draft = new DraftProject();
        draft.setDraftProjectId(4L);
        PlannedStaffing staffing = new PlannedStaffing();
        staffing.setPlannedStaffingID(6);
        staffing.setStaffingName("Crew A");
        draft.addPlannedStaffing(staffing);

        Company company = new Company();
        company.setCompanyID(3);
        company.setCompanyName("Acme");
        WorkOrder source = new WorkOrder();
        source.setCompany(company);
        WorkOrderItem item = new WorkOrderItem();
        item.setItemName("Inspection");
        item.setQuantity(2);
        item.setPrice(new BigDecimal("125.00"));
        item.setItemType(ItemType.LABOR);
        source.addItem(item);

        when(draftProjectRepository.findById(4L)).thenReturn(Optional.of(draft));
        when(workOrderRepository.findById(9)).thenReturn(Optional.of(source));
        when(draftProjectRepository.save(draft)).thenReturn(draft);

        DraftProject updated = service.create(4L, new DraftWorkOrderRequest(
                9, 6, null, null, "Inspection", null, null, null));

        assertThat(updated.getDraftWorkOrders()).singleElement().satisfies(workOrder -> {
            assertThat(workOrder.getPlannedTeamID()).isEqualTo(6);
            assertThat(workOrder.getPlannedCompanyID()).isEqualTo(3);
            assertThat(workOrder.getItems()).singleElement()
                    .satisfies(copied -> assertThat(copied.getItemName()).isEqualTo("Inspection"));
        });
    }

    @Test
    void createRejectsReadOnlySourceWorkOrderBeforeDraftIsChanged() {
        DraftProject draft = new DraftProject();
        WorkOrder source = new WorkOrder();
        source.setStatus(WorkOrderStatus.IN_REVIEW);

        when(draftProjectRepository.findById(4L)).thenReturn(Optional.of(draft));
        when(workOrderRepository.findById(9)).thenReturn(Optional.of(source));

        DraftWorkOrderRequest request = new DraftWorkOrderRequest(
                9, null, null, null, "Inspection", null, null, null);

        assertThatThrownBy(() -> service.create(4L, request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("read-only");
        assertThat(draft.getDraftWorkOrders()).isEmpty();
    }
}
