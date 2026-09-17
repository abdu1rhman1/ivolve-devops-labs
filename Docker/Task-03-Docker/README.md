# Task 03 - Docker

## Overview

This task focuses on containerizing Java applications using Docker. The objective is to understand how to package an application with all its dependencies into a portable Docker image and run it consistently across different environments.

The task is divided into multiple labs, each introducing a different Docker build approach.

---

## Objectives

- Understand Docker fundamentals.
- Build Docker images from Java applications.
- Run Java applications inside containers.
- Learn the difference between Single-Stage and Multi-Stage builds.
- Practice Docker image management and container lifecycle.

---

## Technologies Used

- Docker
- Java 17
- Maven
- Spring Boot
- Ubuntu Linux

---

## Repository Structure

```text
Task-03-Docker
│
├── README.md
│
├── Lab-01-Single-Stage-Build
│   ├── Dockerfile
│   ├── pom.xml
│   ├── src
│   ├── .gitignore
│   └── .dockerignore
│
└── Lab-02-Multi-Stage-Build
```

---

# Labs

## Lab 01 – Single-Stage Docker Build

Build and run a Spring Boot application using a single Docker image that performs both the build process and application execution.

### Topics Covered

- Dockerfile fundamentals
- Base Images
- Working Directory
- Copying files
- Building Java applications using Maven
- Running Spring Boot inside Docker
- Port Mapping
- Docker Image creation
- Container lifecycle

---



## Key Docker Concepts Learned

- Docker Images
- Docker Containers
- Dockerfile Instructions
- FROM
- WORKDIR
- COPY
- RUN
- CMD
- EXPOSE
- Image Layers
- Build Context
- Port Mapping
- Container Lifecycle
- Image Management

---

## Skills Practiced

- Writing Dockerfiles
- Building Docker Images
- Running Containers
- Managing Images and Containers
- Container Networking
- Packaging Java Applications
- Working with Spring Boot in Docker

---

## Author

**Abdulrhman Mohammed Tolpa**

Cloud & DevOps Engineer

- GitHub: https://github.com/abdu1rhman1
- LinkedIn: https://www.linkedin.com/in/abdulrhman-mohammed-b22609389
