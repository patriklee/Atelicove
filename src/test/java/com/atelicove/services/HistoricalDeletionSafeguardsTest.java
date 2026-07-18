package com.atelicove.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.atelicove.entities.Company;
import com.atelicove.entities.Document;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.Worker;
import com.atelicove.enums.WorkOrderStatus;
import com.atelicove.repositories.CompanyRepository;
import com.atelicove.repositories.DraftWorkOrderRepository;
import com.atelicove.repositories.ProjectRepository;
import com.atelicove.repositories.TeamRepository;
import com.atelicove.repositories.WODocumentRepository;
import com.atelicove.repositories.WOItemRepository;
import com.atelicove.repositories.WorkOrderRepository;
import com.atelicove.repositories.WorkerRepository;

@ExtendWith(MockitoExtension.class)
class HistoricalDeletionSafeguardsTest {

    private static final int WORK_ORDER_ID = 11;
    private static final int WORKER_ID = 12;
    private static final int COMPANY_ID = 13;
    private static final int DOCUMENT_ID = 14;

    @Mock WorkOrderRepository workOrderRepository;
    @Mock DraftWorkOrderRepository draftWorkOrderRepository;
    @Mock WorkerRepository workerRepository;
    @Mock CompanyRepository companyRepository;
    @Mock WODocumentRepository documentRepository;
    @Mock WOItemRepository itemRepository;
    @Mock TeamRepository teamRepository;
    @Mock ProjectRepository projectRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock AuthorizationService authorizationService;
    @Mock Authentication authentication;

    @InjectMocks WorkOrderService workOrderService;
    @InjectMocks WorkerService workerService;
    @InjectMocks CompanyService companyService;
    @InjectMocks WODocumentService documentService;

    @Test
    void completedWorkOrderCannotBePermanentlyDeleted() {
        WorkOrder order = order(WorkOrderStatus.COMPLETE, false);
        when(workOrderRepository.findById(WORK_ORDER_ID)).thenReturn(Optional.of(order));

        assertHistoricalWorkOrderIsRejected(order);
    }

    @Test
    void archivedCompletedWorkOrderCannotBePermanentlyDeleted() {
        WorkOrder order = order(WorkOrderStatus.COMPLETE, true);
        when(workOrderRepository.findById(WORK_ORDER_ID)).thenReturn(Optional.of(order));

        assertHistoricalWorkOrderIsRejected(order);
    }

    @Test
    void workOrderWithItemsCannotBePermanentlyDeleted() {
        WorkOrder order = order(WorkOrderStatus.OPEN, false);
        when(workOrderRepository.findById(WORK_ORDER_ID)).thenReturn(Optional.of(order));
        when(itemRepository.existsByWorkOrder_WorkOrderID(WORK_ORDER_ID)).thenReturn(true);

        assertHistoricalWorkOrderIsRejected(order);
    }

    @Test
    void workOrderWithDocumentsCannotBePermanentlyDeleted() {
        WorkOrder order = order(WorkOrderStatus.OPEN, false);
        when(workOrderRepository.findById(WORK_ORDER_ID)).thenReturn(Optional.of(order));
        when(documentRepository.existsByWorkOrder_WorkOrderID(WORK_ORDER_ID)).thenReturn(true);

        assertHistoricalWorkOrderIsRejected(order);
    }

    @Test
    void workOrderWithAssignedWorkersCannotBePermanentlyDeleted() {
        WorkOrder order = order(WorkOrderStatus.OPEN, false);
        Worker worker = new Worker();
        worker.setWorkerID(WORKER_ID);
        order.addWorker(worker);
        when(workOrderRepository.findById(WORK_ORDER_ID)).thenReturn(Optional.of(order));

        assertHistoricalWorkOrderIsRejected(order);
        assertThat(order.getWorkers()).containsExactly(worker);
    }

    @Test
    void eligibleAccidentalEmptyOpenWorkOrderCanBeDeleted() {
        WorkOrder order = order(WorkOrderStatus.OPEN, false);
        order.setStartDateTime(null);
        when(workOrderRepository.findById(WORK_ORDER_ID)).thenReturn(Optional.of(order));

        workOrderService.deletePermanentlyById(WORK_ORDER_ID);

        verify(workOrderRepository).delete(order);
    }

    @Test
    void referencedWorkerCannotBePermanentlyDeleted() {
        Worker worker = worker();
        when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.of(worker));
        when(workOrderRepository.existsByWorkers_WorkerID(WORKER_ID)).thenReturn(true);

