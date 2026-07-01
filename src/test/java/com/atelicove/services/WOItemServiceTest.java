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

import com.atelicove.entities.WorkOrderItem;
import com.atelicove.repositories.WOItemRepository;
import com.atelicove.services.WOItemService;

@ExtendWith(MockitoExtension.class)
class WOItemServiceTest {

    @Mock
    private WOItemRepository repository;

    @InjectMocks
    private WOItemService service;

    @Test
    void findAllReturnsItemsFromRepository() {
        List<WorkOrderItem> items = List.of(new WorkOrderItem(), new WorkOrderItem());
        when(repository.findAll()).thenReturn(items);

        assertSame(items, service.findAll());
    }

    @Test
    void findByIdReturnsRepositoryResult() {
        WorkOrderItem item = new WorkOrderItem();
        when(repository.findById(1)).thenReturn(Optional.of(item));

        assertEquals(Optional.of(item), service.findById(1));
    }

    @Test
    void saveReturnsSavedItem() {
        WorkOrderItem item = new WorkOrderItem();
        when(repository.save(item)).thenReturn(item);

        assertSame(item, service.save(item));
    }

    @Test
    void deleteByIdDelegatesToRepository() {
        service.deleteById(1);

        verify(repository).deleteById(1);
    }
}
