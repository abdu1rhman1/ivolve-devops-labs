# Java Spring Boot Application in Docker (Single Stage Build)

## Overview

This project demonstrates how to containerize a Java Spring Boot application using a single-stage Docker build.

The application is built with Maven to generate an executable JAR file, which is then packaged into a Docker image based on the official Eclipse Temurin Java 17 Runtime image.

---

## Project Structure

```text
.
├── Dockerfile
├── pom.xml
├── src
│   └── main
└── .gitignore
```

---

## Prerequisites

The following tools must be installed before building the project:

- Docker Engine
- Java 17
- Apache Maven

Verify the installation:

```bash
docker --version
java --version
mvn --version
```

---

## Build the Application

Generate the executable JAR file:

```bash
mvn clean package
```

After a successful build, Maven creates:

```text
target/demo-0.0.1-SNAPSHOT.jar
```

---

## Dockerfile

```dockerfile
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY target/demo-0.0.1-SNAPSHOT.jar .

EXPOSE 8080

CMD ["java", "-jar", "demo-0.0.1-SNAPSHOT.jar"]
```

---

## Dockerfile Instructions

| Instruction | Description |
|------------|-------------|
| `FROM` | Uses the official Eclipse Temurin Java 17 Runtime image as the base image. |
| `WORKDIR` | Sets `/app` as the working directory inside the container. |
| `COPY` | Copies the generated JAR file from the build context into the working directory. |
| `EXPOSE` | Documents that the application listens on port `8080`. |
| `CMD` | Starts the Spring Boot application when the container launches. |

---

## Build the Docker Image

Build the image from the project directory:

```bash
docker build -t app2image .
```

Verify that the image was created:

```bash
docker images
```

---

## Run the Container

Start a container from the image:

```bash
docker run --name container2 -p 8081:8080 app2image
```

Port mapping:

| Host | Container |
|------|-----------|
| 8081 | 8080 |

---

## Test the Application

Access the application from a web browser:

```
http://localhost:8081
```

or

```
http://<host-ip>:8081
```

---

## Stop the Container

```bash
docker stop container2
```

---

## Remove the Container

```bash
docker rm container2
```

---

## Technologies

- Docker
- Java 17
- Spring Boot
- Apache Maven
- Eclipse Temurin JRE

---

## Concepts Covered

- Maven Build Lifecycle
- Executable JAR Packaging
- Single-Stage Docker Build
- Docker Images
- Docker Containers
- Docker Build Context
- Port Publishing
- Container Runtime
