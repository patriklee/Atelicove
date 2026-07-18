package com.atelicove.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.atelicove.AtelicoveApplication;
import com.atelicove.entities.Worker;
import com.atelicove.repositories.WorkerRepository;

@SpringBootTest(
        classes = AtelicoveApplication.class,
        properties = {
                "spring.datasource.url=jdbc:h2:mem:session-security-test;MODE=MySQL",
                "spring.datasource.driver-class-name=org.h2.Driver",
                "spring.datasource.username=sa",
                "spring.datasource.password=",
                "spring.jpa.hibernate.ddl-auto=create-drop"
        })
@AutoConfigureMockMvc
class SessionSecurityStabilizationTest {

    @Autowired MockMvc mockMvc;
    @Autowired WorkerRepository workerRepository;
    @Autowired PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUpWorker() {
        workerRepository.deleteAll();
        Worker worker = new Worker(
                "Pat", "Lee", "plee", "plee@atelicove.test",
                passwordEncoder.encode("password123"), true);
        workerRepository.save(worker);
    }

    @Test
    void loginSucceedsAndCreatesAuthenticatedSession() throws Exception {
        MvcResult result = login();

        result.getResponse();
        MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
        assertThat(session).isNotNull();
        assertThat(session.getAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY)).isNotNull();
    }

    @Test
    void authenticatedSessionAccessesMe() throws Exception {
        MockHttpSession session = (MockHttpSession) login().getRequest().getSession(false);

        mockMvc.perform(get("/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workerUser").value("plee"))
                .andExpect(jsonPath("$.admin").value(true))
                .andExpect(jsonPath("$.workerPW").doesNotExist())
                .andExpect(jsonPath("$.workOrders").doesNotExist());
    }

    @Test
    void unauthenticatedMeReturnsUnauthorizedAndIssuesSpaCsrfCookie() throws Exception {
        mockMvc.perform(get("/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(cookie().exists("XSRF-TOKEN"))
                .andExpect(cookie().httpOnly("XSRF-TOKEN", false));
    }

    @Test
    void logoutInvalidatesSessionClearsCookieAndLeavesMeUnauthorized() throws Exception {
        MockHttpSession session = (MockHttpSession) login().getRequest().getSession(false);

        mockMvc.perform(post("/auth/logout").session(session).with(csrf()))
                .andExpect(status().isNoContent())
                .andExpect(cookie().maxAge("JSESSIONID", 0));

        assertThat(session.isInvalid()).isTrue();
        mockMvc.perform(get("/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void modifyingRequestRequiresValidCsrfToken() throws Exception {
        mockMvc.perform(post("/auth/logout").with(user("admin").roles("ADMIN")))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/auth/logout")
                        .with(user("admin").roles("ADMIN"))
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    private MvcResult login() throws Exception {
        return mockMvc.perform(post("/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"plee\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workerUser").value("plee"))
                .andExpect(request().sessionAttribute(
                        HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                        org.hamcrest.Matchers.notNullValue()))
                .andReturn();
    }
}
