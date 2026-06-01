import { NextRequest } from 'next/server'
import { createSshStream, SSE_HEADERS } from '@/lib/ssh-client'
import { CERTBOT_CONTAINER, NGINX_CONTAINER, CERTBOT_WEBROOT } from '@/config/vps-domains'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain') ?? ''
  const sans = req.nextUrl.searchParams.get('sans')?.split(',') ?? [domain]
  const force = req.nextUrl.searchParams.get('force') === 'true'

  if (!domain) return new Response('domain required', { status: 400 })

  const email = process.env.CERTBOT_EMAIL ?? 'admin@example.com'
  const sanArgs = sans.map(d => `-d ${d}`).join(' ')

  const cmd = force
    ? [
        `docker exec ${CERTBOT_CONTAINER} rm -rf /etc/letsencrypt/live/${domain} /etc/letsencrypt/archive/${domain} /etc/letsencrypt/renewal/${domain}.conf 2>/dev/null || true`,
        `docker exec ${CERTBOT_CONTAINER} certbot certonly --webroot -w ${CERTBOT_WEBROOT} ${sanArgs} --email ${email} --agree-tos --non-interactive 2>&1`,
        `docker exec ${NGINX_CONTAINER} nginx -t 2>&1 && docker exec ${NGINX_CONTAINER} nginx -s reload 2>&1 && echo "nginx reloaded"`,
      ].join(' && ')
    : `docker exec ${CERTBOT_CONTAINER} certbot certonly --webroot -w ${CERTBOT_WEBROOT} ${sanArgs} --email ${email} --agree-tos --non-interactive 2>&1 && docker exec ${NGINX_CONTAINER} nginx -s reload 2>&1 && echo "nginx reloaded"`

  return new Response(createSshStream(cmd, 120000), { headers: SSE_HEADERS })
}
