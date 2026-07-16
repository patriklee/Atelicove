package com.atelicove.services;

import static com.atelicove.support.TestFixtures.COMPANY_ID;
import static com.atelicove.support.TestFixtures.PROJECT_ID;
import static com.atelicove.support.TestFixtures.WORK_ORDER_ID;
import static com.atelicove.support.TestFixtures.aCompany;
import static com.atelicove.support.TestFixtures.aProject;
import static com.atelicove.support.TestFixtures.aWorkOrder;
import static com.atelicove.support.TestFixtures.aWorkOrderItem;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.atelicove.dto.DraftWorkOrderRequest;
import com.atelicove.entities.Company;
import com.atelicove.entities.DraftProject;
import com.atelicove.entities.DraftWorkOrder;
import com.atelicove.entities.PlannedStaffing;
import com.atelicove.entities.WorkOrder;
import com.atelicove.enums.ItemType;
import com.atelicove.enums.WorkOrderStatus;
import com.atelicove.repositories.CompanyRepository;
import com.atelicove.repositories.DraftProjectRepository;
import com.atelicove.repositories.DraftWorkOrderRepository;
import com.atelicove.repositories.ProjectRepository;
import com.atelicove.repositories.WorkOrderRepository;

@ExtendWith(MockitoExtension.class)
class DraftWorkOrderServiceTest {

    private static final long DRAFT_ID = 4L;
    private static final int DRAFT_ORDER_ID = 7;
    private static final int STAFFING_ID = 6;

    @Mock private DraftProjectRepository draftProjectRepository;
    @Mock private DraftWorkOrderRepository draftWorkOrderRepository;
    @Mock private WorkOrderRepository workOrderRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private ProjectRepository projectRepository;
    @InjectMocks private DraftWorkOrderService service;

    @Nested
    class Find {

        @Test
        void find_ShouldReturnOnlyWorkOrderOwnedByDraft() {
            // Given
            DraftProject draft = draftWithOrder();
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(draft));

            // When / Then
            assertThat(service.find(DRAFT_ID, DRAFT_ORDER_ID)).isPresent();
            assertThat(service.find(DRAFT_ID, 999)).isEmpty();

            // Given
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.empty());

