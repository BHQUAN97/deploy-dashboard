import { NextRequest } from 'next/server'
import { createSshStream, runSshCommand, SSE_HEADERS } from '@/lib/ssh-client'
import { CERTBOT_CONTAINER, NGINX_CONTAINER, CERTBOT_WEBROOT } from '@/config/vps-domains'
import { invalidateCache } from '@/lib/domain-health'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { domain, sans, force } = await req.json() as { domain: string; sans: string[]; force?: boolean }

  if (!domain) {
    return new Response(JSON.stringify({ error: 'domain required' }), { status: 400 })
  }

  // Kiểm tra cert hiện tại (nếu không force)
  if (!force) {
    const checkCmd = `docker exec ${CERTBOT_CONTAINER} openssl x509 -in /etc/letsencrypt/live/${domain}/fullchain.pem -noout -issuer -checkend $((30*24*3600)) 2>/dev/null && echo VALID_LETSENCRYPT || echo NEEDS_RENEWAL`
    try {
      const result = await runSshCommand(checkCmd, 15000)
      const output = result.stdout.trim()
      if (output.includes('VALID_LETSENCRYPT') && output.includes("Let's Encrypt")) {
        const stream = new ReadableStream({
          start(controller) {
            const enc = new TextEncoder()
            controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: 'log', line: `Cert for ${domain} is valid and Let's Encrypt. Skipping. Use force=true to override.`, isStderr: false })}\n\n`))
            controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: 'done', exitCode: 0, skipped: true })}\n\n`))
            controller.close()
          },
        })
        return new Response(stream, { headers: SSE_HEADERS })
      }
    } catch {}
  }

  // Xóa placeholder certs cũ rồi issue mới
  const email = process.env.CERTBOT_EMAIL ?? 'admin@example.com'
  const sanArgs = (sans ?? [domain]).map(d => `-d ${d}`).join(' ')
  const cmd = [
    `docker exec ${CERTBOT_CONTAINER} rm -rf /etc/letsencrypt/live/${domain} /etc/letsencrypt/archive/${domain} /etc/letsencrypt/renewal/${domain}.conf 2>/dev/null || true`,
    `docker exec ${CERTBOT_CONTAINER} certbot certonly --webroot -w ${CERTBOT_WEBROOT} ${sanArgs} --email ${email} --agree-tos --non-interactive 2>&1`,
    `docker exec ${NGINX_CONTAINER} nginx -t 2>&1 && docker exec ${NGINX_CONTAINER} nginx -s reload 2>&1 && echo "nginx reloaded"`,
  ].join(' && ')

  // Invalidate cache sau khi cert mới
  invalidateCache(domain)

  return new Response(createSshStream(cmd, 120000), { headers: SSE_HEADERS })
}
