import https from 'https'
import tls from 'tls'

export interface SslInfo {
  valid: boolean
  issuer: string
  daysRemaining: number
  expiresAt: string
  isLetsEncrypt: boolean
}

export interface DomainHealth {
  domain: string
  httpStatus: number | null
  responseTimeMs: number
  ssl: SslInfo | null
  reachable: boolean
  checkedAt: string
  error?: string
}

// Memory cache: domain → {data, expiresAt}
const healthCache = new Map<string, { data: DomainHealth; expiresAt: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 phút

function getCached(domain: string): DomainHealth | null {
  const entry = healthCache.get(domain)
  if (entry && Date.now() < entry.expiresAt) return entry.data
  return null
}

function setCache(domain: string, data: DomainHealth) {
  healthCache.set(domain, { data, expiresAt: Date.now() + CACHE_TTL_MS })
}

// Xóa cache cho domain cụ thể (gọi sau khi renew cert)
export function invalidateCache(domain?: string) {
  if (domain) healthCache.delete(domain)
  else healthCache.clear()
}

// Lấy SSL cert info qua tls.connect() — reliable hơn https.get vì không bị ảnh hưởng bởi redirects
function getSslInfo(domain: string): Promise<SslInfo | null> {
  return new Promise(resolve => {
    let resolved = false
    const done = (val: SslInfo | null) => {
      if (!resolved) { resolved = true; resolve(val) }
    }

    const socket = tls.connect(
      { host: domain, port: 443, servername: domain, rejectUnauthorized: false },
      () => {
        try {
          const cert = socket.getPeerCertificate(false)
          socket.destroy()
          if (!cert?.valid_to) return done(null)

          const expiresAt = new Date(cert.valid_to)
          const daysRemaining = Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          const issuerRaw = cert.issuer?.O
          const issuerOrg = Array.isArray(issuerRaw) ? issuerRaw[0] : (issuerRaw ?? 'Unknown')

          done({
            valid: daysRemaining > 0,
            issuer: issuerOrg,
            daysRemaining,
            expiresAt: expiresAt.toISOString(),
            isLetsEncrypt: issuerOrg.includes("Let's Encrypt"),
          })
        } catch {
          done(null)
        }
      }
    )

    socket.on('error', () => done(null))
    socket.setTimeout(8000, () => { socket.destroy(); done(null) })
  })
}

// Check HTTP status + response time
function checkHttp(domain: string): Promise<{ status: number | null; ms: number; reachable: boolean }> {
  return new Promise(resolve => {
    const start = Date.now()
    const url = `https://${domain}/`
    const req = https.get(url, { rejectUnauthorized: false }, res => {
      const ms = Date.now() - start
      resolve({ status: res.statusCode ?? null, ms, reachable: true })
      res.destroy()
    })
    req.on('error', () => resolve({ status: null, ms: Date.now() - start, reachable: false }))
    req.setTimeout(8000, () => { req.destroy(); resolve({ status: null, ms: 8000, reachable: false }) })
  })
}

export async function checkDomainHealth(domain: string, forceRefresh = false): Promise<DomainHealth> {
  if (!forceRefresh) {
    const cached = getCached(domain)
    if (cached) return cached
  }

  const [httpResult, ssl] = await Promise.all([checkHttp(domain), getSslInfo(domain)])

  const result: DomainHealth = {
    domain,
    httpStatus: httpResult.status,
    responseTimeMs: httpResult.ms,
    ssl,
    reachable: httpResult.reachable,
    checkedAt: new Date().toISOString(),
  }

  setCache(domain, result)
  return result
}

export async function checkAllDomains(domains: string[], forceRefresh = false): Promise<DomainHealth[]> {
  return Promise.all(domains.map(d => checkDomainHealth(d, forceRefresh)))
}
