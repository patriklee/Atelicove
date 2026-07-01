package com.atelicove.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.atelicove.entities.WorkOrderDocument;
import com.atelicove.repositories.WODocumentRepository;
import com.atelicove.services.WODocumentService;

@ExtendWith(MockitoExtension.class)
class WODocumentServiceTest {

    @Mock
    private WODocumentRepository repository;

    @InjectMocks
    private WODocumentService service;

    @Test
    void findAllReturnsDocumentsFromRepository() {
        List<WorkOrderDocument> documents =
                List.of(new WorkOrderDocument(), new WorkOrderDocument());
        when(repository.findAll()).thenReturn(documents);

        assertSame(documents, service.findAll());
    }

    @Test
    void findByIdReturnsRepositoryResult() {
        WorkOrderDocument document = new WorkOrderDocument();
        when(repository.findById(1)).thenReturn(Optional.of(document));

        assertEquals(Optional.of(document), service.findById(1));
    }

    @Test
    void saveReturnsSavedDocument() {
        WorkOrderDocument document = new WorkOrderDocument();
        when(repository.save(document)).thenReturn(document);

        assertSame(document, service.save(document));
    }

    @Test
    void deleteByIdDelegatesToRepository() {
        service.deleteById(1);

        verify(repository).deleteById(1);
    }
}
