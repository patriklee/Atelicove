package com.atelicove.controllers;

import com.atelicove.dto.LoginRequest;
import com.atelicove.dto.LoginResponse;
import com.atelicove.entities.Worker;
import com.atelicove.services.WorkerService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import java.util.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final WorkerService workerService;
    private final AuthenticationManager authenticationManager;
    
    public AuthController(WorkerService workerService, AuthenticationManager authenticationManager) {
        this.workerService = workerService;
        this.authenticationManager = authenticationManager;
    }

    /**
     * Returns the active worker represented by the current server session.
     *
     * @param authentication current authenticated session
     * @return the same profile shape returned by login
     */
    @GetMapping("/me")
    public ResponseEntity<LoginResponse> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return workerService.findByUsername(authentication.getName())
                .map(this::toLoginResponse)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    /**
     * Authenticates a worker, stores the Spring Security context in the HTTP
     * session, records the login time, and returns the worker profile used by the
     * frontend.
     *
     * @param req submitted username and password
     * @param request current HTTP request used to create the session
     * @return login response or an error message
     */
    @PostMapping("/login")
    public ResponseEntity<Object> login(@RequestBody LoginRequest req,HttpServletRequest request) {

        if (req.getUsername() == null ||
        		req.getUsername().isBlank() ||
        		req.getPassword() == null ||
        		req.getPassword().isBlank()) {

            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Username and password are required"));
        }

        try {
            UsernamePasswordAuthenticationToken loginToken = new UsernamePasswordAuthenticationToken(req.getUsername().trim(),
                            req.getPassword());

            Authentication authentication = authenticationManager.authenticate(loginToken);

            SecurityContext securityContext = SecurityContextHolder.createEmptyContext();

            securityContext.setAuthentication(authentication);
            SecurityContextHolder.setContext(securityContext);

            HttpSession session = request.getSession(true);

            session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,securityContext);

            Optional<Worker> result =workerService.findByUsername(authentication.getName());

            if (result.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            Worker worker = workerService.recordLogin(authentication.getName());

            return ResponseEntity.ok(toLoginResponse(worker));

        } catch (AuthenticationException exception) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message","Invalid username or password"));
        }
    }

    private LoginResponse toLoginResponse(Worker worker) {
        return new LoginResponse(
                worker.getWorkerID(),
                worker.getWorkerUser(),
                worker.getWorkerFName(),
                worker.getWorkerLName(),
                worker.getWorkerDisplayName(),
                worker.getWorkerEmail(),
                worker.getLastLoginAt(),
                worker.isAdmin());
    }
}
