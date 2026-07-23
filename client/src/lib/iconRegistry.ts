export interface IconResult {
  src?: string
  emoji: string
}

type IconEntry = [string, string]

const ICON_MAP: Record<string, IconEntry> = {
  aws_api_gateway: [new URL('../assets/aws-icons/Architecture-Service-Icons_01302026/Arch_Networking-Content-Delivery/48/Arch_Amazon-API-Gateway_48.svg', import.meta.url).href, '⇄'],
  aws_lambda: [new URL('../assets/aws-icons/Architecture-Service-Icons_01302026/Arch_Compute/48/Arch_AWS-Lambda_48.svg', import.meta.url).href, 'λ'],
  aws_ec2: [new URL('../assets/aws-icons/Architecture-Service-Icons_01302026/Arch_Compute/48/Arch_Amazon-EC2_48.svg', import.meta.url).href, '🖥'],
  aws_fargate: [new URL('../assets/aws-icons/Architecture-Service-Icons_01302026/Arch_Containers/48/Arch_AWS-Fargate_48.svg', import.meta.url).href, '🐳'],
  aws_ecs: [new URL('../assets/aws-icons/Architecture-Service-Icons_01302026/Arch_Containers/48/Arch_Amazon-ECS-Anywhere_48.svg', import.meta.url).href, '📦'],
  aws_s3: [new URL('../assets/aws-icons/Architecture-Service-Icons_01302026/Arch_Storage/48/Arch_Amazon-S3-on-Outposts_48.svg', import.meta.url).href, '🪣'],
  aws_dynamodb: [new URL('../assets/aws-icons/Architecture-Service-Icons_01302026/Arch_Databases/48/Arch_Amazon-DynamoDB_48.svg', import.meta.url).href, '⬡'],
  aws_rds: [new URL('../assets/aws-icons/Architecture-Service-Icons_01302026/Arch_Databases/48/Arch_Amazon-Aurora_48.svg', import.meta.url).href, '🗄'],
  aws_aurora: [new URL('../assets/aws-icons/Architecture-Service-Icons_01302026/Arch_Databases/48/Arch_Amazon-Aurora_48.svg', import.meta.url).href, '🗄'],
  aws_elasticache: [new URL('../assets/aws-icons/Architecture-Service-Icons_01302026/Arch_Databases/48/Arch_Amazon-ElastiCache_48.svg', import.meta.url).href, '⚡'],
  aws_sqs: [new URL('../assets/aws-icons/Architecture-Service-Icons_01302026/Arch_Application-Integration/48/Arch_Amazon-Simple-Queue-Service_48.svg', import.meta.url).href, '📬'],
  aws_sns: [new URL('../assets/aws-icons/Architecture-Service-Icons_01302026/Arch_Application-Integration/48/Arch_Amazon-Simple-Notification-Service_48.svg', import.meta.url).href, '📢'],
  aws_cloudfront: [new URL('../assets/aws-icons/Architecture-Service-Icons_01302026/Arch_Networking-Content-Delivery/48/Arch_Amazon-CloudFront_48.svg', import.meta.url).href, '🌐'],
  aws_route53: [new URL('../assets/aws-icons/Architecture-Service-Icons_01302026/Arch_Networking-Content-Delivery/48/Arch_Amazon-Route-53_48.svg', import.meta.url).href, '🔍'],
  aws_elb: [new URL('../assets/aws-icons/Architecture-Service-Icons_01302026/Arch_Networking-Content-Delivery/48/Arch_Elastic-Load-Balancing_48.svg', import.meta.url).href, '⚖'],
  aws_cloudwatch: [new URL('../assets/aws-icons/Architecture-Service-Icons_01302026/Arch_Management-Tools/48/Arch_Amazon-CloudWatch_48.svg', import.meta.url).href, '👁'],
  aws_cognito: [new URL('../assets/aws-icons/Architecture-Service-Icons_01302026/Arch_Security-Identity/48/Arch_Amazon-Cognito_48.svg', import.meta.url).href, '🔑'],
  aws_neptune: [new URL('../assets/aws-icons/Architecture-Service-Icons_01302026/Arch_Databases/48/Arch_Amazon-Neptune_48.svg', import.meta.url).href, '⬡'],
  aws_opensearch: [new URL('../assets/aws-icons/Architecture-Service-Icons_01302026/Arch_Analytics/48/Arch_Amazon-OpenSearch-Service_48.svg', import.meta.url).href, '🔍'],
  gcp_cloud_run: [new URL('../assets/gcp-icons/Cloud Run/SVG/CloudRun-512-color-rgb.svg', import.meta.url).href, '☁'],
  gcp_gke: [new URL('../assets/gcp-icons/GKE/SVG/GKE-512-color.svg', import.meta.url).href, '☸'],
  gcp_bigquery: [new URL('../assets/gcp-icons/BigQuery/SVG/BigQuery-512-color.svg', import.meta.url).href, '⬡'],
  gcp_spanner: [new URL('../assets/gcp-icons/Cloud Spanner/SVG/CloudSpanner-512-color.svg', import.meta.url).href, '🗄'],
  gcp_cloud_storage: [new URL('../assets/gcp-icons/Cloud Storage/SVG/Cloud_Storage-512-color.svg', import.meta.url).href, '🪣'],
  gcp_cloud_sql: [new URL('../assets/gcp-icons/Cloud SQL/SVG/CloudSQL-512-color.svg', import.meta.url).href, '🗄'],
  gcp_vertex_ai: [new URL('../assets/gcp-icons/Vertex AI/SVG/VertexAI-512-color.svg', import.meta.url).href, '🤖'],
  gcp_compute_engine: [new URL('../assets/gcp-icons/Compute Engine/SVG/ComputeEngine-512-color-rgb.svg', import.meta.url).href, '🖥'],
  gcp_apigee: [new URL('../assets/gcp-icons/Apigee/SVG/Apigee-512-color-rgb.svg', import.meta.url).href, '⇄'],
  gcp_alloydb: [new URL('../assets/gcp-icons/AlloyDB/SVG/AlloyDB-512-color.svg', import.meta.url).href, '🗄'],
  gcp_anthos: [new URL('../assets/gcp-icons/Anthos/SVG/Anthos-512-color.svg', import.meta.url).href, '☸'],
  azure_aks: [new URL('../assets/azure-icons/Icons/containers/10023-icon-service-Kubernetes-Services.svg', import.meta.url).href, '☸'],
  azure_functions: [new URL('../assets/azure-icons/Icons/compute/10029-icon-service-Function-Apps.svg', import.meta.url).href, 'λ'],
  azure_cosmos_db: [new URL('../assets/azure-icons/Icons/databases/10121-icon-service-Azure-Cosmos-DB.svg', import.meta.url).href, '⬡'],
  azure_blob_storage: [new URL('../assets/azure-icons/Icons/storage/10086-icon-service-Storage-Accounts.svg', import.meta.url).href, '🪣'],
  azure_service_bus: [new URL('../assets/azure-icons/Icons/integration/10836-icon-service-Azure-Service-Bus.svg', import.meta.url).href, '📨'],
  azure_redis_cache: [new URL('../assets/azure-icons/Icons/databases/10137-icon-service-Cache-Redis.svg', import.meta.url).href, '⚡'],
  azure_api_management: [new URL('../assets/azure-icons/Icons/web/10042-icon-service-API-Management-Services.svg', import.meta.url).href, '⇄'],
  azure_key_vault: [new URL('../assets/azure-icons/Icons/security/10245-icon-service-Key-Vaults.svg', import.meta.url).href, '🔑'],
  azure_app_service: [new URL('../assets/azure-icons/Icons/containers/10035-icon-service-App-Services.svg', import.meta.url).href, '🌐'],
  azure_monitor: [new URL('../assets/azure-icons/Icons/monitor/00001-icon-service-Monitor.svg', import.meta.url).href, '👁'],
  azure_event_hub: [new URL('../assets/azure-icons/Icons/analytics/00039-icon-service-Event-Hubs.svg', import.meta.url).href, '📨'],
  azure_cdn: [new URL('../assets/azure-icons/Icons/app services/00056-icon-service-CDN-Profiles.svg', import.meta.url).href, '🌐'],
  azure_sql: [new URL('../assets/azure-icons/Icons/databases/02390-icon-service-Azure-SQL.svg', import.meta.url).href, '🗄'],
  kafka: [new URL('../assets/others/icons8-apache-kafka-material-sharp/icons8-apache-kafka-48.png', import.meta.url).href, '📨'],
  redis: [new URL('../assets/others/icons8-redis-48.png', import.meta.url).href, '⚡'],
}

