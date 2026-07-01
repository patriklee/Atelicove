package com.atelicove.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

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
import com.atelicove.services.CompanyService;

@ExtendWith(MockitoExtension.class)
class CompanyServiceTest {

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private WorkOrderRepository workOrderRepository;

    @InjectMocks
    private CompanyService companyService;

    @Test
    void findAllReturnsCompaniesFromRepository() {
        List<Company> companies = List.of(new Company(), new Company());
        when(companyRepository.findAll()).thenReturn(companies);
        when(companyRepository.findByArchivedFalse()).thenReturn(companies);

        assertSame(companies, companyService.findAll());
        assertSame(companies, companyService.findActive());
        verify(companyRepository).findAll();
        verify(companyRepository).findByArchivedFalse();
    }

    @Test
    void findByIdReturnsRepositoryResult() {
        Company company = new Company();
        when(companyRepository.findById(1)).thenReturn(Optional.of(company));

        assertEquals(Optional.of(company), companyService.findById(1));
    }

    @Test
    void saveReturnsSavedCompany() {
        Company company = new Company();
        when(companyRepository.save(company)).thenReturn(company);

        assertSame(company, companyService.save(company));
    }

    @Test
    void archiveByIdMarksCompanyArchived() {
        Company company = new Company();
        company.setCompanyID(1);
        when(companyRepository.findById(1)).thenReturn(Optional.of(company));
        when(workOrderRepository.findByCompany_CompanyID(1)).thenReturn(List.of());

        companyService.archiveById(1);

        assertEquals(true, company.isArchived());
        assertNotNull(company.getArchivedAt());
        verify(companyRepository).save(company);
    }

    @Test
    void archiveByIdRejectsUnknownCompany() {
        when(companyRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> companyService.archiveById(99));
    }

    @Test
    void archiveByIdRejectsCompanyWithOpenWorkOrder() {
        Company company = new Company();
        company.setCompanyID(1);
        WorkOrder workOrder = new WorkOrder();
        workOrder.setStatus(WorkOrderStatus.IN_REVIEW);
        workOrder.setCompany(company);
        when(companyRepository.findById(1)).thenReturn(Optional.of(company));
        when(workOrderRepository.findByCompany_CompanyID(1)).thenReturn(List.of(workOrder));

        assertThrows(IllegalStateException.class, () -> companyService.archiveById(1));
        verify(companyRepository, never()).save(company);
    }

    @Test
    void restoreByIdClearsArchiveFields() {
        Company company = new Company();
        company.setArchived(true);
        when(companyRepository.findById(1)).thenReturn(Optional.of(company));
        when(companyRepository.save(company)).thenReturn(company);

        Company result = companyService.restoreById(1);

        assertSame(company, result);
        assertEquals(false, company.isArchived());
        assertEquals(null, company.getArchivedAt());
    }

    @Test
    void deletePermanentlyByIdRemovesArchivedCompanyAndDetachesWorkOrders() {
        Company company = new Company();
        company.setCompanyID(1);
        company.setArchived(true);
        WorkOrder workOrder = new WorkOrder();
        workOrder.setCompany(company);
        when(companyRepository.findById(1)).thenReturn(Optional.of(company));
        when(workOrderRepository.findAll()).thenReturn(List.of(workOrder));

        companyService.deletePermanentlyById(1);

        assertEquals(null, workOrder.getCompany());
        verify(companyRepository).delete(company);
    }

    @Test
    void deletePermanentlyByIdRejectsActiveCompany() {
        Company company = new Company();
        when(companyRepository.findById(1)).thenReturn(Optional.of(company));

        assertThrows(IllegalStateException.class, () -> companyService.deletePermanentlyById(1));
    }
}
