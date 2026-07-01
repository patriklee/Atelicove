package com.atelicove.entities;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import com.atelicove.entities.Company;

class CompanyTest {

    @Test
    void constructorSetsCompanyDetails() {
        Company company = new Company(
                "Acme Plumbing", "123 Main Street", "555-0100", "office@acme.test");

        assertAll(
                () -> assertEquals("Acme Plumbing", company.getCompanyName()),
                () -> assertEquals("123 Main Street", company.getCompanyAddress()),
                () -> assertEquals("555-0100", company.getCompanyPhone()),
                () -> assertEquals("office@acme.test", company.getCompanyEmail()));
    }

    @Test
    void settersUpdateCompanyDetails() {
        Company company = new Company();

        company.setCompanyID(10);
        company.setCompanyName("Updated Company");
        company.setCompanyAddress("456 Oak Avenue");
        company.setCompanyPhone("555-0200");
        company.setCompanyEmail("updated@company.test");

        assertAll(
                () -> assertEquals(10, company.getCompanyID()),
                () -> assertEquals("Updated Company", company.getCompanyName()),
                () -> assertEquals("456 Oak Avenue", company.getCompanyAddress()),
                () -> assertEquals("555-0200", company.getCompanyPhone()),
                () -> assertEquals("updated@company.test", company.getCompanyEmail()));
    }
}
