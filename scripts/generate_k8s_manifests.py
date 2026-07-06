import os
import yaml

services = [
    {"name": "api-gateway", "port": 8000},
    {"name": "auth-service", "port": 8001},
    {"name": "user-service", "port": 8002},
    {"name": "product-service", "port": 8003},
    {"name": "order-service", "port": 8004},
    {"name": "ai-service", "port": 8005},
    {"name": "payment-service", "port": 8006},
    {"name": "cart-service", "port": 8007},
    {"name": "search-service", "port": 8008},
    {"name": "review-service", "port": 8009},
    {"name": "aiml-service", "port": 8010},
    {"name": "monitoring-service", "port": 8011},
]

base_dir = "k8s"

for svc in services:
    name = str(svc["name"])
    port = int(svc["port"])
    svc_dir = os.path.join(base_dir, name)
    os.makedirs(svc_dir, exist_ok=True)

    # 1. Deployment (includes rolling updates, anti-affinity, graceful shutdown, probes)
    deployment = {
        "apiVersion": "apps/v1",
        "kind": "Deployment",
        "metadata": {
            "name": name,
            "labels": {"app": name}
        },
        "spec": {
            "replicas": 2,
            "strategy": {
                "type": "RollingUpdate",
                "rollingUpdate": {
                    "maxSurge": "25%",
                    "maxUnavailable": "25%"
                }
            },
            "selector": {
                "matchLabels": {"app": name}
            },
            "template": {
                "metadata": {
                    "labels": {"app": name}
                },
                "spec": {
                    "affinity": {
                        "podAntiAffinity": {
                            "preferredDuringSchedulingIgnoredDuringExecution": [
                                {
                                    "weight": 100,
                                    "podAffinityTerm": {
                                        "labelSelector": {
                                            "matchExpressions": [
                                                {"key": "app", "operator": "In", "values": [name]}
                                            ]
                                        },
                                        "topologyKey": "kubernetes.io/hostname"
                                    }
                                }
                            ]
                        }
                    },
                    "terminationGracePeriodSeconds": 60,
                    "containers": [
                        {
                            "name": name,
                            "image": f"registry.example.com/ecommerce/{name}:latest",
                            "imagePullPolicy": "Always",
                            "ports": [{"containerPort": port}],
                            "env": [{"name": "PORT", "value": str(port)}],
                            "lifecycle": {
                                "preStop": {
                                    "exec": {
                                        "command": ["/bin/sh", "-c", "sleep 5"]
                                    }
                                }
                            },
                            "resources": {
                                "requests": {"cpu": "100m", "memory": "256Mi"},
                                "limits": {"cpu": "500m", "memory": "512Mi"}
                            },
                            "livenessProbe": {
                                "httpGet": {"path": "/health", "port": port},
                                "initialDelaySeconds": 10,
                                "periodSeconds": 15,
                                "failureThreshold": 3
                            },
                            "readinessProbe": {
                                "httpGet": {"path": "/health", "port": port},
                                "initialDelaySeconds": 5,
                                "periodSeconds": 10,
                                "failureThreshold": 3
                            },
                            "startupProbe": {
                                "httpGet": {"path": "/health", "port": port},
                                "initialDelaySeconds": 5,
                                "periodSeconds": 10,
                                "failureThreshold": 12
                            }
                        }
                    ]
                }
            }
        }
    }

    # 2. Service
    service = {
        "apiVersion": "v1",
        "kind": "Service",
        "metadata": {
            "name": name,
            "labels": {"app": name}
        },
        "spec": {
            "type": "ClusterIP",
            "selector": {"app": name},
            "ports": [{"port": port, "targetPort": port}]
        }
    }

    # 3. HorizontalPodAutoscaler (HPA)
    hpa = {
        "apiVersion": "autoscaling/v2",
        "kind": "HorizontalPodAutoscaler",
        "metadata": {
            "name": name
        },
        "spec": {
            "scaleTargetRef": {
                "apiVersion": "apps/v1",
                "kind": "Deployment",
                "name": name
            },
            "minReplicas": 2,
            "maxReplicas": 10,
            "metrics": [
                {
                    "type": "Resource",
                    "resource": {
                        "name": "cpu",
                        "target": {
                            "type": "Utilization",
                            "averageUtilization": 70
                        }
                    }
                },
                {
                    "type": "Resource",
                    "resource": {
                        "name": "memory",
                        "target": {
                            "type": "Utilization",
                            "averageUtilization": 80
                        }
                    }
                }
            ]
        }
    }

    # 4. PodDisruptionBudget (PDB)
    pdb = {
        "apiVersion": "policy/v1",
        "kind": "PodDisruptionBudget",
        "metadata": {
            "name": name
        },
        "spec": {
            "minAvailable": "50%",
            "selector": {
                "matchLabels": {"app": name}
            }
        }
    }

    with open(os.path.join(svc_dir, "manifests.yaml"), "w") as f:
        yaml.dump_all([deployment, service, hpa, pdb], f, default_flow_style=False)

print("Generated all Kubernetes manifests successfully.")
