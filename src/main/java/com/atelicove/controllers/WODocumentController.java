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

import com.atelicove.dto.WorkOrderDocumentDTO;
import com.atelicove.entities.WorkOrderDocument;
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
    public List<WorkOrderDocumentDTO> getDocuments(@PathVariable Integer workOrderID) {
        return service.findByWorkOrder(workOrderID).stream()
                .map(WorkOrderDocumentDTO::new)
                .toList();
    }

    @PostMapping
    public WorkOrderDocumentDTO uploadDocument(
            @PathVariable Integer workOrderID,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") DocumentType documentType,
            Principal principal) {

        return new WorkOrderDocumentDTO(service.upload(workOrderID, file, documentType, principal.getName()));
    }

    @GetMapping("/{documentID}/download")
    public ResponseEntity<ByteArrayResource> downloadDocument(
            @PathVariable Integer workOrderID,
            @PathVariable Integer documentID) {

        WorkOrderDocument document = service.getRequiredDocument(workOrderID, documentID);
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
            @PathVariable Integer documentID) {

        service.deleteFromWorkOrder(workOrderID, documentID);
        return ResponseEntity.noContent().build();
    }
}
