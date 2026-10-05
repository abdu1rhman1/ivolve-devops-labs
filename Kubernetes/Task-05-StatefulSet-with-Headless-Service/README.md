# Task 05 — StatefulSet with Headless Service

## Overview

This task builds a complete, self-contained MySQL deployment on Kubernetes using a **StatefulSet**, a manually provisioned **PersistentVolume/PersistentVolumeClaim** pair, a **Secret** for credentials, a **toleration** to allow scheduling on a tainted worker node, and a **headless Service** for stable Pod networking — then verifies the database is actually operational by connecting with the MySQL client.

Unlike earlier tasks, storage here is **static and manual** end-to-end (a hand-written PV + PVC), rather than relying on `volumeClaimTemplates` to auto-provision storage per replica.

---

## Objectives

1. Create a StatefulSet with 1 replica running MySQL.
2. Configure the StatefulSet Pod to consume the root password from a Secret.
3. Add a toleration to the Pod spec for the taint key `node=worker` with effect `NoSchedule`.
4. Configure a PersistentVolumeClaim and mount it to `/var/lib/mysql`.
5. Write a headless Service (`clusterIP: None`) targeting the StatefulSet Pods.
6. Confirm the database is operational by connecting with a MySQL client.

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

> The cluster for this task (`statefulset-lab`) was created fresh — the previous lab cluster had been deleted outside of this task, so the namespace, Secret, PVC and taint all had to be rebuilt from scratch here rather than reused.

---

## 1. Repository Files

```
Task-05-StatefulSet-with-Headless-Service/
├── README.md
├── kind-config.yml
├── namespace.yml
├── secret.yml
├── pv.yml
├── pvc.yml
├── statefulset.yml
└── service.yml
```

---

## 2. Architecture

```text
Kubernetes Cluster (statefulset-lab)
│
├── Control Plane
│   └── Taint: node-role.kubernetes.io/control-plane:NoSchedule (default)
│
└── Worker
    └── Taint: node=worker:NoSchedule (added manually for this task)

Namespace: namespace1
│
├── Secret (mysql-secret)
│     └── MYSQL_ROOT_PASSWORD
│
├── PersistentVolumeClaim (mysql-pvc) ── Bound ──► PersistentVolume (mysql-pv)
│                                                         └── hostPath: /mnt/mysql-data
│
├── Service (mysql) — headless, clusterIP: None
│
└── StatefulSet (mysql-statefulset)
      │
      └── mysql-statefulset-0
            ├── toleration: node=worker:NoSchedule
            ├── env: MYSQL_ROOT_PASSWORD ← Secret
            └── /var/lib/mysql ← mysql-pvc
```

---

## 3. Cluster Setup

**`kind-config.yml`**
```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
  - role: worker
```

```bash
kind create cluster --name statefulset-lab --config kind-config.yml --wait 5m
kubectl get nodes
```

> Kind does not support a `name:` field per node in `v1alpha4` — node names are generated automatically from the cluster name (`statefulset-lab-control-plane`, `statefulset-lab-worker`).

### Add the taint the toleration must match

```bash
kubectl taint nodes statefulset-lab-worker node=worker:NoSchedule
kubectl describe nodes | grep Taints
```
```text
Taints:  node-role.kubernetes.io/control-plane:NoSchedule
Taints:  node=worker:NoSchedule
```

> A toleration with no matching taint has no effect — it's a "pass" for a restriction that doesn't exist yet. The taint has to be applied first for the toleration in the StatefulSet to mean anything.

---

## 4. Namespace

**`namespace.yml`**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: namespace1
```

```bash
kubectl apply -f namespace.yml
```

---

## 5. Secret — Root Password

**`secret.yml`**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mysql-secret
  namespace: namespace1
type: Opaque
data:
  MYSQL_ROOT_PASSWORD: cm9vdHBhc3N3b3Jk
```

```bash
kubectl apply -f secret.yml
```

> ⚠️ **Encoding pitfall:** `echo "rootpassword" | base64` appends a trailing newline to the encoded value, producing `cm9vdHBhc3N3b3JkCg==` instead of the clean `cm9vdHBhc3N3b3Jk`. Always use `echo -n` when Base64-encoding a value for a Secret — the extra `\n` becomes part of the actual password Kubernetes stores, which can silently break authentication later.

