package com.atelicove.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.atelicove.dto.WorkOrderDocumentDTO;
import com.atelicove.services.WODocumentService;

@RestController
public class DocumentController {

    private final WODocumentService service;

    public DocumentController(WODocumentService service) {
        this.service = service;
    }

    @GetMapping("/documents")
    public List<WorkOrderDocumentDTO> getAllDocuments() {
        return service.findAll().stream()
                .map(WorkOrderDocumentDTO::new)
                .toList();
    }
}
