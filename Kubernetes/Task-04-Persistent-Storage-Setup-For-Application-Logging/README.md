# Task 04 — Persistent Storage Setup for Application Logging

## Overview

This task demonstrates how to configure persistent storage in Kubernetes for application logging using a **PersistentVolume (PV)**, a **PersistentVolumeClaim (PVC)**, `hostPath` storage, the `ReadWriteMany` (RWX) access mode, and a `Retain` reclaim policy.

The goal is to create a storage location for application logs that stays available **independently of any single Pod's lifecycle** — logs survive Pod restarts, crashes, or replacements.

---

## Objectives

1. Define a `PersistentVolume` with:
   - Size: `1Gi`
   - Storage type: `hostPath`
   - Path: `/mnt/app-logs`
   - Access mode: `ReadWriteMany`
   - Reclaim policy: `Retain`
2. Define a `PersistentVolumeClaim` requesting `1Gi` storage with `ReadWriteMany` access mode.
3. Ensure the PVC successfully binds to the created PV.

---

## Technologies Used

Kubernetes · kubectl · Kind · PersistentVolume (PV) · PersistentVolumeClaim (PVC) · hostPath · StorageClass

---

## Environment

```text
NAME                      STATUS   ROLES
taint-lab-control-plane   Ready    control-plane
taint-lab-worker          Ready    <none>
```

The Kubernetes nodes run as Docker containers because the cluster was created with Kind. The worker node was used to prepare the required host path (`/mnt/app-logs`).

---

## 1. Core Concepts — PV vs. PVC

| | PersistentVolume (PV) | PersistentVolumeClaim (PVC) |
|---|---|---|
| **What it is** | Storage made available to the cluster | A request for storage made by a workload |
| **Describes** | How much storage exists, how it can be accessed, where it comes from, what happens after release | How much storage is needed, what access mode is required |
| **Scope** | Cluster-scoped (no namespace) | Namespace-scoped |

```text
Application
     │
     ▼
    PVC  ──── binds to ────►  PV  ────►  Actual Storage
```

**Simple way to remember it:**
```text
PV  → "I have storage."
PVC → "I need storage."
Kubernetes → "These two match, so I will bind them."
```

### Architecture for this task

```text
Kubernetes Cluster
│
├── Namespace: ivolve
│   │
│   └── PersistentVolumeClaim
│       └── app-logs-pvc
│
└── PersistentVolume (cluster-scoped, no namespace)
    └── app-logs-pv
        │
        └── hostPath
            └── /mnt/app-logs
```

---

## 2. Step 1 — Prepare the Host Path

Because the task requires the exact path `/mnt/app-logs`, the directory was created directly on the Kind worker node (which is itself a Docker container).

```bash
docker exec -it taint-lab-worker bash
```

| Part | Meaning |
|---|---|
| `docker exec` | Run a command inside an already-running container |
| `-i` | Keep STDIN open |
| `-t` | Allocate a terminal (combined: `-it` = interactive shell) |
| `taint-lab-worker` | The Kind worker node container |
| `bash` | Start a Bash shell inside it |

Inside the worker node:
```bash
mkdir -p /mnt/app-logs
ls -ld /mnt/app-logs/
```

```text
drwxr-xr-x 2 root root ... /mnt/app-logs/
```

```bash
exit
```

### ⚠️ Important `hostPath` limitation

`/mnt/app-logs` belongs to the filesystem of **one specific node**, not the cluster as a whole. Since this cluster runs on Kind, each node is a separate Docker container with its own filesystem:

```text
Ubuntu VM
│
├── Docker
│
├── taint-lab-control-plane
│     └── its own filesystem
│
└── taint-lab-worker
      └── its own filesystem
          └── /mnt/app-logs
```

The directory created inside `taint-lab-worker` does **not** automatically exist inside `taint-lab-control-plane`, nor directly on the Ubuntu VM's own filesystem. This is the key difference between `hostPath` and genuine shared storage — covered in more depth in section 9.

---

## 3. Step 2 — Create the PersistentVolume

**`pv.yml`**
```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: app-logs-pv
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  hostPath:
    path: /mnt/app-logs
    type: DirectoryOrCreate
```

| Field | Meaning |
|---|---|
| `metadata.name` | Name of the PV — no `namespace` here, since a PV is cluster-scoped |
| `capacity.storage: 1Gi` | Storage capacity this PV provides |
| `accessModes: [ReadWriteMany]` | Declares RWX — read + write from multiple Pods (see limitations in section 9) |
| `persistentVolumeReclaimPolicy: Retain` | Storage and data are kept even after the PVC is deleted (see section 4) |
| `hostPath.path` | The directory on the node's filesystem backing this volume |
| `hostPath.type: DirectoryOrCreate` | If the directory doesn't already exist, Kubernetes creates it automatically — removes the dependency on the manual `mkdir` step above, making the manifest self-contained |

---

## 4. Reclaim Policy — `Retain` vs. `Delete`

