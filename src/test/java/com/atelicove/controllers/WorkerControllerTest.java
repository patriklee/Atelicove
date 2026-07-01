package com.atelicove.controllers;

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
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.atelicove.controllers.WorkerController;
import com.atelicove.entities.Worker;
import com.atelicove.exceptions.GlobalExceptionHandler;
import com.atelicove.services.WorkerService;

@ExtendWith(MockitoExtension.class)
class WorkerControllerTest {

    @Mock
    private WorkerService workerService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new WorkerController(workerService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void getAllWorkersReturnsWorkers() throws Exception {
        when(workerService.findActive()).thenReturn(
                List.of(new Worker("Pat", "Lee", "plee", "plee@test.com", "hidden", true)));

        mockMvc.perform(get("/workers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].workerUser").value("plee"))
                .andExpect(jsonPath("$[0].admin").value(true))
                .andExpect(jsonPath("$[0].workerPW").doesNotExist());
    }

    @Test
    void getWorkerByIdReturnsWorkerOrNotFound() throws Exception {
        Worker worker = new Worker("Pat", "Lee", "plee", "plee@test.com", "hidden", false);
        worker.setWorkerID(1);
        when(workerService.findById(1)).thenReturn(Optional.of(worker));
        when(workerService.findById(99)).thenReturn(Optional.empty());

        mockMvc.perform(get("/workers/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workerID").value(1));
        mockMvc.perform(get("/workers/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getWorkerByUsernameReturnsWorkerOrNotFound() throws Exception {
        Worker worker = new Worker("Pat", "Lee", "plee", "plee@test.com", "hidden", false);
        when(workerService.findByUsername("plee")).thenReturn(Optional.of(worker));
        when(workerService.findByUsername("missing")).thenReturn(Optional.empty());

        mockMvc.perform(get("/workers/username/plee"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workerUser").value("plee"));
        mockMvc.perform(get("/workers/username/missing"))
                .andExpect(status().isNotFound());
    }

    @Test
    void addWorkerCreatesWorker() throws Exception {
        Worker saved = new Worker("Pat", "Lee", "plee", "plee@test.com", "encoded", false);
        saved.setWorkerID(2);
        when(workerService.createWorker(any(Worker.class))).thenReturn(saved);

        mockMvc.perform(post("/workers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "workerFName": "Pat",
                                  "workerLName": "Lee",
                                  "workerUser": "plee",
                                  "workerEmail": "plee@test.com",
                                  "workerPW": "password123",
                                  "admin": false
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workerID").value(2));
    }

    @Test
    void deleteAndResetPasswordDelegateToService() throws Exception {
        mockMvc.perform(delete("/workers/3"))
                .andExpect(status().isNoContent());
        mockMvc.perform(put("/workers/3/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newPassword\":\"new-password\"}"))
                .andExpect(status().isNoContent());

        verify(workerService).archiveById(3);
        verify(workerService).resetPassword(3, "new-password");
    }

    @Test
    void serviceValidationErrorBecomesBadRequest() throws Exception {
        when(workerService.createWorker(any(Worker.class)))
                .thenThrow(new IllegalArgumentException("Password is required"));

        mockMvc.perform(post("/workers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"workerUser\":\"plee\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Password is required"));
    }
}
