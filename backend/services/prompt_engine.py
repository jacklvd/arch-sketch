from pathlib import Path
from models.diagram import DiagramType

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"

ICON_KEYS = [
    # AWS
    "aws_api_gateway", "aws_lambda", "aws_s3", "aws_dynamodb", "aws_fargate",
    "aws_cognito", "aws_ec2", "aws_rds", "aws_aurora", "aws_elasticache",
    "aws_sqs", "aws_sns", "aws_cloudfront", "aws_elb", "aws_ecs",
    "aws_cloudwatch", "aws_route53", "aws_neptune", "aws_opensearch",
    # GCP
    "gcp_cloud_run", "gcp_cloud_functions", "gcp_gke", "gcp_bigquery",
    "gcp_firestore", "gcp_spanner", "gcp_pub_sub", "gcp_cloud_storage",
    "gcp_load_balancing", "gcp_cloud_armor", "gcp_cloud_cdn", "gcp_cloud_sql",
    "gcp_memorystore", "gcp_vertex_ai", "gcp_compute_engine", "gcp_apigee",
    "gcp_alloydb", "gcp_anthos",
    # Azure
    "azure_app_service", "azure_functions", "azure_aks", "azure_cosmos_db",
    "azure_sql", "azure_blob_storage", "azure_service_bus", "azure_event_hub",
    "azure_redis_cache", "azure_api_management", "azure_cdn",
    "azure_load_balancer", "azure_active_directory", "azure_monitor", "azure_key_vault",
    # Generic / tech
    "client", "server", "database", "load_balancer", "cache", "queue",
    "microservice", "mobile", "browser", "cdn", "firewall",
    "kafka", "redis", "nginx", "spring_boot", "postgres", "mysql", "mongodb",
    "elasticsearch", "docker", "kubernetes", "graphql", "unknown",
]


def build_prompt(
    diagram_type: DiagramType,
    quest: str,
    functional_reqs: str,
    non_functional_reqs: str,
    design_description: str,
) -> str:
    template_path = PROMPTS_DIR / f"{diagram_type.value}.txt"
    template = template_path.read_text()
    return template.format(
        quest=quest,
        functional_reqs=functional_reqs,
        non_functional_reqs=non_functional_reqs,
        design_description=design_description,
        icon_keys=", ".join(ICON_KEYS),
    )
