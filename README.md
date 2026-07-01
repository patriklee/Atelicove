# Atelicove

> *A thoughtful workspace for growing businesses.*

Atelicove is a modern full-stack business workspace designed to help
small businesses organize their people, projects, documents, and daily
operations through a clean and intuitive web experience.

Originally inspired by a university software engineering capstone,
Atelicove has evolved into an independently developed platform focused
on modern architecture, maintainability, and thoughtful design. What
began as a work order and billing application has grown into a broader
operational workspace where work is organized, tracked, and managed from
one central location.

------------------------------------------------------------------------

# ✨ Features

## Current

-   Secure authentication
-   Company management
-   Worker management
-   Work order management
-   Document uploads
-   Assignment tracking
-   Soft-delete archiving
-   Dashboard summaries
-   RESTful API architecture

## Planned

-   Scheduling & calendars
-   Inventory management
-   Notifications
-   Payroll
-   Billing & invoicing
-   Reporting & analytics
-   Customer portal
-   Mobile support

------------------------------------------------------------------------

# 🏗 Technology Stack

## Backend

-   Java 21+
-   Spring Boot 3
-   Spring Data JPA (Hibernate)
-   Maven

## Frontend

-   React 18
-   Material UI (MUI)
-   React Router
-   Axios

## Database

-   MySQL 8
-   Docker

## Development Tools

-   Docker Desktop
-   DBeaver
-   Git
-   GitHub
-   Node.js

------------------------------------------------------------------------

# 🧱 Architecture

``` text
React Frontend
        │
 REST API (JSON)
        │
Spring Boot Backend
        │
Spring Data JPA
        │
Dockerized MySQL
```

Atelicove follows a layered architecture that separates presentation,
business logic, and persistence.

------------------------------------------------------------------------

# 🚀 Getting Started

## Prerequisites

-   Java 21+
-   Maven
-   Docker Desktop
-   Node.js 20 LTS

## Backend

Run `AtelicoveApplication.java`.

Backend URL: `http://localhost:8080`

## Frontend

``` bash
cd sbafrontend
npm install
npm start
```

Frontend URL: `http://localhost:3000`

------------------------------------------------------------------------

# 🐳 Docker

-   Database: `payrollBillingDB`
-   Container: `payroll-mysql`
-   Host Port: `3307`

------------------------------------------------------------------------

# 🔐 Authentication

-   Login validation
-   Password verification
-   Role support
-   Automatic administrator initialization

Future versions will migrate to JWT authentication.

------------------------------------------------------------------------

# 📈 Project Vision

Atelicove is built around a simple philosophy:

> Software should feel like a thoughtfully crafted workspace.

A place where businesses can organize projects, people, documents, and
operations with clarity.

------------------------------------------------------------------------

# 🗺 Roadmap

-   JWT Authentication
-   Role-based permissions
-   Dashboard analytics
-   Scheduling
-   Inventory
-   Billing & Payroll
-   Reporting
-   Docker Compose
-   Cloud deployment

------------------------------------------------------------------------

# 📚 Origins

Atelicove began as the **ICS 499 Software Engineering Capstone Project**
developed alongside Jeremy Marks, Aaron Nguyen, Austin Silva, and
Patrick Lee.

The original capstone repository has been preserved to acknowledge the
original team while Atelicove continues as its independent successor.

------------------------------------------------------------------------

# 📄 License

MIT License.
