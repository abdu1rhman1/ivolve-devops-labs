# Docker Volume and Bind Mount with Nginx

## Project Overview

This lab demonstrates how Docker handles persistent storage using **Named Volumes** and **Bind Mounts** with an Nginx container.

The main goal is to understand the difference between Docker-managed storage and directly sharing files between the host machine and a container.

During this lab, an Nginx container was configured with:

- A **Named Volume** for Nginx logs.
- A **Bind Mount** for Nginx web content.
- Port mapping between the host machine and the container.
- Real-time synchronization between the host filesystem and the container.
- Nginx log verification using Docker.
- Proper Docker resource cleanup.

---

# Task Objectives

- Create `nginx_logs` Docker volume.
- Verify the volume using Docker commands.
- Inspect the default Docker volume storage path.
- Create an `index.html` file on the host machine.
- Run an Nginx container using the official `nginx` image.
- Mount the `nginx_logs` volume to `/var/log/nginx`.
- Bind Mount the host directory to `/usr/share/nginx/html`.
- Verify the Nginx page using `curl`.
- Modify `index.html` on the host and verify the change without rebuilding the image.
- Verify Nginx access logs.
- Understand the difference between Named Volumes and Bind Mounts.
- Properly stop and remove the container.
- Delete the Docker volume after completing the lab.

---

# Technologies Used

- Docker
- Nginx
- Linux
- Bash
- Docker Named Volumes
- Docker Bind Mounts
- curl

---

# 1. Create Docker Named Volume

The first step was creating a Docker Named Volume called `nginx_logs`.

A Named Volume is storage managed by Docker and can exist independently from a container.

## Create the Volume

```bash
docker volume create nginx_logs
```

Output:

```text
nginx_logs
```

## Verify the Volume

```bash
docker volume ls
```

Example output:

```text
DRIVER    VOLUME NAME
local     jenkins_home
local     nginx_logs
```

The `nginx_logs` volume was successfully created.

---

# 2. Inspect the Docker Volume

The volume was inspected to identify its configuration and Docker-managed storage location.

```bash
docker volume inspect nginx_logs
```

The important part of the output was:

```text
"Mountpoint": "/var/lib/docker/volumes/nginx_logs/_data"
```

This is the default physical storage location used by Docker for this Named Volume.

The important concept is that this path was created and managed by Docker.

We did not manually create this directory.

The relationship is:

```text
Docker
   |
   v
nginx_logs
   |
   v
/var/lib/docker/volumes/nginx_logs/_data
```

---

# 3. Create the Web Page

An `index.html` file was created on the Docker host.

Example content:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Docker Bind Mount</title>
</head>
<body>
    <h1>Hello from Bind Mount</h1>
</body>
</html>
```

The file exists on the **host machine**.

It will later be shared with the Nginx container using a Bind Mount.

---

# 4. Run the Nginx Container

The official Nginx Docker image was used to create the container.

The container was started using:

```bash
docker run -d \
  --name nginx-container \
  -p 8081:80 \
  -v nginx_logs:/var/log/nginx \
  -v $(pwd):/usr/share/nginx/html \
  nginx
```

---

## Command Breakdown

### Detached Mode

```bash
-d
```

Runs the container in the background.

---

### Container Name

```bash
--name nginx-container
```

Assigns the name `nginx-container` to the container.

This allows the container to be referenced easily:

```bash
docker ps
docker logs nginx-container
docker stop nginx-container
docker rm nginx-container
```

---

### Port Mapping

```bash
-p 8081:80
```

Docker port mapping follows:

```text
HOST_PORT:CONTAINER_PORT
```

Therefore:

```text
Host Machine
Port 8081
     |
     v
Container
Port 80
     |
     v
Nginx
```

Nginx listens on port `80` inside the container.

Port `8081` is used on the host to access the service.

The application can therefore be accessed using:

```bash
curl localhost:8081
```

---

# 5. Mount the Named Volume

The following option was used:

```bash
-v nginx_logs:/var/log/nginx
```

The format is:

```text
VOLUME_NAME:CONTAINER_PATH
```

Therefore:

```text
nginx_logs
     |
     v
/var/log/nginx
```

The Docker volume:

```text
nginx_logs
```

is mounted inside the container at:

```text
/var/log/nginx
```

Docker manages the physical storage location of the Named Volume.

---

# 6. Configure the Bind Mount

The following option was used:

```bash
-v $(pwd):/usr/share/nginx/html
```

The format is:

```text
HOST_PATH:CONTAINER_PATH
```

`$(pwd)` returns the current working directory.

For example:

```bash
pwd
```

could return:

```text
/home/bod/Ivolve-tasks/Task-06-Docker-Volume-and-BindMount-with-Nginx
```

Therefore Docker creates this relationship:

```text
Host Directory
/home/bod/.../Task-06-Docker-Volume-and-BindMount-with-Nginx
             |
             | Bind Mount
             v
