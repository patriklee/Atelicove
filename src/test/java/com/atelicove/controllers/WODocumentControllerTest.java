package com.atelicove.controllers;

import static com.atelicove.support.ControllerTestSupport.mockMvcFor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;

import com.atelicove.entities.Document;
import com.atelicove.entities.WorkOrder;
import com.atelicove.enums.DocumentType;
import com.atelicove.services.WODocumentService;

@ExtendWith(MockitoExtension.class)
class WODocumentControllerTest {

    @Mock private WODocumentService service;
    private MockMvc mockMvc;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        authentication = new TestingAuthenticationToken("pat", "password");
        mockMvc = mockMvcFor(new WODocumentController(service));
    }

    @Test
    void getDocuments_ShouldReturnMetadata_WhenWorkOrderIsAccessible() throws Exception {
        when(service.findByWorkOrder(7, authentication)).thenReturn(List.of(document(3)));

        mockMvc.perform(get("/workorders/7/documents").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].documentID").value(3))
                .andExpect(jsonPath("$[0].workOrderID").value(7))
                .andExpect(jsonPath("$[0].fileName").value("report.pdf"))
                .andExpect(jsonPath("$[0].documentData").doesNotExist());
    }

    @Test
    void uploadDocument_ShouldReturnSavedMetadata_WhenMultipartRequestIsValid() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "report.pdf", "application/pdf", new byte[] {1, 2});
        when(service.upload(eq(7), any(), eq(DocumentType.REPORT), eq(authentication))).thenReturn(document(4));

        mockMvc.perform(multipart("/workorders/7/documents").file(file)
                        .param("documentType", "REPORT").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.documentID").value(4));
    }

    @Test
    void downloadDocument_ShouldReturnBytesAndAttachmentHeaders_WhenDocumentExists() throws Exception {
        when(service.getRequiredDocument(7, 3, authentication)).thenReturn(document(3));

        mockMvc.perform(get("/workorders/7/documents/3/download").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/pdf"))
                .andExpect(content().bytes(new byte[] {1, 2, 3}))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"report.pdf\""));
    }

    @Test
    void deleteDocument_ShouldReturnNoContent_WhenServiceDeletesDocument() throws Exception {
        mockMvc.perform(delete("/workorders/7/documents/3").principal(authentication))
                .andExpect(status().isNoContent());

        verify(service).deleteFromWorkOrder(7, 3, authentication);
    }

    @Test
    void downloadDocument_ShouldReturnBadRequest_WhenDocumentDoesNotExist() throws Exception {
        when(service.getRequiredDocument(7, 99, authentication))
                .thenThrow(new IllegalArgumentException("Document not found"));

        mockMvc.perform(get("/workorders/7/documents/99/download").principal(authentication))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Document not found"));
    }

    private Document document(int id) {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setWorkOrderID(7);
        Document document = new Document();
        document.setDocumentID(id);
        document.setWorkOrder(workOrder);
        document.setFileName("report.pdf");
        document.setDocumentType(DocumentType.REPORT);
        document.setMimeType("application/pdf");
        document.setDocumentData(new byte[] {1, 2, 3});
        document.setFileSize(3);
        return document;
    }
}