| Policy | Behavior |
|---|---|
| `Retain` | PV and its data are kept after the PVC is deleted — requires manual cleanup/reuse |
| `Delete` | The underlying storage may be deleted automatically when the claim is released (backend-dependent) |
| `Recycle` | *(Deprecated)* Used to wipe and re-offer the volume |

```text
PVC deleted
     │
     ▼
PV/storage remains   ← because reclaimPolicy: Retain
     │
     ▼
Data is preserved
```

`Retain` was chosen here because these are **application logs** — accidentally deleting a PVC should not silently destroy historical log data.

---

## 5. Step 3 — Validate Before Creating (Dry Run)

```bash
kubectl apply --dry-run=server -f pv.yml
```

```text
persistentvolume/app-logs-pv created (server dry run)
```

The resource is **not actually created** — Kubernetes only validates the request.

| Type | Command | What it checks |
|---|---|---|
| Client-side | `kubectl apply --dry-run=client -f pv.yml` | Local validation only, no contact with the cluster |
| Server-side | `kubectl apply --dry-run=server -f pv.yml` | Sent to the API Server for real validation/admission checks against the actual cluster state, without persisting the object |

---

## 6. Step 4 — Create and Verify the PV

```bash
kubectl apply -f pv.yml
kubectl get pv
```

```text
NAME           CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS
app-logs-pv    1Gi        RWX            Retain           Available
```

`Available` means the PV exists and is ready to be claimed — no PVC is bound to it yet.

### Static vs. Dynamic Provisioning

This PV was created manually — this is **static provisioning**:

```text
Administrator → Creates PV → Creates PVC → Kubernetes binds PVC to PV
```

This differs from the **dynamic provisioning** already present in the cluster from the MySQL task (`pvc-6a985cf6-...`), created automatically through the cluster's default `StorageClass`:

```text
PVC → StorageClass → Dynamic Provisioner → PV
```

