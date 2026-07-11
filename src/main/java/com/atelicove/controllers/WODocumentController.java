package com.atelicove.controllers;

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
import org.springframework.security.core.Authentication;

import com.atelicove.dto.DocumentDTO;
import com.atelicove.entities.Document;
import com.atelicove.enums.DocumentType;
import com.atelicove.services.WODocumentService;

@RestController
@RequestMapping("/workorders/{workOrderID}/documents")
public class WODocumentController {

    private final WODocumentService service;

    public WODocumentController(WODocumentService service) {
        this.service = service;
    }

    @GetMapping
    public List<DocumentDTO> getDocuments(@PathVariable Integer workOrderID, Authentication authentication) {
        return service.findByWorkOrder(workOrderID, authentication).stream()
                .map(DocumentDTO::new)
                .toList();
    }

    /**
     * Accepts a multipart document upload for the current work order and tags the
     * saved file with the authenticated uploader.
     *
     * @param workOrderID work order receiving the document
     * @param file uploaded file
     * @param documentType selected document category
     * @param principal authenticated user
     * @return document metadata without the raw file bytes
     */
    @PostMapping
    public DocumentDTO uploadDocument(
            @PathVariable Integer workOrderID,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") DocumentType documentType,
            Authentication authentication) {

        return new DocumentDTO(service.upload(workOrderID, file, documentType, authentication));
    }

    /**
     * Streams a stored document back to the browser with its original filename,
     * content type, and size.
     *
     * @param workOrderID work order that owns the document
     * @param documentID document to download
     * @return downloadable file response
     */
    @GetMapping("/{documentID}/download")
    public ResponseEntity<ByteArrayResource> downloadDocument(
            @PathVariable Integer workOrderID,
            @PathVariable Integer documentID, Authentication authentication) {

        Document document = service.getRequiredDocument(workOrderID, documentID, authentication);
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
            @PathVariable Integer workOrderID,
            @PathVariable Integer documentID, Authentication authentication) {

        service.deleteFromWorkOrder(workOrderID, documentID, authentication);
        return ResponseEntity.noContent().build();
    }
}
