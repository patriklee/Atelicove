package com.atelicove.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.atelicove.entities.WorkOrder;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, Integer> {
	List<WorkOrder> findByArchivedFalse();
	List<WorkOrder> findByArchivedTrue();
	List<WorkOrder> findByCompany_CompanyID(Integer companyID);
	List<WorkOrder> findByCompany_CompanyIDAndArchivedFalse(Integer companyID);
	long countByArchivedFalse();
}