---

## 6. PersistentVolume & PersistentVolumeClaim

Unlike the MySQL StatefulSet in an earlier task (which used `volumeClaimTemplates` to auto-provision a PVC per replica), this task explicitly provisions a **static PV** and a separate PVC, matched manually.

**`pv.yml`**
```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: mysql-pv
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  hostPath:
    path: /mnt/mysql-data
    type: DirectoryOrCreate
```

| Field | Why this value |
|---|---|
| `accessModes: [ReadWriteOnce]` | Only one replica (`replicas: 1`) ever uses this volume — RWX (used in the earlier logging task) isn't needed here |
| `hostPath.path: /mnt/mysql-data` | A dedicated path **on the node's filesystem** — deliberately *not* `/var/lib/mysql`, which is the path *inside the container*. Reusing that path on the node itself would be an unrelated, meaningless directory with no connection to MySQL |
| `type: DirectoryOrCreate` | Lets Kubernetes create the directory automatically — no manual `mkdir` step needed on the node |

**`pvc.yml`**
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-pvc
  namespace: namespace1
spec:
  resources:
    requests:
      storage: 1Gi
  accessModes:
    - ReadWriteOnce
  storageClassName: ""
```

> `storageClassName: ""` disables the cluster's default `StorageClass`, which would otherwise try to **dynamically provision a brand-new PV** instead of binding to the one created manually here — the same StorageClass mismatch that caused a `Pending` PVC in an earlier task.

```bash
kubectl apply -f pv.yml
kubectl apply -f pvc.yml
kubectl get pvc -n namespace1
```

```text
NAME        STATUS   VOLUME     CAPACITY   ACCESS MODES
mysql-pvc   Bound    mysql-pv   1Gi        RWO
```

---

## 7. StatefulSet

**`statefulset.yml`**
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql-statefulset
  namespace: namespace1
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
          env:
            - name: MYSQL_ROOT_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: mysql-secret
                  key: MYSQL_ROOT_PASSWORD
          volumeMounts:
            - name: mysql-storage
              mountPath: /var/lib/mysql
      tolerations:
        - key: "node"
          operator: "Equal"
          value: "worker"
          effect: "NoSchedule"
      volumes:
        - name: mysql-storage
          persistentVolumeClaim:
            claimName: mysql-pvc
```

### How the pieces connect

| Link | Must match |
|---|---|
| `spec.serviceName` | The headless Service's `metadata.name` (section 8) |
| `spec.selector.matchLabels.app` | `template.metadata.labels.app` |
| `volumeMounts[].name` | `volumes[].name` — this is what binds the mount point inside the container to the actual volume source |
| `volumes[].persistentVolumeClaim.claimName` | `pvc.yml`'s `metadata.name` (`mysql-pvc`) — **not** a StorageClass, and not something auto-generated; this references the manually created PVC by name |
| `tolerations[].key/value/effect` | Must exactly match the taint applied to the worker node (`node=worker:NoSchedule`) |

```bash
kubectl apply -f statefulset.yml
kubectl get pods -n namespace1
```
```text
NAME                  READY   STATUS    RESTARTS   AGE
mysql-statefulset-0   1/1     Running   0          92s
```

---

## 8. Headless Service

**`service.yml`**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql
  namespace: namespace1
spec:
  selector:
    app: mysql
  ports:
    - port: 3306
      targetPort: 3306
  clusterIP: None
