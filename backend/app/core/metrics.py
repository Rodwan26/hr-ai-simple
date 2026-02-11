from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response
import time

# Metrics definitions
REQUEST_COUNT = Counter(
    "http_requests_total", 
    "Total HTTP requests", 
    ["method", "endpoint", "status", "domain", "organization_id"]
)

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds", 
    "HTTP request latency", 
    ["endpoint", "domain"],
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0, float("inf"))
)

AI_FAILURE_COUNT = Counter(
    "ai_failures_total",
    "Total AI service failures",
    ["domain", "error_code", "organization_id"]
)

ACTIVE_TASKS = Gauge(
    "active_background_tasks",
    "Number of active background tasks",
    ["task_type"]
)

class MetricsManager:
    @staticmethod
    def record_request(method: str, endpoint: str, status: int, domain: str, org_id: str = "unknown"):
        REQUEST_COUNT.labels(
            method=method, 
            endpoint=endpoint, 
            status=status, 
            domain=domain, 
            organization_id=org_id
        ).inc()

    @staticmethod
    def record_latency(endpoint: str, domain: str, duration: float):
        REQUEST_LATENCY.labels(endpoint=endpoint, domain=domain).observe(duration)

    @staticmethod
    def record_ai_failure(domain: str, error_code: str, org_id: str = "unknown"):
        AI_FAILURE_COUNT.labels(domain=domain, error_code=error_code, organization_id=org_id).inc()

    @staticmethod
    def set_active_tasks(task_type: str, count: int):
        ACTIVE_TASKS.labels(task_type=task_type).set(count)

def get_metrics_response():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
