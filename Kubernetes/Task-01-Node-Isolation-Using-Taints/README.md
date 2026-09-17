# Task 01 — Node Isolation Using Taints in Kubernetes

## Overview

This task demonstrates how to create a multi-node Kubernetes cluster and use **Node Taints** to control where Kubernetes Pods can be scheduled.

The lab uses **Kind (Kubernetes IN Docker)** to create a cluster with one Control Plane node and one Worker node. A `NoSchedule` taint is then applied to the Worker node to prevent new Pods from being scheduled there unless they have a matching **Toleration**.

The task focuses on Kubernetes scheduling, node isolation, taints, tolerations, and cluster administration using `kubectl`.

---

## Objectives

- Create a two-node Kubernetes cluster (Control Plane + Worker) using Kind.
- Verify node availability and status.
- Apply a `NoSchedule` taint to the Worker node.
- Verify the applied taint using `kubectl describe nodes`.
- Understand how Kubernetes uses taints and tolerations during Pod scheduling.

---

## Technologies Used

Kubernetes · Kind (Kubernetes IN Docker) · kubectl · Docker · YAML · Linux

---

## Environment

| Component | Version |
|---|---|
| OS | Ubuntu 22.04.5 LTS |
| Kind | v0.33.0 |
| Kubernetes | v1.37.0 |
| kubectl | v1.36.3 |
| Architecture | x86_64 |

Kind uses Docker containers to represent the Kubernetes nodes in this local cluster.

---

## 1. Cluster Architecture

```text
Kubernetes Cluster
│
├── Control Plane
│   └── taint-lab-control-plane
│
└── Worker
    └── taint-lab-worker
```

The Control Plane manages the cluster and makes scheduling/orchestration decisions. The Worker node provides the environment where application workloads run.

---

## 2. Create the Kind Cluster

**`kind-config.yml`**
```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
  - role: worker
```

| Field | Description |
|---|---|
| `kind: Cluster` | Defines the Kind config object as a Kubernetes cluster |
| `apiVersion` | Kind configuration API version |
| `nodes` | Nodes to be created |
| `role: control-plane` | Creates a Control Plane node |
| `role: worker` | Creates a Worker node |

The configuration is intentionally minimal — the objective is a two-node cluster for practicing scheduling behavior, not a production topology.

---

## 3. Create the Cluster

```bash
kind create cluster --name taint-lab --config kind-config.yml --wait 5m
```

| Flag | Meaning |
|---|---|
| `create cluster` | Creates a new Kubernetes cluster |
| `--name taint-lab` | Names the cluster `taint-lab` |
| `--config kind-config.yml` | Uses the custom topology defined above |
| `--wait 5m` | Waits up to 5 minutes for the cluster to become ready |

---

## 4. Verify the Cluster Nodes

```bash
kubectl get nodes
```

```text
NAME                      STATUS   ROLES           AGE   VERSION
taint-lab-control-plane   Ready    control-plane   25m   v1.37.0
taint-lab-worker          Ready    <none>          25m   v1.37.0
```

Both nodes report `Ready`.

---

## 5. Apply a Taint to the Worker Node

```bash
kubectl taint nodes taint-lab-worker node=worker:NoSchedule
```

| Part | Meaning |
|---|---|
| `taint nodes` | Requests a taint operation on a Node |
| `taint-lab-worker` | Target node |
| `node=worker` | Taint key/value (`key=node`, `value=worker`) |
| `NoSchedule` | Taint effect |

---

## 6. Understanding `NoSchedule`

`NoSchedule` tells the Kubernetes Scheduler:

> Do not schedule new Pods on this node unless the Pod has a matching Toleration.

```text
Pod
 │
 ▼
Kubernetes Scheduler
 │
 └── Worker (node=worker:NoSchedule)
       ├── Pod has matching Toleration → can be scheduled
       └── No matching Toleration      → cannot be scheduled
```

A taint does **not** mean the node is down — it's a scheduling rule evaluated by the Scheduler, not a health state.

---

## 7. Verify the Taint

```bash
kubectl describe nodes
```

```text
Name:               taint-lab-worker
Roles:              <none>
Taints:             node=worker:NoSchedule
Unschedulable:      false
```

The `Taints:` line confirms the taint was applied successfully.

---

## 8. Control Plane Taint

The Control Plane node carries its own default taint, separate from the one added to the Worker:

```text
Taints: node-role.kubernetes.io/control-plane:NoSchedule
```

```text
Kubernetes Cluster
│
├── Control Plane
│   └── node-role.kubernetes.io/control-plane:NoSchedule   (default)
│
└── Worker
    └── node=worker:NoSchedule                              (added in this task)
```

The Control Plane taint prevents ordinary workloads from landing there by default; the Worker taint was added manually to practice node isolation.

---

## 9. Taints vs. Tolerations

A **Taint** lives on a Node. A **Toleration** lives on a Pod. Together they gate scheduling:

```text
Node ── Taint ──►
                  Scheduler
Pod  ── Toleration ──►
```

Matching toleration for the Worker's taint:

```yaml
tolerations:
  - key: "node"
    operator: "Equal"
    value: "worker"
    effect: "NoSchedule"
```

**Important distinction:** a toleration allows a Pod to be *considered* for a tainted node — it does not force the Pod onto that node. To actually target a specific node, use `nodeSelector` or node affinity alongside the toleration.

---

## 10. Key Concepts

| Concept | Definition |
|---|---|
| **Node** | A machine (physical or virtual) that participates in the cluster and provides resources for workloads |
| **Pod** | The smallest deployable unit in Kubernetes; one or more containers sharing network/storage |
| **Scheduler** | Selects a Node for each Pod based on resource requirements, taints/tolerations, node selectors, affinity, etc. |
| **Taint** | A `key=value:effect` property on a Node that restricts which Pods can be scheduled onto it |
| **Toleration** | A Pod-level spec that lets a Pod tolerate a matching Node taint |

---

## 11. Verification Summary

```bash
# Cluster nodes
kubectl get nodes
# → taint-lab-control-plane   Ready
# → taint-lab-worker          Ready

# Worker taint
kubectl describe nodes
# → Taints: node=worker:NoSchedule
```

---

## 12. What This Task Demonstrates

- Creating and managing a multi-node Kubernetes cluster with Kind
- Working with `kubectl` for cluster inspection
- Understanding the Kubernetes Scheduler's decision process
- Applying and verifying Node taints
- Understanding the `NoSchedule` effect and its relationship to Tolerations
- Distinguishing node *availability* from scheduling *restrictions*

---

## 13. Key Takeaway

```text
Node Taint + Pod Toleration → Scheduling Compatibility
```

A `NoSchedule` taint blocks any new Pod without a matching toleration from being scheduled onto the affected node.

---

## Author

**Abdulrhman Mohammed**
Cloud & DevOps Engineer
[LinkedIn](https://www.linkedin.com/in/abdulrhman-mohammed-b22609389)

