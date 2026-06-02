import { Octokit } from '@octokit/rest'

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
const OWNER = process.env.GITHUB_OWNER ?? 'BHQUAN97'

export interface RunInfo {
  runId: number
  status: 'queued' | 'in_progress' | 'completed'
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null
  branch: string
  createdAt: string
  updatedAt: string
  url: string
  triggeredBy: string
}

export interface StepInfo {
  number: number
  name: string
  status: 'queued' | 'in_progress' | 'completed'
  conclusion: string | null
  startedAt: string | null
  completedAt: string | null
}

export interface JobInfo {
  id: number
  name: string
  status: string
  conclusion: string | null
  startedAt: string | null
  completedAt: string | null
  steps: StepInfo[]
}

export interface RunWithJobs extends RunInfo {
  jobs: JobInfo[]
}

// Lấy run đang chạy (in_progress hoặc queued) của repo
export async function getActiveRun(repo: string): Promise<RunInfo | null> {
  try {
    const { data } = await octokit.actions.listWorkflowRunsForRepo({
      owner: OWNER,
      repo,
      status: 'in_progress',
      per_page: 1,
    })
    if (data.workflow_runs.length > 0) {
      return mapRun(data.workflow_runs[0])
    }
    // Check queued
    const queued = await octokit.actions.listWorkflowRunsForRepo({
      owner: OWNER,
      repo,
      status: 'queued',
      per_page: 1,
    })
    if (queued.data.workflow_runs.length > 0) {
      return mapRun(queued.data.workflow_runs[0])
    }
    return null
  } catch {
    return null
  }
}

// Lấy run mới nhất của repo (bất kể status)
export async function getLatestRun(repo: string): Promise<RunInfo | null> {
  try {
    const { data } = await octokit.actions.listWorkflowRunsForRepo({
      owner: OWNER,
      repo,
      per_page: 1,
    })
    if (data.workflow_runs.length === 0) return null
    return mapRun(data.workflow_runs[0])
  } catch {
    return null
  }
}

// Trigger workflow dispatch cho repo
// Trả về run ID (cần poll để tìm run mới nhất sau dispatch)
export async function triggerWorkflow(repo: string, workflowFile: string, branch: string): Promise<{ triggered: boolean; error?: string }> {
  try {
    // Kiểm tra có run đang chạy không
    const active = await getActiveRun(repo)
    if (active) {
      return { triggered: false, error: `Run #${active.runId} đang ${active.status}` }
    }

    await octokit.actions.createWorkflowDispatch({
      owner: OWNER,
      repo,
      workflow_id: workflowFile,
      ref: branch,
    })
    return { triggered: true }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return { triggered: false, error: msg }
  }
}

// Poll để tìm run được tạo sau thời điểm triggerTime
export async function findNewRun(repo: string, afterTime: Date, maxWaitMs = 30000): Promise<RunInfo | null> {
  const deadline = Date.now() + maxWaitMs
  while (Date.now() < deadline) {
    try {
      const { data } = await octokit.actions.listWorkflowRunsForRepo({
        owner: OWNER,
        repo,
        event: 'workflow_dispatch',
        per_page: 5,
      })
      const found = data.workflow_runs.find(r => new Date(r.created_at) > afterTime)
      if (found) return mapRun(found)
    } catch {}
    await sleep(3000)
  }
  return null
}

// Lấy run theo ID kèm jobs và steps
export async function getRunWithJobs(repo: string, runId: number): Promise<RunWithJobs | null> {
  try {
    const [runRes, jobsRes] = await Promise.all([
      octokit.actions.getWorkflowRun({ owner: OWNER, repo, run_id: runId }),
      octokit.actions.listJobsForWorkflowRun({ owner: OWNER, repo, run_id: runId }),
    ])
    return {
      ...mapRun(runRes.data),
      jobs: jobsRes.data.jobs.map(j => mapJob(j as Parameters<typeof mapJob>[0])),
    }
  } catch {
    return null
  }
}

function mapRun(r: {
  id: number
  status: string | null
  conclusion: string | null
  head_branch: string | null
  created_at: string
  updated_at: string
  html_url: string
  triggering_actor?: { login: string } | null
}): RunInfo {
  return {
    runId: r.id,
    status: (r.status ?? 'queued') as RunInfo['status'],
    conclusion: (r.conclusion ?? null) as RunInfo['conclusion'],
    branch: r.head_branch ?? 'main',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    url: r.html_url,
    triggeredBy: r.triggering_actor?.login ?? 'unknown',
  }
}

function mapJob(j: {
  id: number
  name: string
  status: string
  conclusion: string | null
  started_at: string | null
  completed_at: string | null
  steps?: Array<{
    number: number
    name: string
    status: string
    conclusion: string | null
    started_at?: string | null
    completed_at?: string | null
  }>
}): JobInfo {
  return {
    id: j.id,
    name: j.name,
    status: j.status,
    conclusion: j.conclusion,
    startedAt: j.started_at,
    completedAt: j.completed_at,
    steps: (j.steps ?? []).map(s => ({
      number: s.number,
      name: s.name,
      status: s.status as StepInfo['status'],
      conclusion: s.conclusion,
      startedAt: s.started_at ?? null,
      completedAt: s.completed_at ?? null,
    })),
  }
}

// Lấy run mới nhất của một workflow cụ thể (vd: 'backup.yml')
export async function getLatestRunForWorkflow(repo: string, workflowFile: string): Promise<RunInfo | null> {
  try {
    const { data } = await octokit.actions.listWorkflowRuns({
      owner: OWNER,
      repo,
      workflow_id: workflowFile,
      per_page: 1,
    })
    if (data.workflow_runs.length === 0) return null
    return mapRun(data.workflow_runs[0])
  } catch {
    return null
  }
}

// Lấy N run gần nhất của repo (bất kể workflow)
export async function getRecentRuns(repo: string, limit = 5): Promise<RunInfo[]> {
  try {
    const { data } = await octokit.actions.listWorkflowRunsForRepo({
      owner: OWNER,
      repo,
      per_page: limit,
    })
    return data.workflow_runs.map(mapRun)
  } catch {
    return []
  }
}

// Lấy N run gần nhất của một workflow cụ thể
export async function getRecentRunsForWorkflow(repo: string, workflowFile: string, limit = 5): Promise<RunInfo[]> {
  try {
    const { data } = await octokit.actions.listWorkflowRuns({
      owner: OWNER,
      repo,
      workflow_id: workflowFile,
      per_page: limit,
    })
    return data.workflow_runs.map(mapRun)
  } catch {
    return []
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
