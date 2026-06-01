import { CertTable } from '@/components/maintenance/CertTable'
import { NetworkPanel } from '@/components/maintenance/NetworkPanel'
import { SeedPanel } from '@/components/maintenance/SeedPanel'
import { BackupAllPanel } from '@/components/maintenance/BackupAllPanel'
import { Separator } from '@/components/ui/separator'

export default function MaintenancePage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-white">VPS Maintenance</h2>
        <p className="text-sm text-zinc-500 mt-0.5">SSL certificates, Docker networks, seed data</p>
      </div>

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">SSL Certificates</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Let&apos;s Encrypt certs cho tất cả domains</p>
        </div>
        <CertTable />
      </section>

      <Separator className="bg-zinc-800" />

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Docker Networks</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Fix 502 Bad Gateway sau khi deploy hoặc restart VPS</p>
        </div>
        <NetworkPanel />
      </section>

      <Separator className="bg-zinc-800" />

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Seed Data</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Chạy seed scripts trên production containers</p>
        </div>
        <SeedPanel />
      </section>

      <Separator className="bg-zinc-800" />

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Database Backup</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Trigger manual backup — dump DB, encrypt GPG, push git branch</p>
        </div>
        <BackupAllPanel />
      </section>
    </div>
  )
}
