const ICON_MAP: Record<string, string> = {
  aws_api_gateway: '⇄',
  aws_lambda: 'λ',
  aws_s3: '🪣',
  aws_dynamodb: '⬡',
  aws_fargate: '🐳',
  aws_cognito: '🔑',
  aws_ec2: '🖥',
  aws_rds: '🗄',
  aws_sqs: '📬',
  aws_sns: '📢',
  aws_cloudfront: '🌐',
  aws_elb: '⚖',
  aws_ecs: '📦',
  aws_cloudwatch: '👁',
  aws_route53: '🔍',
  client: '💻',
  server: '🖥',
  database: '🗄',
  load_balancer: '⚖',
  cache: '⚡',
  queue: '📬',
  microservice: '⚙',
  mobile: '📱',
  browser: '🌐',
  cdn: '🌍',
  firewall: '🔥',
  kafka: '📨',
  redis: '⚡',
  nginx: '⇄',
  spring_boot: '🌱',
  postgres: '🐘',
  mysql: '🐬',
  mongodb: '🍃',
  elasticsearch: '🔍',
  docker: '🐳',
  kubernetes: '☸',
  graphql: '◈',
  table: '▦',
  api_service: '⬡',
  unknown: '□',
}

export function getIcon(key: string): string {
  return ICON_MAP[key] ?? ICON_MAP.unknown
}

export const GROUP_COLORS: Record<string, string> = {
  client: '#3b82f6',
  clients: '#3b82f6',
  frontend: '#3b82f6',
  backend: '#10b981',
  service: '#10b981',
  services: '#10b981',
  database: '#8b5cf6',
  data: '#8b5cf6',
  networking: '#f59e0b',
  network: '#f59e0b',
  messaging: '#ef4444',
  queue: '#ef4444',
  cdn: '#14b8a6',
  auth: '#f97316',
  storage: '#6366f1',
  monitoring: '#84cc16',
  user: '#06b6d4',
  order: '#f59e0b',
  catalog: '#8b5cf6',
  api_layer: '#3b82f6',
  business: '#10b981',
  data_layer: '#8b5cf6',
}

export function getGroupColor(group?: string): string {
  if (!group) return '#6b7280'
  const key = group.toLowerCase()
  for (const [k, v] of Object.entries(GROUP_COLORS)) {
    if (key.includes(k)) return v
  }
  return '#6b7280'
}
