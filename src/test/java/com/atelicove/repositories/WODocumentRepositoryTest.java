package com.atelicove.repositories;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.WorkOrderDocument;
import com.atelicove.entities.Worker;
import com.atelicove.enums.DocumentType;
import com.atelicove.repositories.WODocumentRepository;
import com.atelicove.repositories.WorkOrderRepository;
import com.atelicove.repositories.WorkerRepository;

@DataJpaTest
class WODocumentRepositoryTest {

    @Autowired
    private WODocumentRepository documentRepository;

    @Autowired
    private WorkOrderRepository workOrderRepository;

    @Autowired
    private WorkerRepository workerRepository;

    @Test
    void saveAndFindByIdPersistsDocumentMetadataAndRelationships() {
        WorkOrder workOrder = workOrderRepository.saveAndFlush(new WorkOrder());
        Worker worker = workerRepository.saveAndFlush(
                new Worker("Pat", "Lee", "plee", "plee@test.com", "encoded-password", false));
        byte[] data = { 1, 2, 3 };
        WorkOrderDocument document = new WorkOrderDocument(
                workOrder, "receipt.pdf", DocumentType.RECEIPT, data,
                worker, "application/pdf", data.length);

        WorkOrderDocument saved = documentRepository.saveAndFlush(document);

        assertThat(saved.getDocumentID()).isPositive();
        assertThat(documentRepository.findById(saved.getDocumentID()))
                .hasValueSatisfying(found -> {
                    assertThat(found.getFileName()).isEqualTo("receipt.pdf");
                    assertThat(found.getDocumentType()).isEqualTo(DocumentType.RECEIPT);
                    assertThat(found.getDocumentData()).containsExactly(data);
                    assertThat(found.getMimeType()).isEqualTo("application/pdf");
                    assertThat(found.getFileSize()).isEqualTo(3);
                    assertThat(found.getWorkOrder().getWorkOrderID())
                            .isEqualTo(workOrder.getWorkOrderID());
                    assertThat(found.getUploadedByWorker().getWorkerID())
                            .isEqualTo(worker.getWorkerID());
                });
    }

    @Test
    void deleteByIdRemovesDocument() {
        WorkOrder workOrder = workOrderRepository.saveAndFlush(new WorkOrder());
        Worker worker = workerRepository.saveAndFlush(
                new Worker("Pat", "Lee", "patlee", "patlee@test.com", "encoded-password", false));
        WorkOrderDocument saved = documentRepository.saveAndFlush(
                new WorkOrderDocument(
                        workOrder, "note.txt", DocumentType.OTHER, new byte[] { 1 },
                        worker, "text/plain", 1));

        documentRepository.deleteById(saved.getDocumentID());
        documentRepository.flush();

        assertThat(documentRepository.findById(saved.getDocumentID())).isEmpty();
    }

    @Test
    void findByWorkOrderReturnsDocumentsForThatWorkOrder() {
        WorkOrder workOrder = workOrderRepository.saveAndFlush(new WorkOrder());
        WorkOrder otherWorkOrder = workOrderRepository.saveAndFlush(new WorkOrder());
        Worker worker = workerRepository.saveAndFlush(
                new Worker("Pat", "Lee", "pat", "pat@test.com", "encoded-password", false));

        WorkOrderDocument first = documentRepository.saveAndFlush(
                new WorkOrderDocument(workOrder, "first.pdf", DocumentType.OTHER,
                        new byte[] { 1 }, worker, "application/pdf", 1));
        documentRepository.saveAndFlush(
                new WorkOrderDocument(otherWorkOrder, "other.pdf", DocumentType.OTHER,
                        new byte[] { 2 }, worker, "application/pdf", 1));

        assertThat(documentRepository.findByWorkOrder_WorkOrderIDOrderByCreatedAtDesc(workOrder.getWorkOrderID()))
                .extracting(WorkOrderDocument::getDocumentID)
                .containsExactly(first.getDocumentID());
    }
}
