package com.atelicove.entities;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.Document;
import com.atelicove.entities.Worker;
import com.atelicove.enums.DocumentType;

class DocumentTest {

    @Test
    void documentTypeIncludesExpandedDocumentTypes() {
        assertEquals(
                List.of(
                        DocumentType.GENERAL,
                        DocumentType.CONTRACT,
                        DocumentType.RECEIPT,
                        DocumentType.INVOICE,
                        DocumentType.REPORT,
                        DocumentType.PHOTO,
                        DocumentType.FORM,
                        DocumentType.OTHER),
                Arrays.asList(DocumentType.values()));
    }

    @Test
    void constructorSetsDocumentDetails() {
        WorkOrder workOrder = new WorkOrder();
        Worker worker = new Worker();
        byte[] data = { 1, 2, 3 };

        Document document = new Document(
                workOrder, "receipt.pdf", DocumentType.RECEIPT, data,
                worker, "application/pdf", data.length);

        assertAll(
                () -> assertSame(workOrder, document.getWorkOrder()),
                () -> assertEquals("receipt.pdf", document.getFileName()),
                () -> assertEquals(DocumentType.RECEIPT, document.getDocumentType()),
                () -> assertArrayEquals(data, document.getDocumentData()),
                () -> assertSame(worker, document.getUploadedByWorker()),
                () -> assertEquals("application/pdf", document.getMimeType()),
                () -> assertEquals(data.length, document.getFileSize()));
    }

    @Test
    void settersUpdateDocumentDetails() {
        Document document = new Document();
        Project project = new Project();
        WorkOrder workOrder = new WorkOrder();
        Worker worker = new Worker();
        byte[] data = { 4, 5 };
        LocalDateTime uploadedAt = LocalDateTime.of(2026, 6, 22, 11, 0);

        document.setDocumentID(20);
        document.setWorkOrder(workOrder);
        document.setProject(project);
        document.setFileName("contract.txt");
        document.setDocumentType(DocumentType.CONTRACT);
        document.setDocumentData(data);
        document.setCreatedAt(uploadedAt);
        document.setUploadedByWorker(worker);
        document.setMimeType("text/plain");
        document.setFileSize(data.length);

        assertAll(
                () -> assertEquals(20, document.getDocumentID()),
                () -> assertSame(workOrder, document.getWorkOrder()),
                () -> assertSame(project, document.getProject()),
                () -> assertEquals("contract.txt", document.getFileName()),
                () -> assertEquals(DocumentType.CONTRACT, document.getDocumentType()),
                () -> assertArrayEquals(data, document.getDocumentData()),
                () -> assertEquals(uploadedAt, document.getCreatedAt()),
                () -> assertSame(worker, document.getUploadedByWorker()),
                () -> assertEquals("text/plain", document.getMimeType()),
                () -> assertEquals(data.length, document.getFileSize()));
    }
}
