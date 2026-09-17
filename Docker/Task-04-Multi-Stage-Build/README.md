# Docker Task 04 – Multi-Stage Build for a Spring Boot Application

## Overview

This task demonstrates how to build and package a Spring Boot application using Docker Multi-Stage Builds. The objective is to separate the build environment from the runtime environment in order to produce a smaller, cleaner, and more secure production image.

## Objectives

- Build a Spring Boot application inside a Docker container.
- Use a dedicated Maven build stage.
- Generate the application JAR inside the builder stage.
- Copy only the generated artifact into the runtime stage.
- Run the application using a lightweight Java Runtime Environment (JRE).
- Reduce the final Docker image size.

## Technologies

- Docker
- Java 17
- Maven
- Spring Boot
- Eclipse Temurin

## Project Structure

```
Task-04-Multi-Stage-Build
├── Dockerfile
├── pom.xml
├── src
└── .gitignore
```

## Docker Build Process

### Builder Stage

- Uses the Maven image.
- Copies the project source code.
- Builds the application using Maven.
- Generates the executable JAR.

### Runtime Stage

- Uses the Eclipse Temurin JRE image.
- Copies only the generated JAR from the builder stage.
- Exposes port 8080.
- Starts the Spring Boot application.

## Docker Commands

Build the image:

```bash
docker build -t app3 .
```

Run the container:

```bash
docker run -d --name container3 -p 8081:8080 app3
```

Stop the container:

```bash
docker stop container3
```

Remove the container:

```bash
docker rm container3
```

Remove the image:

```bash
docker rmi app3
```

## Key Concepts

- Multi-Stage Docker Build
- Builder Stage
- Runtime Stage
- Docker Image Optimization
- Image Size Reduction
- Layer Reuse
- Spring Boot Containerization

## Author

Abdulrhman Mohammed Tolpa

Cloud & DevOps Engineer

GitHub: https://github.com/abdu1rhman1

LinkedIn: https://www.linkedin.com/in/abdulrhman-mohammed-b22609389