const EMOJI_ONLY: Record<string, string> = {
  client: '💻', server: '🖥', database: '🗄', load_balancer: '⚖', cache: '⚡', queue: '📬',
  microservice: '⚙', mobile: '📱', browser: '🌐', cdn: '🌍', firewall: '🔥', nginx: '⇄',
  spring_boot: '🌱', postgres: '🐘', mysql: '🐬', mongodb: '🍃', elasticsearch: '🔍',
  docker: '🐳', kubernetes: '☸', graphql: '◈', table: '▦', api_service: '⬡',
  gcp_cloud_functions: 'λ', gcp_firestore: '🔥', gcp_pub_sub: '📨', gcp_load_balancing: '⚖',
  gcp_cloud_armor: '🛡', gcp_cloud_cdn: '🌐', gcp_memorystore: '⚡',
  azure_load_balancer: '⚖', azure_active_directory: '🔑', unknown: '□',
}

const cache = new Map<string, IconResult>()

export function getIcon(key: string): IconResult {
  const cached = cache.get(key)
  if (cached) return cached
  const mapped = ICON_MAP[key]
  const result = mapped ? { src: mapped[0], emoji: mapped[1] } : { emoji: EMOJI_ONLY[key] ?? '□' }
  cache.set(key, result)
  return result
}

export const GROUP_COLORS: Record<string, string> = {
  client: '#3b82f6', clients: '#3b82f6', frontend: '#3b82f6', backend: '#10b981',
  service: '#10b981', services: '#10b981', database: '#8b5cf6', data: '#8b5cf6',
  networking: '#f59e0b', network: '#f59e0b', messaging: '#ef4444', queue: '#ef4444',
  cdn: '#14b8a6', auth: '#f97316', storage: '#6366f1', monitoring: '#84cc16',
  user: '#06b6d4', order: '#f59e0b', catalog: '#8b5cf6', api_layer: '#3b82f6',
  business: '#10b981', data_layer: '#8b5cf6', presentation: '#3b82f6', application: '#10b981',
  domain: '#6366f1', infrastructure: '#f59e0b', data_access: '#8b5cf6', integration: '#ef4444',
}

export function getGroupColor(group?: string): string {
  if (!group) return '#64748b'
  const key = group.toLowerCase()
  for (const [name, color] of Object.entries(GROUP_COLORS)) {
    if (key.includes(name)) return color
  }
  return '#64748b'
}