        assertThatThrownBy(() -> workerService.deletePermanentlyById(WORKER_ID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Worker cannot be permanently deleted while work orders are attached");
        verify(workerRepository, never()).delete(any());
    }

    @Test
    void workerWithUploadedDocumentsOrTeamMembershipCannotBePermanentlyDeleted() {
        Worker worker = worker();
        when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.of(worker));
        when(documentRepository.existsByUploadedByWorker_WorkerID(WORKER_ID)).thenReturn(true);

        assertThatThrownBy(() -> workerService.deletePermanentlyById(WORKER_ID))
                .hasMessage("Worker cannot be permanently deleted while uploaded documents are attached");

        when(documentRepository.existsByUploadedByWorker_WorkerID(WORKER_ID)).thenReturn(false);
        when(teamRepository.existsByWorkers_WorkerID(WORKER_ID)).thenReturn(true);

        assertThatThrownBy(() -> workerService.deletePermanentlyById(WORKER_ID))
                .hasMessage("Worker cannot be permanently deleted while assigned to a team");
        verify(workerRepository, never()).delete(any());
    }

    @Test
    void workerReferencedByProjectHistoryCannotBePermanentlyDeleted() {
        Worker worker = worker();
        when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.of(worker));
        when(projectRepository.existsByComments_Author_WorkerID(WORKER_ID)).thenReturn(true);

        assertThatThrownBy(() -> workerService.deletePermanentlyById(WORKER_ID))
                .hasMessage("Worker cannot be permanently deleted while project history is attached");
        verify(workerRepository, never()).delete(any());
    }

    @Test
    void referencedCompanyCannotBePermanentlyDeleted() {
        Company company = new Company();
        company.setCompanyID(COMPANY_ID);
        when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.of(company));
        when(workOrderRepository.existsByCompany_CompanyID(COMPANY_ID)).thenReturn(true);

        assertThatThrownBy(() -> companyService.deletePermanentlyById(COMPANY_ID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Company cannot be permanently deleted while work orders are attached");
        verify(companyRepository, never()).delete(any());
    }

    @Test
    void archivedDocumentsRemainLinkedAndRetrievable() {
        WorkOrder order = order(WorkOrderStatus.COMPLETE, true);
        Document document = new Document();
        document.setDocumentID(DOCUMENT_ID);
        document.setWorkOrder(order);
        when(documentRepository.findByDocumentIDAndWorkOrder_WorkOrderID(DOCUMENT_ID, WORK_ORDER_ID))
                .thenReturn(Optional.of(document));

        Document result = documentService.getRequiredDocument(WORK_ORDER_ID, DOCUMENT_ID);

        assertThat(result).isSameAs(document);
        assertThat(result.getWorkOrder()).isSameAs(order);
        assertThat(result.getWorkOrder().isArchived()).isTrue();
    }

    @Test
    void deletingDocumentLeavesItsWorkOrderIntact() {
        WorkOrder order = order(WorkOrderStatus.OPEN, false);
        Document document = new Document();
        document.setDocumentID(DOCUMENT_ID);
        document.setWorkOrder(order);
        when(workOrderRepository.findById(WORK_ORDER_ID)).thenReturn(Optional.of(order));
        when(documentRepository.findByDocumentIDAndWorkOrder_WorkOrderID(DOCUMENT_ID, WORK_ORDER_ID))
                .thenReturn(Optional.of(document));

        documentService.deleteFromWorkOrder(WORK_ORDER_ID, DOCUMENT_ID, authentication);

        verify(documentRepository).delete(document);
        verify(workOrderRepository, never()).delete(any());
        assertThat(document.getWorkOrder()).isSameAs(order);
    }

    private void assertHistoricalWorkOrderIsRejected(WorkOrder order) {
        assertThatThrownBy(() -> workOrderService.deletePermanentlyById(WORK_ORDER_ID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Only empty open work orders without business history can be permanently deleted");
        verify(workOrderRepository, never()).delete(order);
    }

    private WorkOrder order(WorkOrderStatus status, boolean archived) {
        WorkOrder order = new WorkOrder();
        order.setWorkOrderID(WORK_ORDER_ID);
        order.setStatus(status);
        order.setArchived(archived);
        return order;
    }

    private Worker worker() {
        Worker worker = new Worker();
        worker.setWorkerID(WORKER_ID);
        return worker;
    }
}
