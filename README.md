# Atelicove Community Edition

Atelicove Community Edition is a Spring Boot and React application for managing workers, companies, work orders, work-order items, and work-order documents. It uses session-based authentication with `ADMIN` and `WORKER` roles and preserves completed business history through archive and deletion safeguards.

## Technology

- Java 17
- Spring Boot 3.5.11
- React 18.3.1
- MySQL 8.0 (the supplied Docker configuration uses MySQL 8.0)
- Maven and npm

## Community Edition scope

The supported Community Edition scope includes:

- Session authentication and logout
- `ADMIN` and `WORKER` authorization
- Worker and company management
- Live projects, teams, comments, action items, and snapshots
- Work orders, work-order items, and document attachments
- Work-order assignment and lifecycle behavior
- Archive, restore, and historical deletion safeguards
- Essential backend and frontend tests

Draft Studio is available only in the SaaS/private edition and is not included in Community Edition. SaaS subscriptions, draft-to-work-order launch conversion, advanced project planning, expanded teams, analytics, notifications, object storage, and microservices are also outside the Community Edition support boundary.

## Prerequisites

- JDK 17
- Maven 3.9 or a compatible Maven 3 release
- Node.js and npm
- MySQL 8.0, or Docker with Docker Compose

## Environment configuration

Copy `.env.example` to `.env` if you want Docker Compose to use customized local values. `.env` is ignored by Git. Spring Boot also accepts the variables from your shell or IDE; it does not automatically import a root `.env` file when started directly with Maven.

| Variable | Local default | Purpose |
| --- | --- | --- |
| `DB_URL` | `jdbc:mysql://localhost:3307/atelicoveDB?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC` | Backend JDBC URL |
| `DB_USERNAME` | `atelicove_user` | Backend and Docker database user |
| `DB_PASSWORD` | `atelicove_pass` | Backend and Docker database password |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated trusted frontend origins |
| `MYSQL_ROOT_PASSWORD` | `rootpassword` | Local Docker MySQL root password |
| `MYSQL_DATABASE` | `atelicoveDB` | Local Docker database name |
| `MYSQL_PORT` | `3307` | Local Docker host port |

The checked-in values are development conveniences only. Use different secrets outside a local demonstration environment.

PowerShell example:

```powershell
$env:DB_USERNAME = "atelicove_user"
$env:DB_PASSWORD = "atelicove_pass"
$env:CORS_ALLOWED_ORIGINS = "http://localhost:3000"
```

## Start the database with Docker

The Compose file starts MySQL only; it does not add application deployment infrastructure.

```bash
docker compose up -d mysql
```

MySQL listens on `localhost:3307` by default. Stop it with `docker compose down`. Add `-v` only when you intentionally want to delete the local database volume.

## Start and test the backend

From the repository root:

```bash
mvn spring-boot:run
```

The backend is available at `http://localhost:8080`.

Run the backend tests with:

```bash
mvn test
```

Hibernate uses `spring.jpa.hibernate.ddl-auto=update` by default for local Community Edition development.
Because `ddl-auto=update` does not drop removed tables automatically, existing local databases may retain obsolete draft-subsystem tables. They can be removed manually after confirming that no retained local data is needed.

## Start the frontend

In another terminal:

```bash
cd atelicovefrontend
npm install
npm start
```

The frontend is available at `http://localhost:3000` and sends authenticated requests to `http://localhost:8080` by default.

## Initial administrator

The backend does not automatically seed a production-style administrator or a checked-in password. For a new database, create the first local `Worker` administrator record directly in MySQL with its admin flag enabled and a BCrypt password hash. After that administrator can log in, additional workers and administrators can be created through the authenticated worker-management API or UI.

Do not commit bootstrap credentials or plain-text passwords. The frontend's optional mock mode contains demonstration-only accounts and does not seed the backend database.

## Limitations

- Documents are stored in the relational database rather than object storage.
- DTOs protect targeted request and response boundaries; the application has not undergone a complete DTO conversion.
- Local schema evolution relies on `ddl-auto=update` rather than migrations.
- Test coverage focuses on essential workflows and security boundaries rather than every UI path.
- Authentication is server-session and cookie based; JWT authentication is not provided.
- The Docker configuration supplies MySQL for local development, not a production deployment architecture.

## License

Atelicove Community Edition is available under the [MIT License](LICENSE).
