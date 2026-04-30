// Eagerly load icon URLs via Vite's glob import (only the URL string, not the file data)
const AWS_SVC = import.meta.glob<string>(
  '../assets/aws-icons/Architecture-Service-Icons_01302026/**/*.svg',
  { eager: true, query: '?url', import: 'default' }
)

const OTHERS = import.meta.glob<string>(
  '../assets/others/**/*.{svg,png}',
  { eager: true, query: '?url', import: 'default' }
)

function findUrl(glob: Record<string, string>, name: string): string | undefined {
  const key = Object.keys(glob).find((k) => k.includes(name))
  return key ? glob[key] : undefined
}

export interface IconResult {
  src?: string
  emoji: string
}

// [file-pattern-to-search, emoji-fallback]
const ICON_MAP: Record<string, [string, string]> = {
  aws_api_gateway:  ['Amazon-API-Gateway_48',                 '⇄'],
  aws_lambda:       ['AWS-Lambda_48.svg',                     'λ'],
  aws_ec2:          ['Amazon-EC2_48.svg',                     '🖥'],
  aws_fargate:      ['AWS-Fargate_48.svg',                    '🐳'],
  aws_ecs:          ['Amazon-ECS-Anywhere_48.svg',            '📦'],
  aws_s3:           ['Amazon-S3-on-Outposts_48.svg',          '🪣'],
  aws_dynamodb:     ['Amazon-DynamoDB_48.svg',                '⬡'],
  aws_rds:          ['Amazon-Aurora_48.svg',                  '🗄'],
  aws_aurora:       ['Amazon-Aurora_48.svg',                  '🗄'],
  aws_elasticache:  ['Amazon-ElastiCache_48.svg',             '⚡'],
  aws_sqs:          ['Amazon-Simple-Queue-Service_48.svg',    '📬'],
  aws_sns:          ['Amazon-Simple-Notification-Service_48.svg', '📢'],
  aws_cloudfront:   ['Amazon-CloudFront_48',                  '🌐'],
  aws_route53:      ['Amazon-Route-53_48.svg',                '🔍'],
  aws_elb:          ['Elastic-Load-Balancing_48.svg',         '⚖'],
  aws_cloudwatch:   ['Amazon-CloudWatch_48',                  '👁'],
  aws_cognito:      ['Amazon-Cognito_48',                     '🔑'],
  aws_neptune:      ['Amazon-Neptune_48.svg',                 '⬡'],
  aws_opensearch:   ['Amazon-OpenSearch-Service_48',          '🔍'],
  kafka:            ['icons8-apache-kafka-48',                '📨'],
  redis:            ['icons8-redis-48',                       '⚡'],
}

// Keys with no real icon asset — emoji only
const EMOJI_ONLY: Record<string, string> = {
  client:       '💻',
  server:       '🖥',
  database:     '🗄',
  load_balancer:'⚖',
  cache:        '⚡',
  queue:        '📬',
  microservice: '⚙',
  mobile:       '📱',
  browser:      '🌐',
  cdn:          '🌍',
  firewall:     '🔥',
  nginx:        '⇄',
  spring_boot:  '🌱',
  postgres:     '🐘',
  mysql:        '🐬',
  mongodb:      '🍃',
  elasticsearch:'🔍',
  docker:       '🐳',
  kubernetes:   '☸',
  graphql:      '◈',
  table:        '▦',
  api_service:  '⬡',
  unknown:      '□',
}

const _cache = new Map<string, IconResult>()

export function getIcon(key: string): IconResult {
  if (_cache.has(key)) return _cache.get(key)!

  const mapped = ICON_MAP[key]
  if (mapped) {
    const [pattern, emoji] = mapped
    const src = findUrl(AWS_SVC, pattern) ?? findUrl(OTHERS, pattern)
    const result: IconResult = { src, emoji }
    _cache.set(key, result)
    return result
  }

  const emoji = EMOJI_ONLY[key] ?? '□'
  const result: IconResult = { emoji }
  _cache.set(key, result)
  return result
}

export const GROUP_COLORS: Record<string, string> = {
  client:     '#3b82f6',
  clients:    '#3b82f6',
  frontend:   '#3b82f6',
  backend:    '#10b981',
  service:    '#10b981',
  services:   '#10b981',
  database:   '#8b5cf6',
  data:       '#8b5cf6',
  networking: '#f59e0b',
  network:    '#f59e0b',
  messaging:  '#ef4444',
  queue:      '#ef4444',
  cdn:        '#14b8a6',
  auth:       '#f97316',
  storage:    '#6366f1',
  monitoring: '#84cc16',
  user:       '#06b6d4',
  order:      '#f59e0b',
  catalog:    '#8b5cf6',
  api_layer:  '#3b82f6',
  business:   '#10b981',
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