Container
/usr/share/nginx/html
             |
             v
Nginx
```

The host directory becomes available inside the container.

---

# 7. Verify the Running Container

The running containers were verified using:

```bash
docker ps
```

The Nginx container should appear with a port mapping similar to:

```text
0.0.0.0:8081->80/tcp
```

This confirms that:

```text
Host Port 8081
      |
      v
Container Port 80
```

is configured correctly.

---

# 8. Verify the Nginx Page

The Nginx web server was tested from the host machine using:

```bash
curl localhost:8081
```

The response displayed the content of the `index.html` file.

Example:

```text
Hello from Bind Mount
```

This confirms that:

- Nginx is running.
- Port mapping is working.
- Nginx is listening on port `80`.
- The Bind Mount is working.
- Nginx is serving the host's `index.html`.

The request flow is:

```text
curl localhost:8081
        |
        v
Host Port 8081
        |
        v
Container Port 80
        |
        v
Nginx
        |
        v
/usr/share/nginx/html/index.html
        |
        v
HTTP Response
```

---

# 9. Verify the Bind Mount from Inside the Container

The running Nginx container was accessed using:

```bash
docker exec -it nginx-container bash
```

The Nginx HTML directory was inspected:

```bash
ls /usr/share/nginx/html
```

The `index.html` file was available inside the container.

The file was also inspected using:

```bash
cat /usr/share/nginx/html/index.html
```

This confirms that the host directory is mounted directly into the container.

The relationship is:

```text
Host index.html
       |
       | Bind Mount
       v
/usr/share/nginx/html/index.html
       |
       v
Nginx
```

---

# 10. Test Real-Time Bind Mount Synchronization

The `index.html` file was modified directly on the host machine.

For example:

```html
<h1>Hello from Docker Bind Mount</h1>
```

The Nginx page was then requested again:

```bash
curl localhost:8081
```

The updated content appeared immediately.

No image rebuild was required.

No container rebuild was required.

No container restart was required.

This demonstrates the main advantage of a Bind Mount during development.

The data flow is:

```text
Host File
    |
    | Modify
    v
Bind Mount
    |
    v
Container File
    |
    v
Nginx
    |
    v
Updated HTTP Response
```

Because the host directory is directly mounted into the container, changes made to the host files are immediately visible inside the container.

---

# 11. Verify Nginx Logs

The Named Volume was mounted to:

```text
/var/log/nginx
```

The Docker-managed storage location was inspected using:

```bash
sudo ls -la /var/lib/docker/volumes/nginx_logs/_data
```

The directory contained entries similar to:

```text
access.log -> /dev/stdout
error.log -> /dev/stderr
```

These are symbolic links.

The official Nginx Docker image redirects its access and error logs to:

```text
/dev/stdout
/dev/stderr
```

This allows Docker to capture the logs.

---

# 12. Generate Nginx Access Logs

A request was sent to the Nginx server:

```bash
curl localhost:8081
```

This generated an Nginx access log entry.

The logs were then viewed using:

```bash
docker logs nginx-container
```

Example:

```text
172.17.0.1 - - [12/Aug/2026:06:19:34 +0000] "GET / HTTP/1.1" 200 33 "-" "curl/7.81.0" "-"
```

Important parts of this log:

```text
GET /
```

The client requested the root URL.

```text
200
```

Nginx successfully returned the requested resource.

```text
curl/7.81.0
```

The request was generated using curl.

---

# 13. Understanding Nginx Logging in Docker

Although the volume was mounted to:

```text
/var/log/nginx
```

the access and error logs were represented as symbolic links:

```text
access.log -> /dev/stdout
error.log -> /dev/stderr
```

The logging architecture is:

```text
              Nginx
                |
        +-------+-------+
        |               |
        v               v
   Access Log       Error Log
        |               |
        v               v
   /dev/stdout      /dev/stderr
        |               |
        +-------+-------+
                |
                v
        Docker Logging
                |
                v
      docker logs nginx-container
