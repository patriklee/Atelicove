# ✨ Atelicove

### *A thoughtfully crafted workspace for growing businesses.*

A modern full-stack business workspace for managing companies, projects, work orders, documents, and day-to-day operations through a clean and intuitive experience.

![Java](https://img.shields.io/badge/Java-25-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

---

## ✨ Features

### 🏢 Workspace Management

- Secure authentication
- Company management
- Worker management
- Project management
- Work order management
- Assignment tracking
- Dashboard overview
- Action item planning

### 📁 Document Management

- Upload documents directly to work orders
- Download stored files
- Delete documents while work orders remain active
- Database-backed storage
- Archived work orders retain associated documents

### 🛡 Business Rules

- Admin & Worker roles
- Role-aware access
- Soft-delete archiving
- Completed work orders become read-only
- Historical relationships preserved
- 10 MB upload limit
- Supports PDF, DOCX, XLSX, TXT, PNG & JPEG

---

## 🛠 Technology Stack

| Backend | Frontend | Database | Tools |
|---------|----------|----------|------|
| Java 25 | React | MySQL 8 | Git |
| Spring Boot | Material UI | Docker | GitHub |
| Spring Data JPA | React Router | | Docker Desktop |
| Maven | Axios | | DBeaver |

---

## 🏗 Architecture

```text
React Frontend
      │
REST Controllers
      │
Business Services
      │
Repositories
      │
Spring Data JPA
      │
Dockerized MySQL
```

---

## 🚀 Getting Started

### Backend

Run `AtelicoveApplication.java`

Backend: http://localhost:8080

### Frontend

```bash
cd atelicovefrontend
npm install
npm start
```

Frontend: http://localhost:3000

---

## 🌟 Vision

> Software should feel like a thoughtfully crafted workspace—not just another collection of forms.

Atelicove is an independently maintained business workspace focused on elegant administration, scalable architecture, and thoughtful user experience.

---

## 🙏 Origins

Atelicove is the independent successor to the ICS 499 Software Engineering Capstone Project. While inspired by the original academic project, this repository has evolved into its own independently maintained application with new branding, architecture, workflows, and long-term vision.

---

## 📄 License

Licensed under the MIT License.
