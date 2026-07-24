# Task 05 - Managing Docker Environment Variables

## Overview

This lab demonstrates different approaches to managing **Environment Variables** in Docker during both **build time** and **runtime**.

The objective is to understand how Docker passes configuration values to an application without modifying the source code, following modern DevOps best practices.

---

# Project Structure

```
Task-05-Environment-Variables/
│
├── app.py
├── Dockerfile
├── staging.env
├── .gitignore
├── .dockerignore
└── README.md
```

---

# Application Overview

The application is a simple **Flask Web Application**.

It reads two environment variables:

- `APP_MODE`
- `APP_REGION`

using Python's `os.getenv()` function.

Example response:

```
App mode: development, Region: us-east
```

---

# Dockerfile Explanation

## Base Image

```dockerfile
FROM python:3.13-slim
```

Uses the official lightweight Python image.

---

## Working Directory

```dockerfile
WORKDIR /app
```

Creates and sets the application's working directory.

---

## Copy Application

```dockerfile
COPY . .
```

Copies all project files from the host machine into the container.

---

## Install Flask

```dockerfile
RUN pip install flask
```

Installs the Flask dependency during image build.

---

## Expose Application Port

```dockerfile
EXPOSE 8080
```

Documents that the application listens on port **8080**.

---

## Default Environment Variables

```dockerfile
ENV APP_MODE=production
ENV APP_REGION=canada-west
```

Defines default environment variables inside the Docker image.

---

## Start Application

```dockerfile
CMD ["python","app.py"]
```

Runs the Flask application when the container starts.

---

# Build Docker Image

```bash
docker build -t app .
```

---

# Running Containers

## Method 1 — Runtime Environment Variables

Environment variables are passed directly using `-e`.

```bash
docker run -d \
--name container1 \
-p 8080:8080 \
-e APP_MODE=development \
-e APP_REGION=us-east \
app
```

Output

```
App mode: development
Region: us-east
```

---

## Method 2 — Environment File

Environment variables are stored inside a separate file.

### staging.env

```text
APP_MODE=staging
APP_REGION=us-west
```

Run container

```bash
docker run -d \
--name container2 \
-p 8081:8080 \
--env-file staging.env \
app
```

Output

```
App mode: staging
Region: us-west
```

---

## Method 3 — Dockerfile Environment Variables

Default variables are defined using the `ENV` instruction.

```dockerfile
ENV APP_MODE=production
ENV APP_REGION=canada-west
```

Run container

```bash
docker run -d \
--name container3 \
-p 8082:8080 \
app
```

Output

```
App mode: production
Region: canada-west
```

---

# Environment Variable Priority

Docker applies environment variables in the following order (highest priority first):

```
docker run -e
        ↓
--env-file
        ↓
ENV (Dockerfile)
```

Runtime values override values defined inside the Docker image.

---

# Build Time vs Runtime

## Build Time

Executed while building the image.

Examples:

- FROM
- WORKDIR
- COPY
- RUN
- ENV

---

## Runtime

Executed when the container starts.

Examples:

- CMD
- ENTRYPOINT

---

# Technologies Used

- Docker
- Python 3
- Flask

---

# Learning Outcomes

After completing this lab I learned how to:

- Build Docker images for Python applications.
- Install Python dependencies inside Docker.
- Manage Docker environment variables.
- Pass runtime configuration using `-e`.
- Use external environment files with `--env-file`.
- Define default values using `ENV`.
- Understand the difference between Build Time and Runtime.
- Apply Docker configuration best practices.

---

# Author

**Abdulrhman Mohammed**

GitHub:
https://github.com/abdu1rhman1

LinkedIn:
https://www.linkedin.com/in/abdulrhman-mohammed-b22609389