```

```bash
kubectl apply -f service.yml
kubectl get svc -n namespace1
```
```text
NAME    TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)    AGE
mysql   ClusterIP   None         <none>        3306/TCP   21s
```

`CLUSTER-IP: None` confirms the Service is genuinely headless — no load-balancing IP, DNS resolves directly to the Pod itself (`mysql-statefulset-0.mysql`).

---

## 9. Verification — Connecting with the MySQL Client

A `Running` status alone doesn't prove the database is actually usable — the real test is connecting to it:

```bash
kubectl exec -it mysql-statefulset-0 -n namespace1 -- mysql -u root -p
```

```sql
SHOW DATABASES;
```

```text
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql               |
| performance_schema  |
| sys                 |
+--------------------+
4 rows in set (0.00 sec)
```

This confirms both the root password injection from the Secret and the MySQL server itself are working end-to-end.

---

## 10. Problems Encountered & Fixes

A number of small YAML mistakes surfaced while building the manifests — documented here because they're common, easy-to-make errors, not one-off mistakes.

| Mistake | Symptom | Fix |
|---|---|---|
| `kind: namespace` (lowercase) | `no matches for kind "namespace"` | `kind` values are case-sensitive — must be `Namespace` |
| Base64 value included a trailing newline (`echo` instead of `echo -n`) | Password mismatch risk at connection time | Always Base64-encode secrets with `echo -n "value" \| base64` |
| `capcity:` instead of `resources:` in the PVC | `unknown field "spec.capcity"` | `capacity` is a **PV** field; a PVC uses `resources.requests.storage` |
| `AcceccModes`, `ReadWriteOnly` (typo'd field name and a non-existent value) | Schema validation errors | Valid values are exactly `ReadWriteOnce`, `ReadOnlyMany`, `ReadWriteMany` — abbreviations like `RWO`/`RWX` are not valid YAML values, only display shorthand |
| `storageClassName: mysql-pv` (the PV's *name* used as a StorageClass) | Conceptual confusion, not a syntax error | `storageClassName` controls dynamic provisioning eligibility — it is **not** how a PVC references a specific PV. PVC↔PV binding happens automatically based on matching capacity/access mode/StorageClass, never by naming the PV directly |
| `reasources:` (typo) | `unknown field "spec.reasources"` | Simple misspelling of `resources` |
| `matedata:` (typo) | YAML parses but the field is silently ignored/invalid | Misspelling of `metadata` |
| `kind: Services` (plural) | Resource type not found | Kubernetes `kind` values are always singular, even for objects that manage multiple instances |
| `port: 3306` as a direct field instead of inside a `ports:` list | Schema error | `ports` is always a list, even for a single port — a Service can expose multiple ports at once |
| `targetport` (lowercase p) | `unknown field` | Kubernetes field names use camelCase — `targetPort`, not `targetport` |

**General lesson:** nearly all of these were caught immediately by `kubectl apply --dry-run=server`, which validates the manifest against the live API schema before anything is created. Running a dry-run before every `apply` — not just when something looks wrong — would have caught each of these on the first try instead of through trial and error.

---

## 11. Key Concepts

| Concept | Definition |
|---|---|
| **StatefulSet** | A controller for workloads needing stable identity and storage per replica (`pod-0`, `pod-1`, ...) that persists across restarts — unlike a Deployment, where replaced Pods get a new random name and no guaranteed storage continuity |
| **Toleration** | A Pod-level spec that allows scheduling onto a node with a matching taint; it has no effect unless a matching taint actually exists on a node |
| **Static provisioning** | Manually creating a PV and a matching PVC, as opposed to dynamic provisioning via a StorageClass |
| **`storageClassName: ""`** | Explicitly opts a PVC out of dynamic provisioning, so it can bind only to a pre-existing, manually created PV |
| **Headless Service** | A Service with `clusterIP: None`; DNS resolves directly to individual Pod IPs instead of load-balancing through a shared virtual IP |
| **`volumes` vs. `volumeMounts`** | `volumes` declares *where a storage source comes from* (e.g. a specific PVC); `volumeMounts` declares *where inside the container* that named source is attached. The `name` field links the two — a mismatch produces a "volume not found" error |

---

## 12. What This Task Demonstrates

- Building a complete StatefulSet-backed database from scratch: namespace, Secret, static PV/PVC, StatefulSet, and headless Service.
- Explicit static provisioning and PV/PVC binding, as an alternative to `volumeClaimTemplates`.
- Combining taints/tolerations with a stateful workload so it can be scheduled on an otherwise restricted node.
- Diagnosing and fixing a realistic sequence of YAML schema errors using `kubectl apply --dry-run=server` and the API's own error messages.
- End-to-end verification by actually connecting to the database and running a query — not just checking Pod status.

---

## Author

**Abdulrhman Mohammed**
Cloud & DevOps Engineer
[LinkedIn](https://www.linkedin.com/in/abdulrhman-mohammed-b22609389)

