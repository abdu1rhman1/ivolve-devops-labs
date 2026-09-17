# Task 07 - Docker Network for Microservices

## Objective

In this task, we build and run a simple frontend/backend microservices application using Docker.
The main goal is to understand how Docker containers communicate with each other through a custom bridge network, and how network isolation works.

---

## Project Structure

```text
Task-07-Docker-Network-for-Microservices/
├── backend/
│   ├── app.py
│   └── Dockerfile
└── frontend/
    ├── app.py
    ├── requirements.txt
    └── Dockerfile
```

---

## Backend Application

The backend is a simple Flask application running on port 5000.

**backend/app.py**
```python
from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return "Hello from Backend!"

app.run(host='0.0.0.0', port=5000)
```

**backend/Dockerfile**
```dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY app.py .

RUN pip install flask

EXPOSE 5000

CMD ["python", "app.py"]
```

- `WORKDIR /app` creates/uses `/app` as the working directory inside the image, so the app lives at `/app/app.py`.
- `EXPOSE 5000` documents that the Flask app listens on port 5000 inside the container. It does **not** publish the port to the host.

---

## Frontend Application

The frontend is also a Flask application, but it additionally uses the `requests` library to communicate with the backend.

**frontend/app.py**
```python
import requests
from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    try:
        r = requests.get("http://backend:5000")
        return f"Frontend received: {r.text}"
    except:
        return "Could not connect to backend."

app.run(host='0.0.0.0', port=5000)
```

The important part is:

```
http://backend:5000
```

`backend` is the name of the backend container. Docker's internal DNS resolves the container name to its IP address when both containers are connected to the same user-defined Docker network.

**frontend/requirements.txt**
```
flask
requests
```

**frontend/Dockerfile**
```dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY app.py .

EXPOSE 5000

CMD ["python", "app.py"]
```

---

## Build the Images

### Build Backend Image

```bash
cd ~/Docker5/backend
docker build -t backendimage .
```

Verify:
```bash
docker images
```

Check the working directory:
```bash
docker inspect backendimage --format '{{.Config.WorkingDir}}'
```
Expected: `/app`

Check the exposed port:
```bash
docker inspect backendimage --format '{{.Config.ExposedPorts}}'
```
Expected: `map[5000/tcp:{}]`

Check the command:
```bash
docker inspect backendimage --format '{{json .Config.Cmd}}'
```
Expected: `["python","app.py"]`

### Build Frontend Image

```bash
cd ~/Docker5/frontend
docker build -t frontendimage .
```

Verify:
```bash
docker images
```

At this point we have:
```
backendimage
frontendimage
```

---

## Docker Network Drivers

| Driver | Description |
|--------|-------------|
| `bridge` | Creates a virtual Docker network that allows containers on the same network to communicate. |
| `host`   | The container uses the host's network directly, with no normal Docker network isolation. |
| `null`   | Disables network connectivity for the container. |

---

## Create the Custom Docker Network

```bash
docker network create \
  --driver bridge \
  --subnet 192.168.10.0/24 \
  ivolve-network
```

Verify:
```bash
docker network ls
```

Expected:
```
NETWORK ID     NAME             DRIVER    SCOPE
...            bridge           bridge    local
...            host             host      local
...            ivolve-network   bridge    local
...            none             null      local
```

Network configuration:
```
Network name: ivolve-network
Driver:       bridge
Subnet:       192.168.10.0/24
Gateway:      192.168.10.1
```

---

## Run the Containers

### Run Backend Container

```bash
docker run -d \
  --name backend \
  --network ivolve-network \
  backendimage:latest
```

Check running containers:
```bash
docker ps
```
The backend shows `5000/tcp` with no host port mapping — it only needs to communicate with other containers on the same network, so `-p 5000:5000` is not used.

Check the backend's IP:
```bash
docker inspect backend --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
```
Example: `192.168.10.2`

### Run Frontend1 (on ivolve-network)

```bash
docker run -d \
  --name frontend1 \
  --network ivolve-network \
  frontendimage:latest
```

Check its IP:
```bash
docker inspect frontend1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
```
Example: `192.168.10.3`

Both `backend` and `frontend1` are now connected to `ivolve-network` (`192.168.10.0/24`).

