package com.atelicove.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.atelicove.AtelicoveApplication;

@SpringBootTest(
        classes = AtelicoveApplication.class,
        properties = {
                "spring.datasource.url=jdbc:h2:mem:security-config-test;MODE=MySQL",
                "spring.datasource.driver-class-name=org.h2.Driver",
                "spring.datasource.username=sa",
                "spring.datasource.password=",
                "spring.jpa.hibernate.ddl-auto=create-drop"
        })
@AutoConfigureMockMvc
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void passwordEncoderUsesBcrypt() {
        String encoded = passwordEncoder.encode("password123");

        assertThat(encoded).startsWith("$2");
        assertThat(passwordEncoder.matches("password123", encoded)).isTrue();
    }

    @Test
    void loginEndpointIsPublicWithAValidCsrfToken() throws Exception {
        mockMvc.perform(post("/auth/login").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"\", \"password\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message")
                        .value("Username and password are required"));
    }

    @Test
    void protectedEndpointReturnsUnauthorizedWithoutASession() throws Exception {
        mockMvc.perform(get("/companies/all"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/companies/all").with(user("worker")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/companies/all").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk());
    }

    @Test
    void mutationWithoutCsrfIsRejected() throws Exception {
        mockMvc.perform(post("/workorders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminMethodRejectsWorkerAndAllowsAdmin() throws Exception {
        mockMvc.perform(get("/workers")
                        .with(user("worker").roles("WORKER")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/workers")
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk());
    }

    @Test
    void draftStudioEndpointsAreAdminOnly() throws Exception {
        mockMvc.perform(get("/draft-projects"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/draft-projects").with(user("worker").roles("WORKER")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/draft-projects").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk());
    }
}
