import { describe, expect, it } from 'vitest'
import { appBaseRedirect } from '../appBaseRedirect.ts'

describe('appBaseRedirect', () => {
  it('normaliza a entrada sem a barra final', () => {
    expect(appBaseRedirect('/app')).toBe('/app/')
  })

  it('preserva rotas canônicas e filhas', () => {
    expect(appBaseRedirect('/app/')).toBeNull()
    expect(appBaseRedirect('/app/login')).toBeNull()
    expect(appBaseRedirect('/app?source=test')).toBeNull()
  })
})
