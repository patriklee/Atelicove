package com.atelicove.repositories;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.atelicove.entities.Company;
import com.atelicove.repositories.CompanyRepository;

@DataJpaTest
class CompanyRepositoryTest {

    @Autowired
    private CompanyRepository companyRepository;

    @Test
    void saveAndFindByIdPersistsCompany() {
        Company company = new Company(
                "Acme Services", "100 Main Street", "555-0100", "office@acme.test");

        Company saved = companyRepository.saveAndFlush(company);

        assertThat(saved.getCompanyID()).isPositive();
        assertThat(companyRepository.findById(saved.getCompanyID()))
                .containsSame(saved);
    }

    @Test
    void deleteByIdRemovesCompany() {
        Company saved = companyRepository.saveAndFlush(
                new Company("Acme", "100 Main Street", "555-0100", "office@acme.test"));

        companyRepository.deleteById(saved.getCompanyID());
        companyRepository.flush();

        assertThat(companyRepository.findById(saved.getCompanyID())).isEmpty();
    }
}
