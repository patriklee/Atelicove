package com.atelicove.controllers;

import static com.atelicove.support.ControllerTestSupport.mockMvcFor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.atelicove.controllers.CompanyController;
import com.atelicove.entities.Company;
import com.atelicove.services.CompanyService;

@ExtendWith(MockitoExtension.class)
class CompanyControllerTest {

    @Mock
    private CompanyService companyService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = mockMvcFor(new CompanyController(companyService));
    }

    @Test
    void getAllCompaniesReturnsCompanies() throws Exception {
        when(companyService.findActive()).thenReturn(List.of(
                new Company("Acme", "100 Main", "555-0100", "office@acme.test")));

        mockMvc.perform(get("/companies/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].companyName").value("Acme"));
    }

    @Test
    void addCompanySavesRequestBody() throws Exception {
        Company saved = new Company("Acme", "100 Main", "555-0100", "office@acme.test");
        saved.setCompanyID(1);
        when(companyService.save(any(Company.class))).thenReturn(saved);

        mockMvc.perform(post("/companies/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "companyName": "Acme",
                                  "companyAddress": "100 Main",
                                  "companyPhone": "555-0100",
                                  "companyEmail": "office@acme.test"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyID").value(1))
                .andExpect(jsonPath("$.companyName").value("Acme"));
    }

    @Test
    void updateCompanyUsesPathId() throws Exception {
        Company updated = new Company("Updated", null, null, null);
        updated.setCompanyID(7);
        when(companyService.update(any(Integer.class), any(Company.class))).thenReturn(updated);

        mockMvc.perform(put("/companies/7")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"companyID": 99, "companyName": "Updated"}
                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyID").value(7));

        verify(companyService).update(any(Integer.class), any(Company.class));
    }

    @Test
    void deleteCompanyArchivesThroughService() throws Exception {
        mockMvc.perform(delete("/companies/4"))
                .andExpect(status().isNoContent());

        verify(companyService).archiveById(4);
    }

    @Test
    void remainingCompanyEndpoints_ShouldReturnCollectionsRestoreAndDeletePermanently() throws Exception {
        Company active = new Company("Active", null, null, null);
        Company archived = new Company("Archived", null, null, null);
        archived.setArchived(true);
        when(companyService.findActive()).thenReturn(List.of(active));
        when(companyService.findAll()).thenReturn(List.of(active, archived));
        when(companyService.findArchived()).thenReturn(List.of(archived));
        when(companyService.restoreById(2)).thenReturn(active);

        mockMvc.perform(get("/companies")).andExpect(status().isOk()).andExpect(jsonPath("$[0].companyName").value("Active"));
        mockMvc.perform(get("/companies/all-with-archived")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2));
        mockMvc.perform(get("/companies/archived")).andExpect(status().isOk()).andExpect(jsonPath("$[0].archived").value(true));
        mockMvc.perform(put("/companies/2/restore")).andExpect(status().isOk()).andExpect(jsonPath("$.companyName").value("Active"));
        mockMvc.perform(delete("/companies/2/permanent")).andExpect(status().isNoContent());
        verify(companyService).deletePermanentlyById(2);
    }
}
