from pathlib import Path
from models.diagram import DiagramType

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"

ICON_KEYS = [
    "aws_api_gateway", "aws_lambda", "aws_s3", "aws_dynamodb", "aws_fargate",
    "aws_cognito", "aws_ec2", "aws_rds", "aws_sqs", "aws_sns", "aws_cloudfront",
    "aws_elb", "aws_ecs", "aws_cloudwatch", "aws_route53",
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
