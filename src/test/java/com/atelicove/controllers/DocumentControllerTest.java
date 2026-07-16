package com.atelicove.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.atelicove.entities.Document;
import com.atelicove.entities.WorkOrder;
import com.atelicove.services.WODocumentService;

@ExtendWith(MockitoExtension.class)
class DocumentControllerTest {

    @Mock private WODocumentService service;
    @InjectMocks private DocumentController controller;

    @Test
    void getAllDocuments_ShouldReturnMetadataWithoutFileBytes() {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setWorkOrderID(6);
        Document document = new Document();
        document.setDocumentID(1);
        document.setWorkOrder(workOrder);
        document.setDocumentData(new byte[] {1, 2, 3});
        when(service.findAll()).thenReturn(List.of(document));

        assertThat(controller.getAllDocuments()).singleElement().satisfies(dto -> {
            assertThat(dto.getDocumentID()).isEqualTo(1);
            assertThat(dto.getWorkOrderID()).isEqualTo(6);
        });
    }
}
