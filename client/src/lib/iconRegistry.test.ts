import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { getIcon } from './iconRegistry.ts'

test('known provider icons resolve through the curated manifest', () => {
  const icon = getIcon('aws_lambda')
  assert.match(icon.src ?? '', /Arch_AWS-Lambda_48\.svg/)
  assert.equal(icon.emoji, 'λ')
})

test('unknown icons preserve the lightweight fallback', () => {
  assert.deepEqual(getIcon('not-in-the-manifest'), { emoji: '□' })
})

test('icon registry does not eagerly glob complete provider libraries', () => {
  const source = readFileSync(new URL('./iconRegistry.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /import\.meta\.glob/)
})
