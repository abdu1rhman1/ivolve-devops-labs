# Task 02 — Namespace Management and ResourceQuota in Kubernetes

## Overview

This task demonstrates how to create an isolated **Namespace** in a Kubernetes cluster and enforce a hard limit on the number of Pods that can run inside it using a **ResourceQuota**.

The lab creates a namespace called `ivolve`, applies a `ResourceQuota` that caps the namespace at **2 Pods**, and verifies the enforcement by attempting to schedule a third Pod.

---

## Objectives

- Create a dedicated Namespace using a declarative YAML manifest.
- Create a `ResourceQuota` that limits the namespace to a maximum of 2 Pods.
- Verify the quota is registered and enforced by the API server.
- Confirm that a Pod exceeding the quota is rejected with a clear error.

---

## Technologies Used

Kubernetes · kubectl · YAML · Kind (Kubernetes IN Docker)

---

## Environment

| Component | Version |
|---|---|
| OS | Ubuntu 22.04.5 LTS |
| Kind | v0.33.0 |
| Kubernetes | v1.37.0 |
| kubectl | v1.36.3 |

---

## 1. Repository Files

```
Task-02-Namespace-Management-and-ResourceQuota/
├── README.md
├── namespace.yml
└── resource-quota.yml
```

The Namespace and the ResourceQuota are kept in **separate manifests**. They are different resources with different lifecycles — the quota may need to change independently of the namespace itself — so splitting them keeps each file self-descriptive and keeps Git diffs focused on the resource that actually changed.

---

## 2. Create the Namespace

**`namespace.yml`**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ivolve
```

Applied with:
```bash
kubectl apply -f namespace.yml
```

Verified with:
```bash
kubectl get namespaces
```

```text
NAME     STATUS   AGE
ivolve   Active   13s
```

---

## 3. Create the ResourceQuota

**`resource-quota.yml`**
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: apply-only2pods
  namespace: ivolve
spec:
  hard:
    pods: "2"
```

| Field | Meaning |
|---|---|
| `spec` | The desired state of the object |
| `hard` | A **hard limit** — a strict ceiling enforced by the API server, not a soft warning |
| `pods: "2"` | The maximum number of Pods allowed to exist in the `ivolve` namespace at once |

Applied with:
```bash
kubectl apply -f resource-quota.yml
```

> `namespace: ivolve` in the ResourceQuota's metadata is only a **reference** — it tells Kubernetes which existing namespace to attach the quota to. It does not create the namespace; the namespace must already exist, or the apply fails with `namespaces "ivolve" not found`.

---

## 4. Verify the Quota Is Registered

```bash
kubectl get resourcequota -n ivolve
```

```text
NAME              REQUEST     LIMIT   AGE
apply-only2pods   pods: 0/2           2m42s
```

```bash
kubectl describe resourcequota apply-only2pods -n ivolve
```

```text
Name:       apply-only2pods
Namespace:  ivolve
Resource    Used  Hard
--------    ----  ----
pods        0     2
```

---

## 5. Verify Enforcement

Registering the object is not proof the limit is enforced — the real test is attempting to exceed it.

```bash
kubectl run pod1 --image=nginx -n ivolve
kubectl run pod2 --image=nginx -n ivolve
kubectl run pod3 --image=nginx -n ivolve
```

The first two Pods are created. The third is rejected outright by the API server:

```text
Error from server (Forbidden): pods "pod3" is forbidden:
exceeded quota: apply-only2pods, requested: pods=1, used: pods=2, limited: pods=2
```

```bash
kubectl get pods -n ivolve
```

```text
NAME   READY   STATUS    RESTARTS   AGE
pod1   1/1     Running   0          55s
pod2   1/1     Running   0          47s
```

Only 2 Pods exist in the namespace — confirming the quota blocks any request beyond the hard limit **before** the Pod is even scheduled, not after.

---

## 6. Troubleshooting Note — Scheduling vs. Quota

During testing, `pod1` and `pod2` initially stayed in `Pending` status instead of `Running`, even though the quota accepted them. This was **not a ResourceQuota issue** — `kubectl describe pod pod1 -n ivolve` showed:

```text
Warning  FailedScheduling  0/2 nodes are available:
1 node(s) had untolerated taint {node=worker: NoSchedule},
1 node(s) had untolerated taint {node-role.kubernetes.io/control-plane: NoSchedule}
```

The cluster (`taint-lab`) was reused from an earlier lab (**Node Isolation Using Taints**), where a `NoSchedule` taint had been applied to the worker node. Since the quota only controls *how many* Pods can exist — not *whether* they can be scheduled — the Pods were accepted by the quota but stuck waiting for a schedulable node.

**Fix — remove the leftover taint:**
```bash
kubectl taint nodes taint-lab-worker node=worker:NoSchedule-
```

This distinguishes two separate Kubernetes concerns that are easy to conflate:

| Concern | Controlled by | Answers |
|---|---|---|
| *How many* Pods can exist | ResourceQuota | "Is there room in the namespace's budget?" |
| *Where/whether* a Pod runs | Scheduler + Taints/Tolerations | "Is there a node willing to host it?" |

---

## 7. Key Concepts

| Concept | Definition |
|---|---|
| **Namespace** | A logical partition within a single cluster's API — used for isolating names, RBAC, and quotas. It has no relation to physical/virtual Nodes; Pods in one namespace can run on any node. |
| **ResourceQuota** | A namespaced object that caps the **total** consumption of resources or object counts within a namespace (as opposed to `LimitRange`, which sets per-object defaults/limits). |
| **hard limit** | A strict ceiling enforced by the API server — any request that would exceed it is rejected immediately, not just warned about. |

---

## 8. What This Task Demonstrates

- Creating a Namespace declaratively and independently of any Node.
- Applying a `ResourceQuota` to cap Pod count within a namespace.
- Verifying enforcement empirically, not just by reading the manifest.
- Diagnosing `Pending` Pods by correctly separating **quota admission** from **scheduler placement** — two independent gates a Pod must pass.
- Practical use of `kubectl describe`, `kubectl get resourcequota`, and reading `FailedScheduling` events.

---

## Author

**Abdulrhman Mohammed**
Cloud & DevOps Engineer
[LinkedIn](https://www.linkedin.com/in/abdulrhman-mohammed-b22609389)

