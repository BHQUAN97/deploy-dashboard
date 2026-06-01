import { NextRequest } from 'next/server'
import { getRunWithJobs, RunWithJobs } from '@/lib/github'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params
  const repo = req.nextUrl.searchParams.get('repo') ?? ''
  const numericRunId = parseInt(runId)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const encode = (event: object) =>
        encoder.encode(`data: ${JSON.stringify(event)}\n\n`)

      // Trạng thái steps đã emit, dùng để diff
      const emittedSteps = new Map<string, string>() // key: "jobId-stepNum", value: status|conclusion

      let done = false
      let pingCount = 0

      while (!done) {
        // Keepalive ping mỗi 15s để tránh SSE timeout
        pingCount++
        if (pingCount % 3 === 0) {
          controller.enqueue(encoder.encode(': ping\n\n'))
        }

        const runData: RunWithJobs | null = await getRunWithJobs(repo, numericRunId)
        if (!runData) {
          controller.enqueue(encode({ type: 'error', message: 'Run not found' }))
          controller.close()
          return
        }

        // Emit run status
        controller.enqueue(encode({
          type: 'run',
          status: runData.status,
          conclusion: runData.conclusion,
        }))

        // Emit step changes
        for (const job of runData.jobs) {
          for (const step of job.steps) {
            const key = `${job.id}-${step.number}`
            const currentVal = `${step.status}|${step.conclusion ?? ''}`
            if (emittedSteps.get(key) !== currentVal) {
              emittedSteps.set(key, currentVal)
              controller.enqueue(encode({
                type: 'step',
                jobName: job.name,
                jobId: job.id,
                stepName: step.name,
                stepNumber: step.number,
                status: step.status,
                conclusion: step.conclusion,
                startedAt: step.startedAt,
                completedAt: step.completedAt,
              }))
            }
          }
        }

        // Emit job status changes
        for (const job of runData.jobs) {
          const key = `job-${job.id}`
          const currentVal = `${job.status}|${job.conclusion ?? ''}`
          if (emittedSteps.get(key) !== currentVal) {
            emittedSteps.set(key, currentVal)
            controller.enqueue(encode({
              type: 'job',
              jobName: job.name,
              jobId: job.id,
              status: job.status,
              conclusion: job.conclusion,
              startedAt: job.startedAt,
              completedAt: job.completedAt,
            }))
          }
        }

        if (runData.status === 'completed') {
          controller.enqueue(encode({
            type: 'done',
            conclusion: runData.conclusion,
            url: runData.url,
          }))
          controller.close()
          done = true
        } else {
          await new Promise(r => setTimeout(r, 5000))
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
