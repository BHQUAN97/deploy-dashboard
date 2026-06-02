import { LogsViewer } from '@/components/logs/LogsViewer'

export default function LogsPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-lg font-semibold text-white">Application Logs</h2>
        <p className="text-sm text-zinc-500 mt-0.5">
          Docker container logs và log files — fetch tĩnh hoặc live tail
        </p>
      </div>
      <LogsViewer />
    </div>
  )
}