### Run Frontend2 (on default network)

```bash
docker run -d \
  --name frontend2 \
  frontendimage:latest
```

Since `--network` was not specified, Docker connects `frontend2` to the default bridge network.

Check its IP:
```bash
docker inspect frontend2 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
```
Example: `172.17.0.3`

Network layout at this point:
```
ivolve-network
├── backend
└── frontend1

default bridge
└── frontend2
```

---

## Verify Communication

### Frontend1 → Backend (same network)

```bash
docker exec -it frontend1 bash
python
```
```python
import requests
r = requests.get("http://backend:5000")
print(r.text)
```
Expected:
```
Hello from Backend!
```

This proves `frontend1` can reach `backend` by name, since Docker's internal DNS resolves `backend` to its container IP — no hard-coded IP address needed.

### Frontend2 → Backend (different network)

```bash
docker exec -it frontend2 bash
python
```
```python
import requests
r = requests.get("http://backend:5000", timeout=5)
```
Result: fails with an error similar to:
```
Name or service not known
```

This is **expected**. `frontend2` is on the default `bridge` network while `backend` is on `ivolve-network` — they are on different networks, so DNS resolution and connectivity fail.

### Inspect the Custom Network

```bash
docker network inspect ivolve-network
```

The `Containers` section should only list `backend` and `frontend1` — confirming `frontend2` is isolated from this network.

---

## Network Isolation Summary

```
                    Docker Host
                         |
          +--------------+--------------+
          |                             |
   ivolve-network                  default bridge
   192.168.10.0/24                172.17.0.0/16
          |                             |
     +----+----+                        |
     |         |                        v
     v         v                    frontend2
  backend   frontend1                 :5000
  :5000       :5000
     ^         |
     |         |
     +---------+
     Communication
```

| Test                     | Result       |
|--------------------------|---------------|
| frontend1 → backend      | ✅ Success    |
| frontend2 → backend      | ❌ Failed (expected) |

The failure is intentional and demonstrates Docker network isolation.

---

## Port Mapping vs. Docker Networking

**Port mapping** (`-p host:container`) is used when something *outside* Docker (the host or an external client) needs to reach the container:
```
Host:8080 → Container:5000
```

**Docker networking** (`--network`) is used for *container-to-container* communication:
```
frontend1 → (ivolve-network) → backend
```

Since `frontend1` only needs to reach `backend` internally via `http://backend:5000`, the backend never needed `-p 5000:5000`.

## EXPOSE vs. Port Mapping

- `EXPOSE 5000` — documents that the app listens on port 5000 inside the container. Does not publish anything.
- `-p 8080:5000` — actually publishes the container's port 5000 to port 8080 on the host.

---

## Delete the Custom Network

Disconnect the containers first:
```bash
docker network disconnect ivolve-network backend
docker network disconnect ivolve-network frontend1
```

Remove the network:
```bash
docker network rm ivolve-network
```

Verify it's gone:
```bash
docker network ls
```
`ivolve-network` should no longer appear in the list.

---

## What Was Learned

- Writing Dockerfiles for Python/Flask applications
- Using `WORKDIR`, `COPY`, and `EXPOSE`
- Installing dependencies via `requirements.txt` and directly with `pip`
- Creating a custom Docker bridge network with a defined subnet
- Running containers on a specific user-defined network
- Docker's internal DNS for container name resolution
- Container-to-container communication vs. host-to-container port mapping
- Network isolation between custom and default bridge networks
- Removing a Docker network

---

## Task Result

| Requirement                          | Status |
|---------------------------------------|--------|
| Backend Docker image                  | ✅ |
| Frontend Docker image                 | ✅ |
| Custom `ivolve-network` (subnet /24)  | ✅ |
| Backend container on `ivolve-network` | ✅ |
| Frontend1 on `ivolve-network`         | ✅ |
| Frontend2 on default bridge           | ✅ |
| Frontend1 → Backend communication     | ✅ |
| Frontend2 → Backend communication     | ❌ Expected |
| Docker DNS resolution                 | ✅ |
| Network isolation demonstrated        | ✅ |
| `ivolve-network` deleted              | ✅ |

