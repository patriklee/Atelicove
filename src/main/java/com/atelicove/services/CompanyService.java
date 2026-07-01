package com.atelicove.services;

import java.time.LocalDateTime;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.atelicove.entities.Company;
import com.atelicove.entities.WorkOrder;
import com.atelicove.enums.WorkOrderStatus;
import com.atelicove.repositories.CompanyRepository;
import com.atelicove.repositories.WorkOrderRepository;

@Service
public class CompanyService{

	 private final CompanyRepository companyRepository;
	 private final WorkOrderRepository workOrderRepository;

	    public CompanyService(CompanyRepository companyRepository, WorkOrderRepository workOrderRepository) {
	        this.companyRepository = companyRepository;
	        this.workOrderRepository = workOrderRepository;
	    }

	    public List<Company> findActive() {
	        return companyRepository.findByArchivedFalse();
	    }

	    public List<Company> findAll() {
	        return companyRepository.findAll();
	    }

	    public List<Company> findArchived() {
	        return companyRepository.findByArchivedTrue();
	    }

	    public Optional<Company> findById(Integer id) {
	        return companyRepository.findById(id);
	    }

	    public Company save(Company company) {
	        company.setArchived(false);
	        company.setArchivedAt(null);
	        return companyRepository.save(company);
	    }

	    @Transactional
	    public Company update(Integer id, Company request) {
	        Company company = companyRepository.findById(id)
	                .orElseThrow(() -> new IllegalArgumentException("Company not found"));

	        company.setCompanyName(request.getCompanyName());
	        company.setCompanyAddress(request.getCompanyAddress());
	        company.setCompanyPhone(request.getCompanyPhone());
	        company.setCompanyEmail(request.getCompanyEmail());

	        return companyRepository.save(company);
	    }

	    @Transactional
	    public void archiveById(Integer id) {
	        Company company = companyRepository.findById(id)
	                .orElseThrow(() -> new IllegalArgumentException("Company not found"));
	        boolean hasOpenWorkOrders = workOrderRepository.findByCompany_CompanyID(company.getCompanyID())
	                .stream()
	                .anyMatch(workOrder -> workOrder.getStatus() != WorkOrderStatus.COMPLETE);

	        if (hasOpenWorkOrders) {
	            throw new IllegalStateException("Company cannot be archived while associated with open work orders");
	        }

	        company.setArchived(true);
	        company.setArchivedAt(LocalDateTime.now());
	        companyRepository.save(company);
	    }

	    @Transactional
	    public Company restoreById(Integer id) {
	        Company company = companyRepository.findById(id)
	                .orElseThrow(() -> new IllegalArgumentException("Company not found"));
	        company.setArchived(false);
	        company.setArchivedAt(null);
	        return companyRepository.save(company);
	    }

	    @Transactional
	    public void deletePermanentlyById(Integer id) {
	        Company company = companyRepository.findById(id)
	                .orElseThrow(() -> new IllegalArgumentException("Company not found"));

	        if (company.isArchived()) {
	            throw new IllegalStateException("Archived companies can only be restored");
	        }

	        if (!workOrderRepository.findByCompany_CompanyID(company.getCompanyID()).isEmpty()) {
	            throw new IllegalStateException("Company cannot be permanently deleted while work orders are attached");
	        }

	        companyRepository.delete(company);
	    }
}
