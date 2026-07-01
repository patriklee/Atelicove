# Atelicove

> A thoughtfully crafted workspace for growing businesses.

Atelicove is a modern full-stack business workspace designed to help small
businesses organize work orders, companies, workers, documents, and daily
operations through a clean and intuitive web experience.

Built with Java, Spring Boot, React, and MySQL, Atelicove emphasizes
maintainable architecture, thoughtful user experience, and scalable business
workflows. The project serves as both a practical business application and a
demonstration of modern full-stack software engineering principles.

---

## Features

### Workspace Management

- Secure user authentication
- Company management
- Worker management
- Work order management
- Assignment tracking
- Dashboard overview

### Document Management

- Upload documents directly to work orders
- Download stored documents
- Delete documents while a work order is active
- Automatic file count displayed on work orders
- Database-backed document storage
- Archived work orders retain all associated documents

### Business Rules

- Admin and worker role support
- Role-aware work order access
- Soft-delete archiving
- Completed work orders become read-only
- Historical relationships are preserved after archival
- Server-side file validation
- 10 MB upload limit
- Supports PDF, DOCX, XLSX, TXT, PNG, and JPEG files

---

## Screenshots

Coming soon:

- Dashboard
- Work Orders
- Company Management
- Worker Management
- Document Management

---

## Technology Stack

### Backend

- Java 21+
- Spring Boot 3
- Spring Data JPA (Hibernate)
- Maven

### Frontend

- React 18
- Material UI (MUI)
- React Router
- Axios

### Database

- MySQL 8
- Docker

### Development Tools

- Git
- GitHub
- Docker Desktop
- DBeaver
- Node.js

---

## Technical Highlights

Atelicove demonstrates several common enterprise software development
practices, including:

- Layered Controller -> Service -> Repository architecture
- RESTful API design
- DTO-based API responses
- Entity relationship modeling
- Enum-based domain modeling
- Soft-delete archival system
- Audit timestamps
- Database-backed document storage
- File upload validation
- Dockerized MySQL development environment

---

## Architecture

```text
React Frontend
        |
 REST Controllers
        |
 Business Services
        |
 Repositories
        |
 Spring Data JPA
        |
 Dockerized MySQL
```

Atelicove follows a layered architecture that separates presentation, business
logic, and persistence, making the application easier to maintain, test, and
extend.

---

## Document Management

Documents are fully integrated into work orders and follow business rules that
preserve historical records.

### Features

- Upload documents directly to work orders
- Download stored documents
- Delete files while a work order is active
- Automatic file counting
- Files remain attached to archived work orders

### Supported File Types

- PDF
- DOCX
- XLSX
- TXT
- PNG
- JPEG

### Upload Rules

- Maximum file size: 10 MB
- Completed work orders become read-only
- Archived work orders retain all associated documents

---

## Getting Started

### Prerequisites

- Java 21+
- Maven
- Docker Desktop
- Node.js 20+

### Database

Start the Docker MySQL container before running the backend.

| Setting | Value |
| --- | --- |
| Database | `atelicoveDB` |
| Container | `atelicove-mysql` |
| Host Port | `3307` |

### Backend

Run `AtelicoveApplication.java`.

Backend URL: `http://localhost:8080`

### Frontend

```bash
cd atelicovefrontend
npm install
npm start
```

Frontend URL: `http://localhost:3000`

---

## Roadmap

### Near-Term

- Expand role-based permissions
- Dashboard enhancements
- Docker Compose support
- Cloud deployment
- Improved document management

### Future Modules

- Scheduling
- Inventory management
- Reporting and analytics
- Customer portal
- Billing
- Payroll

---

## Vision

Atelicove is designed around a simple philosophy:

> Software should feel like a thoughtfully crafted workspace, not just another
> collection of forms.

Rather than focusing solely on data entry, Atelicove aims to provide
administrators with an organized environment where projects, workers,
companies, and documents naturally come together in one place.

The long-term goal is to build a workspace that is intuitive, maintainable, and
enjoyable to use as businesses continue to grow.

---

## Origins

Atelicove is the independent successor to the ICS 499 Software Engineering
Capstone Project, originally developed alongside Jeremy Marks, Aaron Nguyen,
Austin Silva, and Patrick Lee.

While the original repository remains available to recognize the contributions
of the original team, Atelicove has since evolved into its own project with new
architecture, branding, features, and long-term vision.

---

## License

Licensed under the MIT License.
