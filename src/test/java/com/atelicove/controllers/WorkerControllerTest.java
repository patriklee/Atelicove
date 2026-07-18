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
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;

import com.atelicove.controllers.WorkerController;
import com.atelicove.entities.Worker;
import com.atelicove.mappers.WorkerMapper;
import com.atelicove.services.WorkerService;
import com.atelicove.services.AuthorizationService;

@ExtendWith(MockitoExtension.class)
class WorkerControllerTest {

    @Mock
    private WorkerService workerService;
    @Mock private AuthorizationService authorizationService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = mockMvcFor(new WorkerController(workerService, authorizationService, new WorkerMapper()));
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
    void getCurrentWorkerReturnsAuthenticatedSafeProfile() throws Exception {
        Worker worker = new Worker("Pat", "Lee", "plee", "plee@test.com", "encoded-secret", false);
        worker.setWorkerID(1);
        when(authorizationService.currentWorker(any())).thenReturn(worker);

        mockMvc.perform(get("/workers/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workerID").value(1))
                .andExpect(jsonPath("$.workerUser").value("plee"))
                .andExpect(jsonPath("$.workerPW").doesNotExist())
                .andExpect(jsonPath("$.workOrders").doesNotExist());
    }

    @Test
    void workerCannotReadAnotherWorkerProfile() throws Exception {
        org.mockito.Mockito.doThrow(new AccessDeniedException("Only your own worker account can be accessed"))
                .when(authorizationService).requireOwnWorkerOrAdmin(org.mockito.ArgumentMatchers.eq(2), any());

        mockMvc.perform(get("/workers/2"))
                .andExpect(status().isForbidden());

        verify(workerService, org.mockito.Mockito.never()).findById(2);
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
                .andExpect(jsonPath("$.workerID").value(2))
                .andExpect(jsonPath("$.workerPW").doesNotExist());
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
    void invalidEmailReturnsBadRequestBeforeServiceCall() throws Exception {
        mockMvc.perform(post("/workers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "workerFName":"Pat", "workerLName":"Lee",
                                  "workerUser":"plee", "workerEmail":"not-an-email",
                                  "workerPW":"password123", "admin":false
                                }
                                """))
                .andExpect(status().isBadRequest());

        verify(workerService, org.mockito.Mockito.never()).createWorker(any());
    }

    @Test
    void remainingWorkerEndpoints_ShouldReturnArchivedUpdateProfileRestoreAndPermanentDelete() throws Exception {
        Worker worker = new Worker("Pat", "Lee", "plee", "plee@test.com", "hidden", false);
        worker.setWorkerID(3);
        when(workerService.findAll()).thenReturn(List.of(worker));
        when(workerService.findArchived()).thenReturn(List.of(worker));
        when(workerService.updateWorker(any(Integer.class), any(Worker.class))).thenReturn(worker);
        when(workerService.updateProfile(any(Integer.class), any(Worker.class))).thenReturn(worker);
        when(workerService.restoreById(3)).thenReturn(worker);

        mockMvc.perform(get("/workers/all-with-archived")).andExpect(status().isOk()).andExpect(jsonPath("$[0].workerID").value(3));
        mockMvc.perform(get("/workers/archived")).andExpect(status().isOk());
        mockMvc.perform(put("/workers/3").contentType(MediaType.APPLICATION_JSON).content("""
                {"workerFName":"Pat","workerLName":"Lee","workerUser":"plee",
                 "workerEmail":"plee@test.com","admin":false}
                """))
                .andExpect(status().isOk()).andExpect(jsonPath("$.workerID").value(3));
        mockMvc.perform(put("/workers/3/profile").contentType(MediaType.APPLICATION_JSON).content("""
                {"workerFName":"Pat","workerLName":"Lee","workerEmail":"plee@test.com"}
                """))
                .andExpect(status().isOk());
        mockMvc.perform(put("/workers/3/restore")).andExpect(status().isOk());
        mockMvc.perform(delete("/workers/3/permanent")).andExpect(status().isNoContent());
        verify(authorizationService).requireOwnWorkerOrAdmin(org.mockito.ArgumentMatchers.eq(3), any());
        verify(workerService).deletePermanentlyById(3);
    }

    @Test
    void profileRequestCannotChangeAdminOrArchiveState() throws Exception {
        when(workerService.updateProfile(org.mockito.ArgumentMatchers.eq(3), any(Worker.class)))
                .thenAnswer(invocation -> invocation.getArgument(1));

        mockMvc.perform(put("/workers/3/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "workerFName":"Pat", "workerLName":"Lee",
                                  "workerEmail":"plee@test.com", "admin":true,
                                  "archived":true, "workerUser":"changed", "workerPW":"plain-text"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.admin").value(false))
                .andExpect(jsonPath("$.archived").value(false))
                .andExpect(jsonPath("$.workerUser").isEmpty())
                .andExpect(jsonPath("$.workerPW").doesNotExist());

        ArgumentCaptor<Worker> requestCaptor = ArgumentCaptor.forClass(Worker.class);
        verify(workerService).updateProfile(org.mockito.ArgumentMatchers.eq(3), requestCaptor.capture());
        org.assertj.core.api.Assertions.assertThat(requestCaptor.getValue().isAdmin()).isFalse();
        org.assertj.core.api.Assertions.assertThat(requestCaptor.getValue().isArchived()).isFalse();
        org.assertj.core.api.Assertions.assertThat(requestCaptor.getValue().getWorkerUser()).isNull();
        org.assertj.core.api.Assertions.assertThat(requestCaptor.getValue().getWorkerPW()).isNull();
    }
}
