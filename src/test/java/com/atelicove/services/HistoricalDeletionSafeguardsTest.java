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

    private static final int ORDER_ID = 11;
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
        assertWorkOrderDeletionRejected(order(WorkOrderStatus.COMPLETE, false));
    }

    @Test
    void archivedCompletedWorkOrderCannotBePermanentlyDeleted() {
        assertWorkOrderDeletionRejected(order(WorkOrderStatus.COMPLETE, true));
    }

    @Test
    void workOrderWithItemsCannotBePermanentlyDeleted() {
        WorkOrder order = order(WorkOrderStatus.OPEN, false);
        when(workOrderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));
        when(itemRepository.existsByWorkOrder_WorkOrderID(ORDER_ID)).thenReturn(true);

        assertDeletionConflict();
    }

    @Test
    void workOrderWithDocumentsCannotBePermanentlyDeleted() {
        WorkOrder order = order(WorkOrderStatus.OPEN, false);
        when(workOrderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));
        when(documentRepository.existsByWorkOrder_WorkOrderID(ORDER_ID)).thenReturn(true);

        assertDeletionConflict();
    }

    @Test
    void workOrderWithAssignedWorkerCannotBePermanentlyDeleted() {
        WorkOrder order = order(WorkOrderStatus.OPEN, false);
        Worker worker = worker();
        order.addWorker(worker);
        when(workOrderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));

        assertDeletionConflict();
        assertThat(order.getWorkers()).containsExactly(worker);
    }

    @Test
    void emptyAccidentalOpenWorkOrderCanBeDeleted() {
        WorkOrder order = order(WorkOrderStatus.OPEN, false);
        when(workOrderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));

        workOrderService.deletePermanentlyById(ORDER_ID);

        verify(workOrderRepository).delete(order);
    }

    @Test
    void referencedWorkerCannotBePermanentlyDeleted() {
        when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.of(worker()));
        when(workOrderRepository.existsByWorkers_WorkerID(WORKER_ID)).thenReturn(true);

        assertThatThrownBy(() -> workerService.deletePermanentlyById(WORKER_ID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Worker cannot be permanently deleted while work orders are attached");
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
    void archivedDocumentRemainsLinkedAndDownloadable() {
        WorkOrder order = order(WorkOrderStatus.COMPLETE, true);
        Document document = document(order);
        when(documentRepository.findByDocumentIDAndWorkOrder_WorkOrderID(DOCUMENT_ID, ORDER_ID))
                .thenReturn(Optional.of(document));

        Document result = documentService.getRequiredDocument(ORDER_ID, DOCUMENT_ID);

        assertThat(result.getWorkOrder()).isSameAs(order);
        assertThat(result.getDocumentData()).containsExactly((byte) 1, (byte) 2, (byte) 3);
    }

    @Test
    void deletingDocumentLeavesWorkOrderIntact() {
        WorkOrder order = order(WorkOrderStatus.OPEN, false);
        Document document = document(order);
        when(workOrderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));
        when(documentRepository.findByDocumentIDAndWorkOrder_WorkOrderID(DOCUMENT_ID, ORDER_ID))
                .thenReturn(Optional.of(document));

        documentService.deleteFromWorkOrder(ORDER_ID, DOCUMENT_ID, authentication);

        verify(documentRepository).delete(document);
        verify(workOrderRepository, never()).delete(any());
        assertThat(document.getWorkOrder()).isSameAs(order);
    }

    private void assertWorkOrderDeletionRejected(WorkOrder order) {
        when(workOrderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));
        assertDeletionConflict();
    }

    private void assertDeletionConflict() {
        assertThatThrownBy(() -> workOrderService.deletePermanentlyById(ORDER_ID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Only empty open work orders without business history can be permanently deleted");
        verify(workOrderRepository, never()).delete(any());
    }

    private WorkOrder order(WorkOrderStatus status, boolean archived) {
        WorkOrder order = new WorkOrder();
        order.setWorkOrderID(ORDER_ID);
        order.setStatus(status);
        order.setArchived(archived);
        return order;
    }

    private Worker worker() {
        Worker worker = new Worker();
        worker.setWorkerID(WORKER_ID);
        return worker;
    }

    private Document document(WorkOrder order) {
        Document document = new Document();
        document.setDocumentID(DOCUMENT_ID);
        document.setWorkOrder(order);
        document.setDocumentData(new byte[] {1, 2, 3});
        return document;
    }
}
