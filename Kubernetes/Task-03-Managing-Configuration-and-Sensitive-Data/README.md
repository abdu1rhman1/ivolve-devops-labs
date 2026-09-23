# Task 03 — Managing Configuration and Sensitive Data in Kubernetes

## Overview

This task demonstrates how to manage application configuration and sensitive data in Kubernetes using **ConfigMaps** and **Secrets**, then consume them inside a **StatefulSet** running a MySQL database, exposed internally through a **headless Service**.

The goal is to separate *what* the application needs to run (configuration and credentials) from *how* it runs (the container itself), and to understand why a stateful, identity-sensitive workload like a database needs a StatefulSet instead of a regular Deployment.

---

## Objectives

- Store non-sensitive configuration in a `ConfigMap`.
- Store sensitive credentials in a `Secret`.
- Expose MySQL internally with a headless `Service`.
- Deploy MySQL as a `StatefulSet` with persistent storage.
- Inject ConfigMap/Secret values into the container as environment variables.
- Verify the database is running and actually receiving the injected values.

---

## Technologies Used

Kubernetes · kubectl · YAML · MySQL · Kind (Kubernetes IN Docker)

---

## Environment

| Component | Version |
|---|---|
| OS | Ubuntu 22.04.5 LTS |
| Kind | v0.33.0 |
| Kubernetes | v1.37.0 |
| kubectl | v1.36.3 |
| MySQL Image | mysql:8.0 |

---

## 1. Repository Files

```
Task-03-Managing-Configuration-and-Sensitive-Data/
├── README.md
├── ConfigMap.yml
├── Secret.yml
├── mysql-service.yml
└── mysql-statefulset.yml
```

---

## 2. Architecture

### Cluster-level view

```text
                    Kubernetes Cluster
                           │
             ┌─────────────┴─────────────┐
             │                           │
       Control Plane                  Worker
       taint-lab-control-plane       taint-lab-worker
             │                           │
   Taint: NoSchedule (default)      Taint: none
```

### Target state inside the `ivolve` Namespace

```text
Namespace: ivolve
│
├── ConfigMap (ivolve-configmap)
│     ├── DB_HOST = mysql
│     └── DB_USER = ivolve_user
│
├── Secret (ivolve-secret)
│     ├── DB_PASSWORD
│     └── MYSQL_ROOT_PASSWORD
│
├── Service (mysql) — headless
│
└── StatefulSet (mysql)
      │
      └── mysql-0
            │
            └── MySQL Container
                  ├── env vars ← ConfigMap + Secret
                  └── /var/lib/mysql ← PersistentVolumeClaim (1Gi)
```

---

## 3. ConfigMap — Non-Sensitive Configuration

**`ConfigMap.yml`**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ivolve-configmap
  namespace: ivolve
data:
  DB_HOST: mysql
  DB_USER: ivolve_user
```

```bash
kubectl apply -f ConfigMap.yml
```

---

## 4. Secret — Sensitive Credentials

**`Secret.yml`**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: ivolve-secret
  namespace: ivolve
type: Opaque
data:
  DB_PASSWORD: aXZvbHZlLXBhc3N3b3Jk
  MYSQL_ROOT_PASSWORD: cm9vdC1wYXNzd29yZA==
```

```bash
kubectl apply -f Secret.yml
```

