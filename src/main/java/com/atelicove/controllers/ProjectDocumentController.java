package com.atelicove.controllers;

import java.security.Principal;
import java.util.List;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.atelicove.dto.DocumentDTO;
import com.atelicove.entities.Document;
import com.atelicove.enums.DocumentType;
import com.atelicove.services.WODocumentService;

@RestController
@RequestMapping("/projects/{projectID}/documents")
public class ProjectDocumentController {

    private final WODocumentService service;

    public ProjectDocumentController(WODocumentService service) {
        this.service = service;
    }

    @GetMapping
    public List<DocumentDTO> getDocuments(@PathVariable Integer projectID) {
        return service.findByProject(projectID).stream()
                .map(DocumentDTO::new)
                .toList();
    }

    @PostMapping
    public DocumentDTO uploadDocument(
            @PathVariable Integer projectID,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") DocumentType documentType,
            Principal principal) {

        return new DocumentDTO(service.uploadToProject(projectID, file, documentType, principal.getName()));
    }

    @GetMapping("/{documentID}/download")
    public ResponseEntity<ByteArrayResource> downloadDocument(
            @PathVariable Integer projectID,
            @PathVariable Integer documentID) {

        Document document = service.getRequiredProjectDocument(projectID, documentID);
        ByteArrayResource resource = new ByteArrayResource(document.getDocumentData());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(document.getMimeType()))
                .contentLength(document.getFileSize())
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(document.getFileName())
                        .build()
                        .toString())
                .body(resource);
    }

    @DeleteMapping("/{documentID}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable Integer projectID,
            @PathVariable Integer documentID,
            Principal principal) {

        service.deleteFromProject(projectID, documentID, principal.getName());
        return ResponseEntity.noContent().build();
    }
}
