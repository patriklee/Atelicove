package com.atelicove.repositories;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.atelicove.entities.Project;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.Document;
import com.atelicove.entities.Worker;
import com.atelicove.enums.DocumentType;
import com.atelicove.repositories.ProjectRepository;
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

    @Autowired
    private ProjectRepository projectRepository;

    @Test
    void saveAndFindByIdPersistsDocumentMetadataAndRelationships() {
        WorkOrder workOrder = workOrderRepository.saveAndFlush(new WorkOrder());
        Worker worker = workerRepository.saveAndFlush(
                new Worker("Pat", "Lee", "plee", "plee@test.com", "encoded-password", false));
        byte[] data = { 1, 2, 3 };
        Document document = new Document(
                workOrder, "receipt.pdf", DocumentType.RECEIPT, data,
                worker, "application/pdf", data.length);

        Document saved = documentRepository.saveAndFlush(document);

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
        Document saved = documentRepository.saveAndFlush(
                new Document(
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

        Document first = documentRepository.saveAndFlush(
                new Document(workOrder, "first.pdf", DocumentType.OTHER,
                        new byte[] { 1 }, worker, "application/pdf", 1));
        documentRepository.saveAndFlush(
                new Document(otherWorkOrder, "other.pdf", DocumentType.OTHER,
                        new byte[] { 2 }, worker, "application/pdf", 1));

        assertThat(documentRepository.findByWorkOrder_WorkOrderIDOrderByCreatedAtDesc(workOrder.getWorkOrderID()))
                .extracting(Document::getDocumentID)
                .containsExactly(first.getDocumentID());
    }

    @Test
    void findByProjectReturnsDocumentsForThatProject() {
        Project project = projectRepository.saveAndFlush(new Project());
        Project otherProject = projectRepository.saveAndFlush(new Project());
        Worker worker = workerRepository.saveAndFlush(
                new Worker("Pat", "Lee", "projectpat", "projectpat@test.com", "encoded-password", false));

        Document first = documentRepository.saveAndFlush(
                new Document(project, "project.pdf", DocumentType.REPORT,
                        new byte[] { 1 }, worker, "application/pdf", 1));
        documentRepository.saveAndFlush(
                new Document(otherProject, "other-project.pdf", DocumentType.OTHER,
                        new byte[] { 2 }, worker, "application/pdf", 1));

        assertThat(documentRepository.findByProject_ProjectIDOrderByCreatedAtDesc(project.getProjectID()))
                .extracting(Document::getDocumentID)
                .containsExactly(first.getDocumentID());
    }
}