So the cluster ends up holding both a static PV (`app-logs-pv`) and a dynamic one (the MySQL PVC's auto-created PV) side by side.

---

## 7. Step 5 — Create the PersistentVolumeClaim

**`pvc.yml`**
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: app-logs-pvc
  namespace: ivolve
spec:
  storageClassName: ""
  resources:
    requests:
      storage: 1Gi
  accessModes:
    - ReadWriteMany
```

| Field | Meaning |
|---|---|
| `metadata.namespace: ivolve` | PVCs are namespace-scoped — this one belongs to `ivolve` |
| `resources.requests.storage: 1Gi` | Amount of storage requested; Kubernetes searches for a compatible PV |
| `accessModes: [ReadWriteMany]` | Must match the PV's access mode to be eligible for binding |
| `storageClassName: ""` | Explicitly disables StorageClass matching — see section 8 for why this was necessary |

---

## 8. Why `storageClassName: ""` Was Necessary

The Kind cluster has a default `StorageClass` called `standard`. **If a PVC doesn't explicitly specify a StorageClass, Kubernetes assigns the default one automatically.**

Without `storageClassName: ""`, the PVC silently received `StorageClass: standard`, while the manually created PV had no StorageClass at all:

```text
PVC → StorageClass: standard
PV  → StorageClass: none
             ✗ mismatch — cannot bind
```

Setting `storageClassName: ""` explicitly tells Kubernetes *"do not use any StorageClass for this PVC"* — appropriate here since the PV was already created manually (static provisioning):

```text
PVC → StorageClass: none
             │ matches
             ▼
PV  → StorageClass: none
```

---

## 9. Problems Encountered & Fixes

### Error 1 — Namespace Typo

```yaml
namespace: ivovle   # typo
```

```bash
kubectl apply --dry-run=server -f pvc.yml
```
```text
namespaces "ivovle" not found
```

**Fix:** corrected to `namespace: ivolve`.

---

### Error 2 — PVC Stuck in `Pending`

```text
app-logs-pvc   Pending   ...   standard
app-logs-pv    1Gi   RWX   Retain   Available
```

**Cause:** `PVC StorageClass = standard` vs. `PV StorageClass = none` — no compatible match.

**Fix:** set `storageClassName: ""` in the PVC (section 8).

---

### Error 3 — Trying to Modify an Existing PVC

```text
The PersistentVolumeClaim "app-logs-pvc" is invalid:
spec: Forbidden: spec is immutable after creation

- "StorageClassName": "standard"
+ "StorageClassName": ""
```

**Cause:** Kubernetes does not allow changing most PVC `spec` fields — including `storageClassName` — after creation.

**Fix:** since the PVC was still `Pending` and held no application data, it was safe to delete and recreate:
```bash
kubectl delete pvc app-logs-pvc -n ivolve
kubectl apply -f pvc.yml
```

> For production workloads, always understand the data implications before deleting a PVC that might already be bound and in use.

---

## 10. Final Verification

```bash
kubectl get pvc -n ivolve
```
```text
NAME            STATUS   VOLUME        CAPACITY   ACCESS MODES   STORAGECLASS
app-logs-pvc    Bound    app-logs-pv   1Gi        RWX
```

```bash
kubectl get pv
```
```text
NAME           CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM
app-logs-pv    1Gi        RWX            Retain           Bound    ivolve/app-logs-pvc
```

```text
app-logs-pvc
      │
      │ Bound
      ▼
app-logs-pv
      │
      ▼
hostPath: /mnt/app-logs
```

`Bound` confirms the PVC successfully found and was associated with a compatible PV.

---

## 11. Access Modes Reference

| Mode | Abbreviation | Meaning |
|---|---|---|
| ReadWriteOnce | RWO | Read + write from a **single** Node (used by the MySQL volume in an earlier task) |
| ReadOnlyMany | ROX | Read-only from **multiple** Nodes |
| ReadWriteMany | RWX | Read + write from **multiple** Nodes (used here) |

---

## 12. Important Limitation — RWX Does Not Mean "Automatically Shared"

This is one of the most common misconceptions with `hostPath`:

> ❌ `RWX` = Kubernetes magically shares any directory between Nodes
> ✅ `RWX` = the storage **backend** supports ReadWriteMany-style access

With `hostPath`, storage stays **local to whichever node it's on**. `/mnt/app-logs` on the worker node is a completely separate directory from `/mnt/app-logs` on the control-plane node — they are not synced or shared in any way.

```text
Worker Node
└── /mnt/app-logs         (separate filesystem)

Control Plane Node
└── /mnt/app-logs         (separate filesystem)
```

Declaring `ReadWriteMany` on a `hostPath` PV only works reliably when every Pod using it ends up scheduled on the **same node** — which happens here somewhat by luck, since this Kind cluster has only one worker. In a real multi-node cluster, if replicas landed on different nodes, each would silently write to its own separate, empty-looking directory instead of a shared one.

**In real production environments**, genuine RWX shared storage across nodes requires a real shared/distributed backend: **NFS, CephFS, AWS EFS, Azure Files**, etc. `hostPath` is appropriate for local labs and node-local use cases, but is not a production-grade solution for multi-node shared storage.

---

## 13. Troubleshooting Workflow for a Pending PVC

Don't randomly edit the YAML — follow this sequence:

```text
PVC Pending
     │
     ▼
kubectl get pvc -n <namespace>
     │
     ▼
Check STATUS / VOLUME / STORAGECLASS
     │
     ▼
kubectl describe pvc <name> -n <namespace>
     │
     ▼
Check the Events section
     │
     ▼
kubectl get pv
     │
     ▼
Compare: capacity, access modes, StorageClass, volume mode, selector
```

**Matching requirements for a bind to succeed:**
- PVC requested size ≤ PV capacity
- PVC access mode matches PV access mode
- PVC StorageClass matches PV StorageClass

---

## 14. Common Mistakes Checklist

| Mistake | Correct approach |
|---|---|
| Typo in namespace (`ivovle`) | Double-check the exact namespace name |
| Running `kubectl get pvc` without `-n` | PVCs are namespace-scoped — always specify `-n <namespace>` |
| Forgetting the cluster has a default StorageClass | Check with `kubectl get storageclass`; a PVC without an explicit StorageClass may silently get the default |
| Static PV with no StorageClass, but PVC gets the default one | Set `storageClassName: ""` on the PVC to disable StorageClass matching |
| Trying to modify `storageClassName` on an existing PVC | Not allowed — delete and recreate the PVC instead (if safe to do so) |
| Assuming RWX = automatic cross-node sharing | RWX only means the backend *supports* multi-access; `hostPath` remains node-local |
| Adding `namespace:` to a PV manifest | PV is cluster-scoped — it must never have a `namespace` field |

---

## 15. What This Task Demonstrates

```text
1. Prepare storage
       ↓
2. Define PersistentVolume
       ↓
3. Define PersistentVolumeClaim
       ↓
4. Kubernetes compares requirements
       ↓
5. PVC binds to a compatible PV
       ↓
6. Application can use the PVC
       ↓
7. Data persists beyond the Pod's lifecycle
```

It also demonstrates the difference between **static** and **dynamic** provisioning, and how `StorageClass` affects PVC binding — along with a realistic troubleshooting cycle (namespace typo → StorageClass mismatch → immutable field error) rather than a flow that worked perfectly on the first try.

---

## 16. Key Takeaways

- A **PV** represents storage made available to the cluster; a **PVC** represents a request for storage.
- PV is cluster-scoped; PVC is namespace-scoped.
- `ReadWriteMany` (RWX) allows read/write from multiple Pods — but only if the storage backend genuinely supports cross-node sharing. `hostPath` does not.
- `Retain` preserves data after the PVC is deleted; `Delete` may remove it automatically.
- `storageClassName: ""` explicitly opts a PVC out of StorageClass-based provisioning.
- Most PVC `spec` fields are immutable after creation.
- `Bound` means the PVC and PV have been successfully associated.
- `kubectl describe pvc` and its `Events` section are the primary diagnostic tool for a `Pending` PVC.

---

## Author

**Abdulrhman Mohammed**
Cloud & DevOps Engineer
[LinkedIn](https://www.linkedin.com/in/abdulrhman-mohammed-b22609389)

