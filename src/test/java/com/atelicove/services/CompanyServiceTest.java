package com.atelicove.services;

import static com.atelicove.support.TestFixtures.COMPANY_ID;
import static com.atelicove.support.TestFixtures.aCompany;
import static com.atelicove.support.TestFixtures.aWorkOrder;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
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

import com.atelicove.entities.Company;
import com.atelicove.entities.WorkOrder;
import com.atelicove.enums.WorkOrderStatus;
import com.atelicove.repositories.CompanyRepository;
import com.atelicove.repositories.WorkOrderRepository;

@ExtendWith(MockitoExtension.class)
class CompanyServiceTest {

    @Mock private CompanyRepository companyRepository;
    @Mock private WorkOrderRepository workOrderRepository;
    @InjectMocks private CompanyService service;

    @Nested
    class Queries {

        @Test
        void queryMethods_ShouldReturnTheExactRepositoryResults() {
            // Given
            Company company = aCompany().build();
            List<Company> companies = List.of(company);
            when(companyRepository.findByArchivedFalse()).thenReturn(companies);
            when(companyRepository.findAll()).thenReturn(companies);
            when(companyRepository.findByArchivedTrue()).thenReturn(companies);
            when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.of(company));

            // When / Then
            assertThat(service.findActive()).isSameAs(companies);
            assertThat(service.findAll()).isSameAs(companies);
            assertThat(service.findArchived()).isSameAs(companies);
            assertThat(service.findById(COMPANY_ID)).containsSame(company);
        }
    }

    @Nested
    class SaveAndUpdate {

        @Test
        void save_ShouldResetArchiveMetadataBeforePersisting() {
            // Given
            Company company = aCompany().archived().build();
            when(companyRepository.save(company)).thenReturn(company);

            // When
            Company result = service.save(company);

            // Then
            assertThat(result).isSameAs(company);
            assertThat(company.isArchived()).isFalse();
            assertThat(company.getArchivedAt()).isNull();
            verify(companyRepository).save(company);
        }

        @Test
        void update_ShouldCopyEditableFields_WhenCompanyExists() {
            // Given
            Company existing = aCompany().build();
            Company request = new Company("Updated", "200 State", "555-0200", "updated@test.com");
            when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.of(existing));
            when(companyRepository.save(existing)).thenReturn(existing);

            // When
            Company result = service.update(COMPANY_ID, request);

            // Then
            assertThat(result).isSameAs(existing);
            assertThat(existing).extracting(
                    Company::getCompanyName,
                    Company::getCompanyAddress,
                    Company::getCompanyPhone,
                    Company::getCompanyEmail)
                    .containsExactly("Updated", "200 State", "555-0200", "updated@test.com");
        }

        @Test
        void update_ShouldRejectUnknownCompany() {
            // Given
            when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> service.update(COMPANY_ID, aCompany().build()))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Company not found");
            verify(companyRepository, never()).save(org.mockito.ArgumentMatchers.any());
        }
    }

    @Nested
    class ArchiveAndRestore {

        @Test
        void archiveById_ShouldArchiveCompany_WhenAllAttachedOrdersAreComplete() {
            // Given
            Company company = aCompany().build();
            WorkOrder completed = aWorkOrder().withStatus(WorkOrderStatus.COMPLETE).forCompany(company).build();
            when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.of(company));
            when(workOrderRepository.findByCompany_CompanyID(COMPANY_ID)).thenReturn(List.of(completed));

            // When
            service.archiveById(COMPANY_ID);

            // Then
            assertThat(company.isArchived()).isTrue();
            assertThat(company.getArchivedAt()).isNotNull();
            assertThat(completed.getCompany()).isSameAs(company);
            verify(companyRepository).save(company);
        }

        @Test
        void archiveById_ShouldRejectUnknownCompanyOrUnfinishedOrder() {
            // Given
            when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> service.archiveById(COMPANY_ID))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Company not found");

            // Given
            Company company = aCompany().build();
            when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.of(company));
            when(workOrderRepository.findByCompany_CompanyID(COMPANY_ID))
                    .thenReturn(List.of(aWorkOrder().withStatus(WorkOrderStatus.ACTIVE).build()));

            // When / Then
            assertThatThrownBy(() -> service.archiveById(COMPANY_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Company cannot be archived while associated with open work orders");
            verify(companyRepository, never()).save(company);
        }

        @Test
        void restoreById_ShouldClearArchiveMetadata_WhenCompanyExists() {
            // Given
            Company company = aCompany().archived().build();
            when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.of(company));
            when(companyRepository.save(company)).thenReturn(company);

            // When
            Company result = service.restoreById(COMPANY_ID);

            // Then
            assertThat(result).isSameAs(company);
            assertThat(company.isArchived()).isFalse();
            assertThat(company.getArchivedAt()).isNull();
        }

        @Test
        void restoreById_ShouldRejectUnknownCompany() {
            // Given
            when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> service.restoreById(COMPANY_ID))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Company not found");
        }
    }

    @Nested
    class PermanentDelete {

        @Test
        void deletePermanentlyById_ShouldDeleteActiveCompanyWithoutHistory() {
            // Given
            Company company = aCompany().build();
            when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.of(company));
            when(workOrderRepository.findByCompany_CompanyID(COMPANY_ID)).thenReturn(List.of());

            // When
            service.deletePermanentlyById(COMPANY_ID);

            // Then
            verify(companyRepository).delete(company);
        }

        @Test
        void deletePermanentlyById_ShouldRejectUnknownArchivedOrHistoricalCompany() {
            // Given
            when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> service.deletePermanentlyById(COMPANY_ID))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Company not found");

            // Given
            Company archived = aCompany().archived().build();
            when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.of(archived));

            // When / Then
            assertThatThrownBy(() -> service.deletePermanentlyById(COMPANY_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Archived companies can only be restored");

            // Given
            Company active = aCompany().build();
            when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.of(active));
            when(workOrderRepository.findByCompany_CompanyID(COMPANY_ID))
                    .thenReturn(List.of(aWorkOrder().forCompany(active).build()));

            // When / Then
            assertThatThrownBy(() -> service.deletePermanentlyById(COMPANY_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Company cannot be permanently deleted while work orders are attached");
            verify(companyRepository, never()).delete(org.mockito.ArgumentMatchers.any());
        }
    }
}
