# Task 08 - Containerized Node.js and MySQL Stack Using Docker Compose

## Overview

This task demonstrates how to containerize a Node.js application and a MySQL database and run them together using Docker Compose.

The application and database run as separate containers and communicate through a Docker Compose network.

The project also demonstrates:

* Docker image building
* Docker Compose orchestration
* Container networking
* Environment variables
* MySQL database initialization
* Persistent Docker volumes
* Application health and readiness endpoints
* Application access logging
* Publishing a Docker image to DockerHub

---

## Architecture

```text
                    Host Machine
                         |
                         | Port 3000
                         v
              +---------------------+
              |   Node.js App       |
              |   app container     |
              |                     |
              |   Port: 3000        |
              +----------+----------+
                         |
                         | Docker Network
                         | DB_HOST=db
                         v
              +---------------------+
              |      MySQL 8.0      |
              |     db container    |
              |                     |
              |     Port: 3306      |
              +----------+----------+
                         |
                         | Persistent Storage
                         v
              +---------------------+
              |   db_data volume    |
              |   /var/lib/mysql    |
              +---------------------+
```

---

## Project Structure

```text
Task-08-Docker-Compose-NodeJS-MySQL/
│
├── Dockerfile
├── docker-compose.yml
├── package.json
├── server.js
├── db.js
├── frontend/
└── README.md
```

---

## Technologies Used

* Docker
* Docker Compose
* Node.js 18
* Express.js
* MySQL 8.0
* Docker Volumes
* Docker Networking
* JavaScript
* DockerHub

---

## Dockerfile

The application is containerized using the provided Dockerfile.

Main stages:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### Dockerfile Explanation

### `FROM node:18-alpine`

Uses Node.js 18 with Alpine Linux as the base image.

The Alpine-based image is relatively lightweight compared with larger Linux distributions.

### `WORKDIR /app`

Sets `/app` as the working directory inside the container.

### `COPY package.json ./`

Copies the package definition into the image before installing dependencies.

### `RUN npm install`

Installs the Node.js dependencies defined in `package.json`.

### `COPY . .`

Copies the application source code into the container.

### `EXPOSE 3000`

Documents that the application listens on port 3000 inside the container.

### `CMD ["node", "server.js"]`

Starts the Node.js application when the container starts.

---

# Docker Compose

The application stack is defined in `docker-compose.yml`.

```yaml
services:

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DB_HOST: db
      DB_USER: root
      DB_PASSWORD: rootpassss
      DB_NAME: ivolve
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassss
      MYSQL_DATABASE: ivolve
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:
```

---

## Services

### App Service

The `app` service builds the Node.js application from the local Dockerfile.

```yaml
app:
  build: .
```

The `.` means Docker should use the current directory as the build context.

The Dockerfile in that directory is used to build the image.

---

### Port Mapping

```yaml
ports:
  - "3000:3000"
```

This maps:

```text
Host Port 3000
       |
       v
Container Port 3000
```

Therefore, the application can be accessed from the host using:

```text
http://localhost:3000
```

---

## Environment Variables

The application receives its database configuration through environment variables:

```yaml
environment:
  DB_HOST: db
  DB_USER: root
  DB_PASSWORD: rootpassss
  DB_NAME: ivolve
```

### DB_HOST

```text
DB_HOST=db
```

`db` is the Docker Compose service name of the MySQL container.

Docker Compose provides internal DNS, allowing the application container to reach MySQL using:

```text
db
```

instead of using an IP address.

This is important because container IP addresses can change.

---

### DB_USER

```text
DB_USER=root
```

Specifies the MySQL username used by the application.

---

### DB_PASSWORD

```text
DB_PASSWORD=rootpassss
```

Specifies the password used by the application to authenticate with MySQL.

This value is suitable for this lab environment only.

In production environments, passwords should not be hardcoded in the Compose file. Secrets management should be used instead.

---

### DB_NAME

```text
DB_NAME=ivolve
```

Specifies the database that the Node.js application connects to.

---

# MySQL Service

The database service uses the official MySQL 8.0 image:

```yaml
db:
  image: mysql:8.0
```

The database is initialized using:

```yaml
environment:
  MYSQL_ROOT_PASSWORD: rootpassss
  MYSQL_DATABASE: ivolve
```

### MYSQL_ROOT_PASSWORD

Defines the root password used during MySQL initialization.

### MYSQL_DATABASE

Requests creation of a database named:

```text
ivolve
```

during the initial MySQL database setup.

The application then connects to the same database using:

```text
DB_NAME=ivolve
```

---

# Docker Network

Docker Compose automatically creates a network for the project.

The services communicate through this network.

