import { Client, ConnectConfig } from 'ssh2'

export interface SshResult {
  stdout: string
  stderr: string
  exitCode: number
}

function getConnectConfig(): ConnectConfig {
  return {
    host: process.env.VPS_HOST ?? '',
    port: parseInt(process.env.VPS_PORT ?? '22'),
    username: process.env.VPS_USER ?? 'root',
    password: process.env.VPS_PASSWORD ?? '',
    readyTimeout: 15000,
    keepaliveInterval: 10000,
  }
}

// Chạy lệnh SSH và trả về full output (không stream)
export function runSshCommand(command: string, timeoutMs = 120000): Promise<SshResult> {
  return new Promise((resolve, reject) => {
    const conn = new Client()
    let stdout = ''
    let stderr = ''

    const timer = setTimeout(() => {
      conn.end()
      reject(new Error(`SSH command timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          clearTimeout(timer)
          conn.end()
          reject(err)
          return
        }
        stream.on('data', (data: Buffer) => { stdout += data.toString() })
        stream.stderr.on('data', (data: Buffer) => { stderr += data.toString() })
        stream.on('close', (code: number) => {
          clearTimeout(timer)
          conn.end()
          resolve({ stdout, stderr, exitCode: code ?? 0 })
        })
      })
    })

    conn.on('error', err => {
      clearTimeout(timer)
      reject(err)
    })

    conn.connect(getConnectConfig())
  })
}

// Stream SSH command output qua ReadableStream (cho SSE)
// Mỗi chunk data → controller.enqueue(sseEvent)
export function streamSshCommand(
  command: string,
  onLine: (line: string, isStderr: boolean) => void,
  onDone: (exitCode: number) => void,
  onError: (err: Error) => void,
  timeoutMs = 120000
): void {
  const conn = new Client()

  const timer = setTimeout(() => {
    conn.end()
    onError(new Error(`SSH command timed out after ${timeoutMs}ms`))
  }, timeoutMs)

  conn.on('ready', () => {
    conn.exec(command, (err, stream) => {
      if (err) {
        clearTimeout(timer)
        conn.end()
        onError(err)
        return
      }

      // Buffer để xử lý line-by-line
      let stdoutBuf = ''
      let stderrBuf = ''

      stream.on('data', (data: Buffer) => {
        stdoutBuf += data.toString()
        const lines = stdoutBuf.split('\n')
        stdoutBuf = lines.pop() ?? ''
        lines.forEach(l => onLine(l, false))
      })

      stream.stderr.on('data', (data: Buffer) => {
        stderrBuf += data.toString()
        const lines = stderrBuf.split('\n')
        stderrBuf = lines.pop() ?? ''
        lines.forEach(l => onLine(l, true))
      })

      stream.on('close', (code: number) => {
        clearTimeout(timer)
        // Flush remaining buffer
        if (stdoutBuf) onLine(stdoutBuf, false)
        if (stderrBuf) onLine(stderrBuf, true)
        conn.end()
        onDone(code ?? 0)
      })
    })
  })

  conn.on('error', err => {
    clearTimeout(timer)
    onError(err)
  })

  conn.connect(getConnectConfig())
}

// Helper: tạo SSE ReadableStream từ SSH command
// Dùng trong Route Handler: return new Response(createSshStream(cmd), {headers: SSE_HEADERS})
export function createSshStream(command: string, timeoutMs = 120000): ReadableStream {
  return new ReadableStream({
    start(controller) {
      const encode = (event: object) =>
        `data: ${JSON.stringify(event)}\n\n`

      controller.enqueue(new TextEncoder().encode(
        encode({ type: 'log', line: `$ ${command}`, isStderr: false, timestamp: new Date().toISOString() })
      ))

      streamSshCommand(
        command,
        (line, isStderr) => {
          if (line.trim()) {
            controller.enqueue(new TextEncoder().encode(
              encode({ type: 'log', line, isStderr, timestamp: new Date().toISOString() })
            ))
          }
        },
        (exitCode) => {
          controller.enqueue(new TextEncoder().encode(
            encode({ type: 'done', exitCode, timestamp: new Date().toISOString() })
          ))
          controller.close()
        },
        (err) => {
          controller.enqueue(new TextEncoder().encode(
            encode({ type: 'error', message: err.message, timestamp: new Date().toISOString() })
          ))
          controller.close()
        },
        timeoutMs
      )
    },
  })
}

export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no',
}