> ⚠️ The values above are **Base64-encoded, not encrypted**. Base64 is a reversible encoding, not a security mechanism — anyone with `kubectl get secret -o yaml` access can decode it instantly:
> ```bash
> echo "aXZvbHZlLXBhc3N3b3Jk" | base64 -d
> ```
> A `Secret` is safer than a `ConfigMap` mainly because Kubernetes treats it differently at the platform level (RBAC can restrict `secrets` as a distinct resource type, it's excluded from `kubectl describe` output by default, and it can be encrypted at rest in `etcd` if the cluster is configured to do so). It is **not** inherently encrypted by default — for real secret management, tools like **Sealed Secrets** or **HashiCorp Vault** are used on top of it.

---

## 5. Service — Why It Must Be Headless

**`mysql-service.yml`**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql
  namespace: ivolve
spec:
  clusterIP: None
  selector:
    app: mysql
  ports:
    - port: 3306
      targetPort: 3306
```

| Field | Purpose |
|---|---|
| `clusterIP: None` | Makes the Service **headless** — no load-balancing, no single virtual IP |
| `selector: app: mysql` | Must match the Pod template's labels in the StatefulSet |

**Why headless, and not a normal Service?**

A normal (ClusterIP) Service load-balances traffic across all matching Pods behind one shared IP — fine for stateless apps where any replica can answer, but wrong for a database. A StatefulSet's Pods each need a **stable, individually addressable DNS identity** (`mysql-0.mysql`, `mysql-1.mysql`, ...) so that replication, primary/replica roles, and client connections can target a *specific* instance rather than "whichever Pod answers first."

```text
Normal Service            Headless Service
─────────────             ──────────────────
   Client                     Client
     │                           │
     ▼                           ▼
 Single VIP               DNS resolves directly
     │                     to each Pod's own IP
 ┌───┴───┐                 ┌────────┬────────┐
 Pod-A   Pod-B          mysql-0   mysql-1  mysql-2
(any one answers)      (each individually addressable)
```

---

## 6. StatefulSet — Consuming ConfigMap & Secret

**`mysql-statefulset.yml`**
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
  namespace: ivolve
spec:
  serviceName: mysql
  replicas: 1
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
        - name: mysql
          image: mysql:8.0
          ports:
            - containerPort: 3306
          env:
            - name: MYSQL_ROOT_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: ivolve-secret
                  key: MYSQL_ROOT_PASSWORD
            - name: MYSQL_DATABASE
              value: ivolve_db
            - name: MYSQL_USER
              valueFrom:
                configMapKeyRef:
                  name: ivolve-configmap
                  key: DB_USER
            - name: MYSQL_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: ivolve-secret
                  key: DB_PASSWORD
          volumeMounts:
            - name: mysql-data
              mountPath: /var/lib/mysql
  volumeClaimTemplates:
    - metadata:
        name: mysql-data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 1Gi
```

| Reference type | Used for | Example |
|---|---|---|
| `configMapKeyRef` | Pulling a value from a `ConfigMap` key | `MYSQL_USER` ← `DB_USER` |
| `secretKeyRef` | Pulling a value from a `Secret` key | `MYSQL_ROOT_PASSWORD` ← `MYSQL_ROOT_PASSWORD` |

**Why `volumeClaimTemplates` and not a shared `volumes:` block?** This is the core difference between a `StatefulSet` and a `Deployment`. Each replica gets its **own dedicated `PersistentVolumeClaim`**, created automatically and named predictably (`mysql-data-mysql-0`), so data survives Pod restarts and isn't shared/overwritten between replicas.

```bash
kubectl apply -f mysql-service.yml
kubectl apply -f mysql-statefulset.yml
```

---

## 7. Verification

```bash
kubectl get pods -n ivolve
kubectl get statefulset -n ivolve
kubectl get pvc -n ivolve
```

```text
NAME      READY   STATUS    RESTARTS   AGE
mysql-0   1/1     Running   0          2m48s

NAME    READY   AGE
mysql   1/1     8m24s

NAME                 STATUS   VOLUME                CAPACITY   ACCESS MODES
mysql-data-mysql-0   Bound    pvc-6a985cf6-...       1Gi        RWO
```

**Confirm the ConfigMap/Secret values actually reached the container** (a `Running` Pod alone doesn't prove the injection worked):

```bash
kubectl exec -it mysql-0 -n ivolve -- env | grep -E "MYSQL|DB_"
```

Expected:
```text
MYSQL_ROOT_PASSWORD=root-password
MYSQL_DATABASE=ivolve_db
MYSQL_USER=ivolve_user
MYSQL_PASSWORD=ivolve-password
```

---

## 8. Problems Encountered & Fixes

Two unrelated issues surfaced while working through this task — both are common traps in any real Kubernetes environment, not mistakes specific to this lab.

### Problem 1 — Leftover Node Taint from an Earlier Task

**Symptom:** No symptom yet at this stage, but relevant because it recurred as the same class of issue as the fix below — a lab environment carrying state from a *previous, unrelated* task.

**Check before starting any new task:**
```bash
kubectl describe nodes | grep Taints
```
```text
Taints:  node-role.kubernetes.io/control-plane:NoSchedule   (default — expected)
Taints:  <none>                                              (worker — clean)
```

**Fix, if a leftover taint exists:**
```bash
kubectl taint nodes <worker-node-name> node=worker:NoSchedule-
```

### Problem 2 — `mysql-0` Stuck, StatefulSet `0/1` Ready

**Symptom:**
```text
kubectl get statefulset -n ivolve
mysql   0/1   26s

kubectl get pods -n ivolve
# mysql-0 doesn't even appear
```

**Root cause:** The `ivolve` namespace still held **two unrelated Pods (`pod1`, `pod2`) and an active `ResourceQuota`** (`apply-only2pods`, limit: 2) left over from an earlier task on the same namespace. The quota was already at its 2/2 cap, so the API server rejected `mysql-0` before it could even be created — the StatefulSet kept retrying silently in the background.

```text
Quota state:        pod1 (old) + pod2 (old) = 2/2 used
mysql-0 request  →  rejected: exceeded quota
```

**Fix:**
```bash
kubectl delete pod pod1 pod2 -n ivolve
kubectl delete resourcequota apply-only2pods -n ivolve
kubectl apply -f mysql-statefulset.yml   # re-apply to trigger retry
```

After clearing the quota, `mysql-0` was created immediately and reached `Running`.

**Lesson:** ResourceQuota controls *how many* Pods may exist; the Scheduler/Taints control *where* they may run. Both are independent gates a Pod must pass, and both can silently block a workload with no error visible unless you check `kubectl describe pod` or the controller's retry state directly. Reusing the same namespace across unrelated lab tasks is the recurring root cause — a dedicated namespace per task (or cleaning up before starting a new one) avoids this class of problem entirely.

---

## 9. Key Concepts

| Concept | Definition |
|---|---|
| **ConfigMap** | Stores non-sensitive configuration data as key-value pairs, consumable as env vars, CLI args, or mounted files |
| **Secret** | Stores sensitive data (credentials, tokens); Base64-encoded at rest, not encrypted by default — encryption at rest and RBAC restriction must be configured separately |
| **Headless Service** | A Service with `clusterIP: None`; gives each Pod a stable, individually resolvable DNS name instead of load-balancing across replicas |
| **StatefulSet** | A workload controller for stateful applications; provides stable Pod identity (`name-0`, `name-1`, ...) and a dedicated PersistentVolumeClaim per replica via `volumeClaimTemplates` |
| **PersistentVolumeClaim (PVC)** | A request for storage that persists independently of the Pod's lifecycle |

---

## 10. What This Task Demonstrates

- Separating configuration (`ConfigMap`) from sensitive data (`Secret`).
- Injecting both into a container via `configMapKeyRef` / `secretKeyRef`.
- Understanding why stateful workloads need a headless Service and a StatefulSet instead of a Deployment.
- Diagnosing a workload silently blocked by a `ResourceQuota` inherited from a previous task, and distinguishing that from a node-scheduling (taint) issue.
- Verifying configuration injection at the container level, not just Pod status.

---

## Author

**Abdulrhman Mohammed**
Cloud & DevOps Engineer
[LinkedIn](https://www.linkedin.com/in/abdulrhman-mohammed-b22609389)

