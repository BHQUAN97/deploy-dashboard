import { createSshStream, SSE_HEADERS } from '@/lib/ssh-client'
import { NETWORKS_TO_FIX, NETWORK_CONTAINERS } from '@/config/vps-domains'

export const dynamic = 'force-dynamic'

export async function GET() {
  const connectCmds = NETWORK_CONTAINERS.map(
    c => `docker network connect ${NETWORKS_TO_FIX} ${c} 2>/dev/null && echo "Connected: ${c}" || echo "Skip: ${c}"`
  ).join('\n')

  const cmd = `export PATH=$PATH:/usr/local/bin\n${connectCmds}\ndocker exec shared-nginx nginx -t 2>&1 && docker exec shared-nginx nginx -s reload && echo "nginx reloaded"\necho "Done"`
  return new Response(createSshStream(cmd, 60000), { headers: SSE_HEADERS })
}
