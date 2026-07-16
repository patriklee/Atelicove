package com.atelicove.services;

import static com.atelicove.support.TestFixtures.ITEM_ID;
import static com.atelicove.support.TestFixtures.aWorkOrderItem;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessResourceFailureException;

import com.atelicove.entities.WorkOrderItem;
import com.atelicove.repositories.WOItemRepository;

@ExtendWith(MockitoExtension.class)
class WOItemServiceTest {

    @Mock private WOItemRepository repository;
    @InjectMocks private WOItemService service;

    @Nested
    class Queries {

        @Test
        void findAllAndFindById_ShouldReturnExactRepositoryResults() {
            // Given
            WorkOrderItem item = aWorkOrderItem().build();
            List<WorkOrderItem> items = List.of(item);
            when(repository.findAll()).thenReturn(items);
            when(repository.findById(ITEM_ID)).thenReturn(Optional.of(item));

            // When / Then
            assertThat(service.findAll()).isSameAs(items);
            assertThat(service.findById(ITEM_ID)).containsSame(item);
        }

        @Test
        void findById_ShouldReturnEmpty_WhenItemDoesNotExist() {
            // Given
            when(repository.findById(ITEM_ID)).thenReturn(Optional.empty());

            // When / Then
            assertThat(service.findById(ITEM_ID)).isEmpty();
        }
    }

    @Nested
    class Mutations {

        @Test
        void save_ShouldReturnPersistedItem() {
            // Given
            WorkOrderItem item = aWorkOrderItem().build();
            when(repository.save(item)).thenReturn(item);

            // When
            WorkOrderItem result = service.save(item);

            // Then
            assertThat(result).isSameAs(item);
            verify(repository).save(item);
        }

        @Test
        void deleteById_ShouldDelegateExactlyOnce() {
            // When
            service.deleteById(ITEM_ID);

            // Then
            verify(repository).deleteById(ITEM_ID);
        }

        @Test
        void mutations_ShouldPropagateRepositoryFailures() {
            // Given
            WorkOrderItem item = aWorkOrderItem().build();
            DataAccessResourceFailureException failure = new DataAccessResourceFailureException("database unavailable");
            when(repository.save(item)).thenThrow(failure);
            org.mockito.Mockito.doThrow(failure).when(repository).deleteById(ITEM_ID);

            // When / Then
            assertThatThrownBy(() -> service.save(item)).isSameAs(failure);
            assertThatThrownBy(() -> service.deleteById(ITEM_ID)).isSameAs(failure);
        }
    }
}
