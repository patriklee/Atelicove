package com.atelicove.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.Authentication;

import com.atelicove.entities.Document;
import com.atelicove.entities.Project;
import com.atelicove.enums.DocumentType;
import com.atelicove.services.WODocumentService;

@ExtendWith(MockitoExtension.class)
class ProjectDocumentControllerTest {

    @Mock private WODocumentService service;
    @Mock private Authentication authentication;
    @InjectMocks private ProjectDocumentController controller;

    @Test
    void allProjectDocumentEndpoints_ShouldDelegateAndReturnExpectedResponses() {
        Document document = document();
        MockMultipartFile file = new MockMultipartFile("file", "brief.pdf", "application/pdf", new byte[] {4, 5});
        when(service.findByProject(9, authentication)).thenReturn(List.of(document));
        when(service.uploadToProject(9, file, DocumentType.REPORT, authentication)).thenReturn(document);
        when(service.getRequiredProjectDocument(9, 2, authentication)).thenReturn(document);

        assertThat(controller.getDocuments(9, authentication)).singleElement()
                .satisfies(dto -> assertThat(dto.getFileName()).isEqualTo("brief.pdf"));
        assertThat(controller.uploadDocument(9, file, DocumentType.REPORT, authentication).getDocumentID()).isEqualTo(2);
        assertThat(controller.downloadDocument(9, 2, authentication)).satisfies(response -> {
            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getHeaders().getContentType().toString()).isEqualTo("application/pdf");
            assertThat(response.getBody().getByteArray()).containsExactly(4, 5);
        });
        assertThat(controller.deleteDocument(9, 2, authentication).getStatusCode().value()).isEqualTo(204);
        verify(service).deleteFromProject(9, 2, authentication);
    }

    private Document document() {
        Project project = new Project();
        project.setProjectID(9);
        project.setProjectName("Campaign");
        Document document = new Document();
        document.setDocumentID(2);
        document.setProject(project);
        document.setFileName("brief.pdf");
        document.setDocumentType(DocumentType.REPORT);
        document.setMimeType("application/pdf");
        document.setDocumentData(new byte[] {4, 5});
        document.setFileSize(2);
        return document;
    }
}
