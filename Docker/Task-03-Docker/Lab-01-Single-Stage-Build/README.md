
# Lab 01 - Single-Stage Docker Build

## Overview

This lab demonstrates how to containerize a Java Spring Boot application using a Single-Stage Docker Build. The application is built and packaged inside the Docker image using Maven, then executed as a Spring Boot application.

---

## Objective

The objective of this lab is to:

- Build a Docker image for a Spring Boot application.
- Package the application using Maven.
- Run the application inside a Docker container.
- Expose the application through port 8080.
- Understand the Docker image build process.
- Practice the complete Docker container lifecycle.

---

## Technologies

- Docker
- Java 17
- Maven
- Spring Boot 3.2
- Ubuntu Linux

---

## Prerequisites

Before running this project, make sure the following software is installed:

- Docker

Verify Docker installation:

```bash
docker --version
```

---

## Project Structure

```text
Lab-01-Single-Stage-Build
│
├── Dockerfile
├── pom.xml
├── src
├── .gitignore
├── .dockerignore
└── README.md
```

---

## Dockerfile

```dockerfile
FROM maven:3.9.6-eclipse-temurin-17

WORKDIR /app

COPY . .

RUN mvn package

EXPOSE 8080

CMD ["java", "-jar", "target/demo-0.0.1-SNAPSHOT.jar"]
```

---

## Dockerfile Instructions

### FROM

Uses the official Maven image with Eclipse Temurin JDK 17.

### WORKDIR

Creates `/app` and sets it as the working directory inside the container.

### COPY

Copies the application source code into the container.

### RUN

Builds the application using Maven and generates the executable JAR file.

### EXPOSE

Documents that the application listens on port **8080**.

### CMD

Starts the Spring Boot application.

---

## Build Workflow

```text
Application Source Code
        │
        ▼
Docker Build
        │
        ▼
Docker Image
        │
        ▼
Docker Container
        │
        ▼
Spring Boot Application
```

---

## Build Docker Image

```bash
docker build -t springboot-single-stage .
```

---

## Verify Image

```bash
docker images
```

---

## Run Container

```bash
docker run --name springboot-container -p 8081:8080 springboot-single-stage
```

---

## Verify Running Containers

```bash
docker ps
```

---

## Test the Application

Open your browser:

```text
http://localhost:8081
```

Or, if running inside a virtual machine:

```text
http://<VM-IP>:8081
```

---

## Stop Container

```bash
docker stop springboot-container
```

---

## Remove Container

```bash
docker rm springboot-container
```

---

## Remove Docker Image

```bash
docker rmi springboot-single-stage
```

---

## Cleanup

Remove unused Docker resources if needed:

```bash
docker system prune
```

---

## Commands Summary

```bash
docker build -t springboot-single-stage .

docker images

docker run --name springboot-container -p 8081:8080 springboot-single-stage

docker ps

docker ps -a

docker stop springboot-container

docker rm springboot-container

docker rmi springboot-single-stage
```

---
## Screenshots

### Building the Docker Image

The Docker image is built successfully using the Dockerfile.

![Docker Build](images/01-docker-build.png)

---

### Available Docker Images

Verify that the image has been created successfully.

![Docker Images](images/02-docker-images.png)

---

### Running the Container

The Spring Boot application starts successfully inside the Docker container.

![Docker Run](images/03-docker-run.png)

---

### Testing the Application

The application is accessible through the browser after publishing the container port.

![Browser Test](images/04-browser-test.png)

---

### Running Containers

Verify that the container is running correctly.

![Docker PS](images/05-docker-ps.png)

Recommended structure:

```text
images/
├── docker-build.png
├── docker-images.png
├── docker-run.png
├── browser-test.png
└── docker-ps.png
```

---

## Concepts Learned

- Docker Images
- Docker Containers
- Dockerfile
- Base Images
- Working Directory
- Build Context
- Docker Layers
- Port Mapping
- Container Lifecycle
- Spring Boot Containerization

---

## Skills Acquired

- Writing Dockerfiles
- Building Docker Images
- Running Spring Boot inside Docker
- Managing Docker Containers
- Managing Docker Images
- Publishing Java Applications using Docker

---

## References

Docker Documentation

https://docs.docker.com/

Spring Boot Documentation

https://spring.io/projects/spring-boot

---

## Author

Abdulrhman Mohammed Tolpa

GitHub

https://github.com/abdu1rhman1

LinkedIn

https://www.linkedin.com/in/abdulrhman-mohammed-b22609389
