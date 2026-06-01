# NEXT_SESSION.md — Deploy Dashboard

> Tổng hợp cuối phiên 2026-06-01/02. Đọc file này trước khi bắt đầu làm việc.

---

## ✅ Đã hoàn thành phiên này

### VPS Migration (134.122.21.251 → 159.223.77.247)
- [x] Docker install trên VPS mới
- [x] Secrets GitHub đã update cho 6 repos
- [x] VietNet2026, FashionEcom, LeQuyDon, GEO Tracker, WebTemplate, WebPhoto — đã deploy
- [x] SSL certs thật (Let's Encrypt) cho tất cả 6 domains
- [x] shared-nginx running, `webphoto_backend` network OK
- [x] `fashionecom-frontend` fix: `HOSTNAME=0.0.0.0` (tránh Next.js bind sai IP → 502)
- [x] `lqd-frontend` connect thủ công vào `webphoto_backend`
- [x] Seed data VietNet2026: admin + categories + 20 products + full demo

### Deploy Dashboard (repo mới: BHQUAN97/deploy-dashboard)
- [x] Next.js 16 + TypeScript + shadcn/ui + ssh2 + @octokit/rest
- [x] Basic Auth proxy (Next.js 16 `proxy.ts` convention)
- [x] Dashboard: 6 project cards + status badges + deploy flow
- [x] Deploy Drawer: real-time step progress qua SSE (poll GitHub API 5s)
- [x] VPS Maintenance: CertTable + NetworkPanel + SeedPanel
- [x] Showcase public: portfolio + Demo Credentials copy button
- [x] Dockerfile + nginx conf + GitHub Actions CI/CD
- [x] Deploy thủ công lên VPS: container đang chạy port 7000
- [x] CLAUDE.md + docs/DEPLOY-ALL-REPOS.md + docs/ADDING-NEW-REPO.md + docs/BACKUP-GOOGLE-DRIVE.md

---

## 🔴 Việc cần làm NGAY (trước khi làm việc khác)

### 1. DNS deploy-dashboard.bhquan.store (USER tự làm)
```
deploy-dashboard.bhquan.store  →  A  →  159.223.77.247
```
Sau khi DNS propagate, chạy lệnh này để lấy SSL cert thật:
```bash
ssh root@159.223.77.247
docker exec infra-certbot rm -rf /etc/letsencrypt/live/deploy-dashboard.bhquan.store \
  /etc/letsencrypt/archive/deploy-dashboard.bhquan.store \
  /etc/letsencrypt/renewal/deploy-dashboard.bhquan.store.conf
docker exec infra-certbot certbot certonly --webroot -w /var/www/certbot \
  -d deploy-dashboard.bhquan.store \
  --email buihongquan28041997@gmail.com --agree-tos --non-interactive
docker exec shared-nginx nginx -s reload
```
Credentials: **admin / Deploy@2026!**

---

## 🔨 Task phiên sau — BACKUP SYSTEM

### Context: 2 approach hiện có
| Repo | Approach | Storage | Pattern |
|------|----------|---------|---------|
| GEO Tracker | rclone → Google Drive | Drive free (15GB) | VPS cron + in-app job |
| WebPhoto | Git branch `backups` | GitHub unlimited | GH Actions + encrypt GPG |

**WebPhoto `backup.yml` đánh giá: rất tốt** — verify integrity, GPG AES-256, prune cũ, diagnose on failure, cleanup VPS temp. Gần như copy được nguyên xi.

**Quyết định cần thống nhất đầu phiên sau:**

> **Câu hỏi:** Dùng approach nào cho 4 repos còn lại (VietNet, FashionEcom, LeQuyDon, WebTemplate)?
> - **Option A — Git branch** (như WebPhoto): đơn giản, không cần setup ngoài, mỗi repo tự lưu backup branch
> - **Option B — Google Drive** (như GEO Tracker): tập trung 1 chỗ, rclone đã setup, dễ share với KH
> - **Option C — Hybrid**: DB → git branch (nhanh, free), đồng thời rclone → Drive (external copy)

**Gợi ý**: Option A cho 4 repos mới (copy pattern WebPhoto), vì:
- WebPhoto backup.yml đã production-ready, chỉ cần đổi DB name
- Không cần setup rclone mới
- Mỗi repo isolated, dễ restore
- Google Drive optional sau

---

### Task 1 — Tạo backup.yml cho 4 repos (clone từ WebPhoto)

**Template**: Copy `WebPhoto/.github/workflows/backup.yml` và chỉnh:

| Repo | DB cần backup | Uploads volume | Cron offset |
|------|--------------|----------------|-------------|
| VietNet2026 | `vietnet` | `vietnet_uploads` (nếu có) | `0 18 * * *` (1AM ICT) |
| FashionEcom | `fashionecom` | — | `0 19 * * *` (2AM ICT) |
| LeQuyDon | `lequydon` | — | `30 19 * * *` (2:30AM ICT) |
| WebTemplate | `webtemplate` (nếu có) | — | `0 20 * * *` (3AM ICT) |

> GEO Tracker giữ nguyên `0 19 * * *` (2AM ICT) — không đụng.
> WebPhoto giữ nguyên `0 21 * * *` (4AM ICT) — không đụng.

**Secrets cần set** cho 4 repos:
```bash
BACKUP_ENCRYPT_KEY=<same-key-for-all>  # dùng chung 1 key
```

**Files cần tạo:**
- `E:\DEVELOP\VietNet2026\.github\workflows\backup.yml`
- `E:\DEVELOP\FashionEcom\.github\workflows\backup.yml`
- `E:\DEVELOP\LeQuyDon\.github\workflows\backup.yml`
- `E:\DEVELOP\WebTemplate\.github\workflows\backup.yml`

---

### Task 2 — Thêm Backup feature vào Deploy Dashboard

#### 2a. Update `src/config/projects.ts`

Thêm field vào `ProjectConfig` interface:
```typescript
backupWorkflow?: string     // 'backup.yml'
backupDatabase?: string     // 'vietnet', 'fashionecom'...
```

Điền cho 6 projects (WebPhoto + GEO Tracker có sẵn, 4 repo kia sau Task 1):
```typescript
// VietNet2026
backupWorkflow: 'backup.yml',
backupDatabase: 'vietnet',
// FashionEcom
backupWorkflow: 'backup.yml',
backupDatabase: 'fashionecom',
// ... tương tự
```

#### 2b. Thêm API route

`src/app/api/backup/[repo]/route.ts`:
```typescript
// POST: trigger backup workflow
// GET: latest backup run info
// Pattern y hệt /api/deploy/[repo]/route.ts — copy và đổi workflowFile
```

Reuse hoàn toàn `/api/runs/[runId]/stream` đã có cho SSE.

#### 2c. Thêm BackupButton component

`src/components/dashboard/BackupButton.tsx` — tương tự `DeployButton.tsx`:
- Trigger `POST /api/backup/{repo}`
- Mở `DeployDrawer` (reuse component) với runId từ backup run
- Show kết quả (success/failure)

#### 2d. Thêm vào ProjectCard

```tsx
// Trong ProjectCard.tsx, bên dưới DeployButton:
{project.backupWorkflow && (
  <BackupButton project={project} onBackupStart={onBackupStart} />
)}
```

#### 2e. Thêm "Backup All" vào Maintenance page

Button trigger tất cả backup workflows tuần tự:
```typescript
// POST /api/backup/all → loop qua PROJECTS có backupWorkflow
// Mỗi trigger cách nhau 30s để tránh race condition VPS
```

---

### Task 3 — Deploy Dashboard thêm GitHub Secrets

```bash
# Sau khi tạo backup.yml cho 4 repos:
ENCRYPT_KEY="your-strong-passphrase-here"
for REPO in BHQUAN97/VietNet2026 BHQUAN97/FashionEcom BHQUAN97/LeQuyDon BHQUAN97/WebTemplate; do
  gh secret set BACKUP_ENCRYPT_KEY --body "$ENCRYPT_KEY" --repo $REPO
done
```

---

## 📋 Backlog (sau backup system)

### Cải thiện Deploy Dashboard
- [ ] Trang Settings: hiển thị VPS info (disk, memory, container count)
- [ ] Trang Logs: xem `/var/log/vps-backup.log` và nginx access logs qua SSH stream
- [ ] Auto-refresh domain health khi tab đang focus (Visibility API)
- [ ] Dark/light mode toggle

### Infrastructure
- [ ] Viết restore script mẫu cho từng DB (`docs/RESTORE-GUIDE.md`)
- [ ] Thêm health check cron cho deploy-dashboard (tự ping `/api/domains/health` mỗi 6h)
- [ ] VPS monitor: alert khi disk > 80% hoặc memory > 85%

---

## 🗂 Files quan trọng

| File | Mô tả |
|------|-------|
| `src/config/projects.ts` | Thêm project mới và backup config ở đây |
| `src/config/vps-domains.ts` | Thêm cert domain và NETWORK_CONTAINERS |
| `src/proxy.ts` | Basic Auth — đổi DASHBOARD_USER/PASS trong GitHub Secrets |
| `src/lib/github.ts` | `triggerWorkflow()` → reuse cho backup |
| `src/lib/ssh-client.ts` | SSH stream — timeout 120s |
| `docs/ADDING-NEW-REPO.md` | Checklist thêm repo mới |
| `docs/BACKUP-GOOGLE-DRIVE.md` | Thiết kế backup → Drive (nếu chọn Option B/C) |
| `E:\DEVELOP\.claude-shared\projects\DEVELOP\VPS-FRESH-DEPLOY.md` | Hướng dẫn deploy VPS mới từ đầu |

---

## 🔑 Credentials & Config quan trọng

| Mục | Giá trị |
|-----|---------|
| VPS IP | 159.223.77.247 |
| VPS SSH | root / 12345678@AbcBHQuan |
| MySQL root | StrongRootPass2024! |
| VietNet admin | admin@vietnet.local / Admin@123 |
| WebPhoto admin | admin@photostorage.com / admin123 |
| Dashboard | admin / Deploy@2026! |
| GitHub | BHQUAN97 |
| Certbot email | buihongquan28041997@gmail.com |

---

## 🏗 Kiến trúc tóm tắt

```
VPS 159.223.77.247
├── shared-nginx (80/443) — proxy tất cả domains
├── infra-certbot — auto-renew SSL
├── shared-mysql — 5 databases (vietnet, fashionecom, lequydon, photo_storage, tracker)
├── shared-redis
│
├── vietnet-api + vietnet-frontend  → bhquan.store
├── fashionecom-api + fashionecom-frontend → shop.bhquan.store
├── lqd-api + lqd-frontend → lqd.bhquan.store
├── tracker-api + tracker-dashboard + tracker-plausible → photostorage.cloud
├── wt-backend + wt-frontend → template.bhquan.store
├── photo-api + photo-worker → photo.bhquan.store
└── deploy-dashboard → deploy-dashboard.bhquan.store (port 7000)

Network: webphoto_backend — tất cả containers phải có mặt
```