```text
app
 |
 | DB_HOST=db
 v
db
```

The application does not need to know the database container's IP address.

Instead, Docker's internal DNS resolves:

```text
db
```

to the current IP address of the MySQL container.

This provides service-to-service communication without hardcoding container IPs.

---

# Persistent Storage

The MySQL database uses a named Docker volume:

```yaml
volumes:
  - db_data:/var/lib/mysql
```

The volume is defined at the bottom of the Compose file:

```yaml
volumes:
  db_data:
```

The mapping is:

```text
Docker Volume
     |
     v
db_data
     |
     v
/var/lib/mysql
     |
     v
MySQL Data
```

The volume allows database data to persist even when the MySQL container is removed.

The actual Compose-created volume is:

```text
kubernets-app_db_data
```

---

# Application Health Check

The application provides a health endpoint:

```text
GET /health
```

Test it with:

```bash
curl -i http://localhost:3000/health
```

A successful request returns HTTP:

```text
HTTP/1.1 200 OK
```

The `/health` endpoint checks the database connection using a database query.

---

# Application Readiness Check

The application also provides:

```text
GET /ready
```

Test it with:

```bash
curl -i http://localhost:3000/ready
```

A successful request returns:

```text
👍 iVolve web app is ready to rock and roll!
```

with HTTP status:

```text
200 OK
```

---

# Application Logs

The application uses Morgan to write HTTP access logs to:

```text
/app/logs/access.log
```

The logs can be verified using:

```bash
docker compose exec app ls -l /app/logs
```

and:

```bash
docker compose exec app tail -n 20 /app/logs/access.log
```

Example log:

```text
"GET /health HTTP/1.1" 200
"GET /ready HTTP/1.1" 200
```

The log confirms that requests are reaching the application and records their HTTP status codes.

---

# Build and Run

From the project directory:

```bash
docker compose up -d
```

This starts both services in detached mode.

Check the running containers:

```bash
docker compose ps
```

Expected services:

```text
app
db
```

---

# Verify MySQL

Check the MySQL container logs:

```bash
docker compose logs db
```

The database should eventually report:

```text
ready for connections
```

---

# Verify Application

Check the application logs:

```bash
docker compose logs app
```

The application should eventually report that it connected successfully to MySQL and started the server.

Test:

```bash
curl http://localhost:3000/health
```

Then:

```bash
curl http://localhost:3000/ready
```

---

# Docker Image

Docker Compose builds the application image locally.

The generated image was tagged as:

```text
abdu1rhman/ivolve-app:1.0
```

The tag was created using:

```bash
docker tag kubernets-app-app:latest abdu1rhman/ivolve-app:1.0
```

The image was then pushed to DockerHub using:

```bash
docker push abdu1rhman/ivolve-app:1.0
```

DockerHub repository:

```text
abdu1rhman/ivolve-app
```

---

# Useful Commands

### Start the stack

```bash
docker compose up -d
```

### Stop the stack

```bash
docker compose down
```

### View running services

```bash
docker compose ps
```

### View application logs

```bash
docker compose logs app
```

### View database logs

```bash
docker compose logs db
```

### Follow application logs

```bash
docker compose logs -f app
```

### Execute a command inside the app container

```bash
docker compose exec app sh
```

### Execute MySQL client inside the database container

```bash
docker compose exec db mysql -uroot -p
```

### List Docker volumes

```bash
docker volume ls
```

### Inspect the database volume

```bash
docker volume inspect kubernets-app_db_data
```

---

# Verification Results

The stack was successfully deployed and verified.

| Component               | Result              |
| ----------------------- | ------------------- |
| Node.js application     | Running             |
| MySQL 8.0               | Running             |
| Docker Compose network  | Working             |
| MySQL database `ivolve` | Created             |
| Persistent volume       | Created and mounted |
| `/health` endpoint      | HTTP 200            |
| `/ready` endpoint       | HTTP 200            |
| `/app/logs/access.log`  | Verified            |
| DockerHub image         | Successfully pushed |

---

# Key DevOps Concepts Demonstrated

This task demonstrates practical understanding of:

1. Containerizing an application using Docker.
2. Building images using Dockerfiles.
3. Orchestrating multiple containers using Docker Compose.
4. Service-to-service communication through Docker networks.
5. Using service names instead of hardcoded container IP addresses.
6. Passing configuration through environment variables.
7. Persistent database storage using Docker volumes.
8. Health and readiness endpoints.
9. Container and application logging.
10. Tagging Docker images for a container registry.
11. Authenticating with DockerHub.
12. Publishing container images to DockerHub.

---

## DockerHub Image

```text
abdu1rhman/ivolve-app:1.0
```

