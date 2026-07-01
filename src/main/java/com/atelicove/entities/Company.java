package com.atelicove.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "company")
public class Company extends ArchivableEntity {
	
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) //AutoGenerates an ID
	private int companyID;
    
	private String companyName;
	private String companyAddress;
	private String companyPhone;
	private String companyEmail;

	public Company() {}

	public Company(String companyName, String companyAddress, String companyPhone, String companyEmail) 
	{
		// CompanyID is automatically generated to allow many-to-one relations with the work order.
		this.companyName = companyName;
		this.companyAddress = companyAddress;
		this.companyPhone = companyPhone;
		this.companyEmail = companyEmail;
	}

	public int getCompanyID() {
		return companyID;
	}

	public String getCompanyName() {
		return companyName;
	}

	public String getCompanyAddress() {
		return companyAddress;
	}

	public String getCompanyPhone() {
		return companyPhone;
	}

	public String getCompanyEmail() {
        return companyEmail;
    }

	public void setCompanyID(int companyID) {
		this.companyID = companyID;
	}
	
	public void setCompanyName(String companyName) {
		this.companyName = companyName;
	}
	
	public void setCompanyAddress(String companyAddress) {
		this.companyAddress = companyAddress;
	}
	
	public void setCompanyPhone(String companyPhone) {
		this.companyPhone = companyPhone;
	}
	
	public void setCompanyEmail(String companyEmail) {
		this.companyEmail = companyEmail;
	}

}