            // When / Then
            assertThat(service.find(DRAFT_ID, DRAFT_ORDER_ID)).isEmpty();
        }
    }

    @Nested
    class Create {

        @Test
        void create_ShouldCopySourceDefaultsAndItemsWithoutMutatingSource() {
            // Given
            DraftProject draft = draftWithStaffing();
            Company company = aCompany().build();
            WorkOrder source = aWorkOrder().withStatus(WorkOrderStatus.ACTIVE).forCompany(company).build();
            source.addItem(aWorkOrderItem().named("Inspection").forWorkOrder(source).build());
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(draft));
            when(workOrderRepository.findById(WORK_ORDER_ID)).thenReturn(Optional.of(source));
            when(draftProjectRepository.save(draft)).thenReturn(draft);

            // When
            DraftProject result = service.create(DRAFT_ID, request(WORK_ORDER_ID, STAFFING_ID, null, null, null));

            // Then
            assertThat(result.getDraftWorkOrders()).singleElement().satisfies(created -> {
                assertThat(created.getPlannedTeamID()).isEqualTo(STAFFING_ID);
                assertThat(created.getPlannedCompanyID()).isEqualTo(COMPANY_ID);
                assertThat(created.getComment()).isEqualTo(source.getComment());
                assertThat(created.getItems()).singleElement().satisfies(copied -> {
                    assertThat(copied.getItemName()).isEqualTo("Inspection");
                    assertThat(copied).isNotSameAs(source.getItems().get(0));
                });
            });
            assertThat(source.getItems()).hasSize(1);
            verify(draftProjectRepository).save(draft);
        }

        @Test
        void create_ShouldUseExplicitCompanyProjectAndItems() {
            // Given
            DraftProject draft = draft();
            Company company = aCompany().build();
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(draft));
            when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.of(company));
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(aProject().build()));
            when(draftProjectRepository.save(draft)).thenReturn(draft);
            List<DraftWorkOrderRequest.Item> items = List.of(
                    new DraftWorkOrderRequest.Item(null, "Labor", 2, new BigDecimal("50.00"), ItemType.LABOR));

            // When
            DraftProject result = service.create(DRAFT_ID,
                    new DraftWorkOrderRequest(null, null, COMPANY_ID, PROJECT_ID, "  New order  ", null, "comment", items));

            // Then
            assertThat(result.getDraftWorkOrders()).singleElement().satisfies(created -> {
                assertThat(created.getWorkOrderName()).isEqualTo("New order");
                assertThat(created.getPlannedCompanyName()).isEqualTo(company.getCompanyName());
                assertThat(created.getItems()).singleElement()
                        .satisfies(item -> assertThat(item.getPrice()).isEqualByComparingTo("50.00"));
            });
        }

        @Test
        void create_ShouldRejectMissingArchivedDraftAndReadOnlySource() {
            // Given
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> service.create(DRAFT_ID, request(null, null, null, null, null)))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Draft project not found");

            // Given
            DraftProject archived = draft();
            archived.setArchived(true);
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(archived));

            // When / Then
            assertThatThrownBy(() -> service.create(DRAFT_ID, request(null, null, null, null, null)))
                    .isInstanceOf(IllegalStateException.class).hasMessage("Archived draft projects cannot be edited");

            // Given
            DraftProject active = draft();
            WorkOrder review = aWorkOrder().withStatus(WorkOrderStatus.IN_REVIEW).build();
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(active));
            when(workOrderRepository.findById(WORK_ORDER_ID)).thenReturn(Optional.of(review));

            // When / Then
            assertThatThrownBy(() -> service.create(DRAFT_ID, request(WORK_ORDER_ID, null, null, null, null)))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Archived or read-only work orders cannot be used as draft sources");
            assertThat(active.getDraftWorkOrders()).isEmpty();
        }

        @Test
        void create_ShouldRejectNullRequestAndInvalidReferences() {
            // Given
            DraftProject draft = draft();
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(draft));

            // When / Then
            assertThatThrownBy(() -> service.create(DRAFT_ID, null))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Draft work order details are required");
            assertThatThrownBy(() -> service.create(DRAFT_ID, request(null, STAFFING_ID, null, null, null)))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Planned staffing not found");

            // Given / When / Then
            when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.create(DRAFT_ID, request(null, null, COMPANY_ID, null, null)))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Company not found");

            // Given / When / Then
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.create(DRAFT_ID, request(null, null, null, PROJECT_ID, null)))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Source project not found");
        }

        @ParameterizedTest(name = "invalid item: {0}")
        @MethodSource("com.atelicove.services.DraftWorkOrderServiceTest#invalidItems")
        void create_ShouldRejectInvalidItems(
                String scenario, DraftWorkOrderRequest.Item item, String expectedMessage) {
            // Given
            DraftProject draft = draft();
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(draft));

            // When / Then
            assertThatThrownBy(() -> service.create(DRAFT_ID,
                    request(null, null, null, null, List.of(item))))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage(expectedMessage);
            verify(draftProjectRepository, never()).save(any());
        }
    }

    @Nested
    class UpdateAndDelete {

        @Test
        void update_ShouldModifyOwnedEditableDraftWorkOrder() {
            // Given
            DraftProject draft = draftWithOrder();
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(draft));
            when(draftProjectRepository.save(draft)).thenReturn(draft);

            // When
            DraftProject result = service.update(DRAFT_ID, DRAFT_ORDER_ID,
                    new DraftWorkOrderRequest(null, null, null, null, " Updated ", null, "new", List.of()));

            // Then
            assertThat(result.getDraftWorkOrders()).singleElement().satisfies(updated -> {
                assertThat(updated.getWorkOrderName()).isEqualTo("Updated");
                assertThat(updated.getComment()).isEqualTo("new");
                assertThat(updated.getItems()).isEmpty();
            });
        }

        @Test
        void update_ShouldRejectMissingOrArchivedDraftWorkOrder() {
            // Given
            DraftProject draft = draft();
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(draft));

            // When / Then
            assertThatThrownBy(() -> service.update(DRAFT_ID, DRAFT_ORDER_ID, request(null, null, null, null, null)))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Draft work order not found");

            // Given
            DraftProject withOrder = draftWithOrder();
            withOrder.getDraftWorkOrders().get(0).setArchived(true);
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(withOrder));

            // When / Then
            assertThatThrownBy(() -> service.update(DRAFT_ID, DRAFT_ORDER_ID, request(null, null, null, null, null)))
                    .isInstanceOf(IllegalStateException.class).hasMessage("Archived draft work orders cannot be edited");
        }

        @Test
        void delete_ShouldRemoveOwnedDraftWorkOrderAndDeleteIt() {
            // Given
            DraftProject draft = draftWithOrder();
            DraftWorkOrder order = draft.getDraftWorkOrders().get(0);
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(draft));
            when(draftProjectRepository.save(draft)).thenReturn(draft);

            // When
            DraftProject result = service.delete(DRAFT_ID, DRAFT_ORDER_ID);

            // Then
            assertThat(result.getDraftWorkOrders()).isEmpty();
            verify(draftWorkOrderRepository).delete(order);
            verify(draftProjectRepository).save(draft);
        }
    }

    private DraftProject draft() {
        DraftProject draft = new DraftProject();
        draft.setDraftProjectId(DRAFT_ID);
        draft.setDraftName("Draft");
        return draft;
    }

    private DraftProject draftWithStaffing() {
        DraftProject draft = draft();
        PlannedStaffing staffing = new PlannedStaffing();
        staffing.setPlannedStaffingID(STAFFING_ID);
        staffing.setStaffingName("Crew A");
        draft.addPlannedStaffing(staffing);
        return draft;
    }

    private DraftProject draftWithOrder() {
        DraftProject draft = draft();
        DraftWorkOrder order = new DraftWorkOrder();
        order.setDraftWorkOrderID(DRAFT_ORDER_ID);
        draft.addDraftWorkOrder(order);
        return draft;
    }

    private DraftWorkOrderRequest request(
            Integer sourceOrderId,
            Integer staffingId,
            Integer companyId,
            Integer projectId,
            List<DraftWorkOrderRequest.Item> items) {
        return new DraftWorkOrderRequest(sourceOrderId, staffingId, companyId, projectId,
                "Inspection", null, null, items);
    }

    static Stream<Arguments> invalidItems() {
        return Stream.of(
                Arguments.of("missing name", new DraftWorkOrderRequest.Item(null, " ", 1, BigDecimal.ONE, ItemType.LABOR),
                        "Draft work order item name is required"),
                Arguments.of("zero quantity", new DraftWorkOrderRequest.Item(null, "Labor", 0, BigDecimal.ONE, ItemType.LABOR),
                        "Draft work order item quantity must be greater than zero"),
                Arguments.of("negative price", new DraftWorkOrderRequest.Item(null, "Labor", 1, BigDecimal.valueOf(-1), ItemType.LABOR),
                        "Draft work order item price cannot be negative"),
                Arguments.of("missing type", new DraftWorkOrderRequest.Item(null, "Labor", 1, BigDecimal.ONE, null),
                        "Draft work order item type is required"));
    }
}
