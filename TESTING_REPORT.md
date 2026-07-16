# Atelicove Backend Testing Report

## Outcome

The backend JUnit suite was audited and refactored into a behavior-oriented, enterprise testing style. The final clean Maven run on July 16, 2026 completed with **277 JUnit 5 test cases, zero failures, and zero errors**.

No production Java source or production behavior was changed.

The suite now uses:

- Given / When / Then structure for the refactored behavior specifications.
- `@Nested` classes to group service behavior by query, creation, lifecycle, assignment, collaboration, and deletion concerns.
- Parameterized tests for equivalent validation boundaries.
- AssertJ exception assertions that verify both exception type and business-facing message.
- Shared fluent domain builders in `TestFixtures`.
- A shared standalone `MockMvc` harness in `ControllerTestSupport`.
- Repository interaction and invocation-count verification for service side effects.
- JaCoCo reporting as part of `mvn test`.

The generated HTML coverage report is available at `target/site/jacoco/index.html` after a test run.

## Measured coverage

| Scope | Before enterprise refactor | Final instruction coverage | Final branch coverage | Requested target |
| --- | ---: | ---: | ---: | ---: |
| Controllers | 98.37% | **98.37%** | **80.00%** | 90%+ |
| Services | 52.50% | **89.58%** | **70.82%** | 95%+ |
| Overall | 63.33% | **86.38%** | **65.04%** | 85%+ branches |

The refactor improved service instruction coverage by **37.08 percentage points** and overall instruction coverage by **23.05 points**. The requested service and overall branch thresholds are not met. The remaining gaps are documented rather than filled with low-value coverage-only tests, in keeping with the requirement to prioritize readability and behavior documentation.

## Audit findings and corrections

- Replaced duplicated entity construction with isolated, fluent fixture builders.
- Replaced repeated standalone MVC configuration with one controller test harness and consistent global exception translation.
- Grouped service specifications by public behavior using nested test classes.
- Added happy-path, validation-path, missing-resource, protected-state, and repository-failure coverage across public service APIs.
- Added exact exception-message assertions for lifecycle, assignment, validation, authorization, and immutable-state failures.
- Added parameterized boundary tests for invalid profiles, passwords, project names, draft items, staffing requests, and upload MIME/extension combinations.
- Added comprehensive work-order draft-item, archive/restore, assignment, item mutation, and query behavior tests.
- Added comprehensive project lifecycle, relationship, comment, action-item, snapshot, and DTO synchronization tests.
- Added comprehensive document parent, authorization, upload restriction, read-failure, mutability, lookup, and deletion tests.
- Corrected stale test expectations around archive/restore/permanent-delete rules without changing production behavior.
- Removed inherited-CRUD repository tests and retained only custom-query, relationship, database-constraint, and optimistic-lock behavior.
- Replaced floating-point monetary assertions with `BigDecimal` assertions.
- Kept tests deterministic by using fresh fixture graphs, fixed constants, mocked persistence identifiers, and relative-time assertions only where timestamps are production-generated.

## Files added

- `src/test/java/com/atelicove/support/TestFixtures.java`
- `src/test/java/com/atelicove/support/ControllerTestSupport.java`
- `src/test/java/com/atelicove/controllers/DocumentControllerTest.java`
- `src/test/java/com/atelicove/controllers/TeamControllerTest.java`
- `TESTING_REPORT.md`

## Files removed

- `src/test/java/com/atelicove/repositories/CompanyRepositoryTest.java` — tested inherited CRUD only.
- `src/test/java/com/atelicove/repositories/WOItemRepositoryTest.java` — tested inherited CRUD only; relationship persistence is covered elsewhere.

Inherited CRUD cases were also removed from the remaining worker, work-order, and document repository specifications.

## Files updated

### Build and reporting

- `pom.xml`

### Controllers

- `AuthControllerTest.java`
- `CompanyControllerTest.java`
- `DraftProjectControllerTest.java`
- `ProjectControllerTest.java`
- `ProjectDocumentControllerTest.java`
- `WODocumentControllerTest.java`
- `WorkOrderControllerTest.java`
- `WorkerControllerTest.java`

### Services

- `AuthorizationServiceTest.java`
- `CompanyServiceTest.java`
- `DraftProjectServiceTest.java`
- `DraftWorkOrderServiceTest.java`
- `PlannedStaffingServiceTest.java`
- `ProjectServiceTest.java`
- `TeamServiceTest.java`
- `WODocumentServiceTest.java`
- `WOItemServiceTest.java`
- `WorkOrderServiceTest.java`
- `WorkerServiceTest.java`

### Repositories and entities

- `OptimisticLockingTest.java`
- `WODocumentRepositoryTest.java`
- `WorkerRepositoryTest.java`
- `WorkOrderRepositoryTest.java`
- `EntityZombiesTest.java`
- `WorkOrderItemTest.java`

## Behavior now documented

- Project creation, updates, work-order/team synchronization, completion, archive, restore, and safe deletion.
- Project comments, action items, assignment validation, completion flags, and snapshots.
- Work-order creation, worker/company assignment, item mutation, review, approval, rejection, archive, restore, and safe deletion.
- Draft project/work-order/item creation, update, lookup visibility, archive, restore, permanent deletion, and launch transaction behavior.
- Completed and archived object immutability.
- Worker and company active/archive/restore/delete rules.
- Role-based ownership and admin permissions.
- Soft-delete filtering and protected history.
- Team membership and active work-order synchronization.
- Planned staffing worker/team/open-slot resolution.
- Document ownership, MIME/extension matching, size restrictions, authorization, upload, lookup, and deletion.
- REST response status/body contracts, validation responses, not-found responses, multipart behavior, and download headers.
- Entity relationship helpers, parent invariants, monetary values, JSON boundaries, security configuration, database constraints, and optimistic locking.

## Remaining unit-test gaps

The largest remaining branch gaps are concentrated in `ProjectService`, `WorkOrderService`, and `DraftProjectLaunchService`. They primarily involve combinations of invalid relationship graphs and completion prerequisites. Additional cases should be added only when they describe a supported business scenario or guard a discovered regression.

DTO/entity branch coverage remains intentionally lower because meaningless getter/setter tests were not added.

## Areas requiring integration testing

- MySQL-specific DDL behavior, collations, indexes, generated identifiers, and constraint behavior currently approximated by H2.
- Transaction isolation and concurrent project/work-order lifecycle transitions beyond the current optimistic-lock specification.
- Multipart request limits and temporary-file behavior in the deployed servlet container.
- Session authentication, CORS, and authorization through a real HTTP boundary.
- Large draft launch graphs and rollback behavior under database, serialization, or storage failures.
- Document persistence behavior if binary content moves to object storage.
- Migration behavior against realistic legacy records, especially password and archive metadata migrations.

## Testcontainers recommendations

1. Add a shared MySQL container matching the production major version.
2. Use Spring Boot `@ServiceConnection` for container datasource wiring.
3. Move constraint, relationship, optimistic-lock, and draft-launch transaction tests to MySQL first.
4. Add container-backed lifecycle tests for project completion and work-order approval under concurrent updates.
5. Add an HTTP integration profile for authenticated multipart upload/download and session behavior.
6. Add a migration smoke test once Flyway or Liquibase is introduced.
7. Run unit and MVC tests on every commit; run the Testcontainers profile in CI with isolated containers.

## Verification

Command: `mvn clean test`

Result: **successful — 277 tests, 0 failures, 0 errors**.
