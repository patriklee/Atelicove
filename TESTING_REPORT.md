# Atelicove Community Edition Backend Testing Report

## Latest result

The consolidated Community Edition backend suite was verified on July 18, 2026 with:

```text
Tests run: 76, Failures: 0, Errors: 0, Skipped: 0
Test suites: 15
```

Command used:

```bash
mvn clean test
```

The Maven build completed successfully. JaCoCo also generated its HTML report at
`target/site/jacoco/index.html`; this report does not claim a coverage percentage.

## Scope represented by the current suite

The suite focuses on Community Edition release-critical behavior. It does not claim
complete application or branch coverage.

### Integration coverage

- Spring application context startup and persistence wiring.
- CORS, session-security, and Spring Security behavior through `MockMvc` with the
  application context.
- H2-backed JPA relationship persistence for work orders, items, workers, and
  companies.

H2 is used for test database coverage. MySQL-specific behavior is not established by
these tests.

### Controller and security coverage

- Work-order request validation and response behavior.
- Work-order document upload, download, lookup, and deletion responses.
- Global exception response mapping.
- Authentication boundaries, CSRF handling, session creation, logout, request-cache
  behavior, CORS, and protected-route behavior.
- Worker user-details lookup and mapping.

### Service coverage

- Work-order creation, lookup, updates, assignments, item changes, and protected-state
  behavior.
- Work-order request validation and mapping.
- Document validation, authorization, lookup, storage, and deletion behavior.
- Authorization decisions and worker API boundary behavior.
- Historical deletion safeguards for protected business records.

### Repository coverage

- H2-backed persistence of work-order relationships and orphan-removal behavior.

## Test suites

The 15 executed test classes are:

- `AtelicoveApplicationTest`
- `CorsConfigTest`
- `SecurityConfigTest`
- `SessionSecurityStabilizationTest`
- `WorkerUserDetailsServiceTest`
- `WODocumentControllerTest`
- `WorkOrderControllerTest`
- `GlobalExceptionHandlerTest`
- `WorkOrderRelationshipPersistenceTest`
- `AuthorizationServiceTest`
- `HistoricalDeletionSafeguardsTest`
- `WODocumentServiceTest`
- `WorkerApiBoundaryTest`
- `WorkOrderRequestServiceTest`
- `WorkOrderServiceTest`

`ControllerTestSupport` is shared test infrastructure and is not an executed test
suite.

## Result summary

| Metric | Result |
| --- | ---: |
| Tests | 76 |
| Test suites | 15 |
| Failures | 0 |
| Errors | 0 |
| Skipped | 0 |