```

Therefore, the correct way to inspect the Nginx logs in this Docker setup is:

```bash
docker logs nginx-container
```

This is an important containerization principle: applications commonly write logs to `stdout` and `stderr`, allowing Docker and external logging systems to collect and manage them.

---

# 14. Named Volume vs Bind Mount

This lab used two different Docker storage mechanisms.

## Named Volume

```bash
-v nginx_logs:/var/log/nginx
```

The left side is a Docker Volume name:

```text
nginx_logs
```

The right side is the path inside the container:

```text
/var/log/nginx
```

Docker manages the physical storage location.

Example:

```text
/var/lib/docker/volumes/nginx_logs/_data
```

Named Volumes are commonly used for persistent application data.

---

## Bind Mount

```bash
-v $(pwd):/usr/share/nginx/html
```

The left side is a real path on the host:

```text
$(pwd)
```

The right side is the path inside the container:

```text
/usr/share/nginx/html
```

The user controls the host location.

Bind Mounts are commonly useful during development because files can be edited directly on the host.

---

## Comparison

| Feature | Named Volume | Bind Mount |
|---|---|---|
| Managed by Docker | Yes | No |
| Host path selected manually | No | Yes |
| Docker controls storage location | Yes | No |
| Direct host file sharing | No | Yes |
| Common use | Persistent application data | Development and source code |
| Example | `nginx_logs:/var/log/nginx` | `$(pwd):/usr/share/nginx/html` |

---

# 15. Docker Container and Volume Lifecycle

An attempt was made to remove the `nginx_logs` volume while the Nginx container was still using it:

```bash
docker volume rm nginx_logs
```

Docker returned:

```text
Error response from daemon:
remove nginx_logs: volume is in use
```

This happened because the container still referenced the volume:

```text
nginx-container
      |
      | uses
      v
nginx_logs
```

Docker prevents deleting a volume that is still referenced by a container.

---

# 16. Stop the Container

The container was stopped using:

```bash
docker stop nginx-container
```

However, stopping the container did not remove it.

The stopped container still existed and still referenced the volume.

Therefore:

```text
Stopped Container
       |
       v
   nginx_logs
```

The volume could still not be deleted.

---

# 17. Remove the Container

The container was removed using:

```bash
docker rm nginx-container
```

After removing the container, the volume was no longer referenced.

The relationship became:

```text
nginx-container
      X
      |
      X
nginx_logs
```

---

# 18. Delete the Docker Volume

The volume was then removed using:

```bash
docker volume rm nginx_logs
```

The remaining Docker volumes were verified:

```bash
docker volume ls
```

The `nginx_logs` volume was no longer present.

---

# 19. Complete Lab Workflow

The complete workflow was:

```text
Create Docker Volume
        |
        v
Inspect Volume
        |
        v
Create index.html
        |
        v
Run Nginx Container
        |
        +----------------------+
        |                      |
        v                      v
Named Volume              Bind Mount
        |                      |
        v                      v
/var/log/nginx       /usr/share/nginx/html
        |                      |
        +----------+-----------+
                   |
                   v
                Nginx
                   |
                   v
             Port 80
                   |
                   v
             Host Port 8081
                   |
                   v
          curl localhost:8081
                   |
                   v
              HTTP Response
```

---

# 20. Key Takeaways

## Docker Named Volume

```bash
-v nginx_logs:/var/log/nginx
```

Provides Docker-managed persistent storage.

```text
nginx_logs
     |
     v
/var/log/nginx
```

---

## Docker Bind Mount

```bash
-v $(pwd):/usr/share/nginx/html
```

Shares a host directory directly with the container.

```text
Host Directory
      |
      v
/usr/share/nginx/html
```

---

## Docker Port Mapping

```bash
-p 8081:80
```

Maps:

```text
Host:      8081
              |
              v
Container: 80
              |
              v
           Nginx
```

---

## Container Logs

```bash
docker logs nginx-container
```

Displays the container's standard output and standard error streams.

---

## Container vs Volume

A container and a volume have independent lifecycles.

Stopping a container does not remove it:

```bash
docker stop nginx-container
```

Removing the container:

```bash
docker rm nginx-container
```

does not automatically remove a Named Volume.

The volume must be explicitly removed:

```bash
docker volume rm nginx_logs
```

---

# 21. Final Result

The lab successfully demonstrated:

- Docker Named Volume creation and inspection.
- Docker-managed persistent storage.
- Docker Bind Mount configuration.
- Nginx container deployment.
- Host-to-container port mapping.
- Host filesystem synchronization.
- Real-time updates through Bind Mounts.
- Nginx web serving.
- Nginx access log generation.
- Docker container log inspection.
- Nginx `stdout` and `stderr` logging behavior.
- Docker container lifecycle management.
- Docker volume lifecycle management.
- Proper Docker resource cleanup.

---

# Conclusion

This lab provided practical hands-on experience with Docker storage using both **Named Volumes** and **Bind Mounts**.

The Named Volume was used to demonstrate Docker-managed storage, while the Bind Mount was used to share the host's web content with the Nginx container.

The lab also demonstrated port mapping, real-time file synchronization, Nginx logging, container inspection, and proper Docker resource cleanup.

These concepts are fundamental for working with Docker and are commonly used in real-world DevOps environments.
