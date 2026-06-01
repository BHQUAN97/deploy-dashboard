# Tài Liệu Triển Khai — Tất Cả Repos

> Tham khảo nhanh cho tất cả 7 projects trên VPS 159.223.77.247
> Tài liệu đầy đủ hơn: `E:\DEVELOP\.claude-shared\projects\DEVELOP\VPS-FRESH-DEPLOY.md`

---

## Bảng tổng hợp

| Project | Repo | Branch | Domain | FE Port | BE Port | Stack |
|---------|------|--------|--------|---------|---------|-------|
| VietNet2026 | VietNet2026 | main | bhquan.store | 3000→3100 | 4000→4100 | Next.js 15 + NestJS |
| FashionEcom | FashionEcom | master | shop.bhquan.store | 3000 | 4000 | Next.js 14 + NestJS |
| LeQuyDon | LeQuyDon | main | lqd.bhquan.store | 3000→3200 | 4000→4200 | Next.js 14 + NestJS |
| GEO Tracker | geo-tracker | master | photostorage.cloud | 3001 | 3000 | Next.js 15 + Fastify |
| WebTemplate | WebTemplate | main | template.bhquan.store | 6000 | 6001 | Next.js + NestJS |
| WebPhoto | webphoto | main | photo.bhquan.store | — | 4000→7100 | Vue 3 + Express |
| DeployDashboard | deploy-dashboard | main | monitor.bhquan.store | — | 7000 | Next.js 16 |

---

## Deploy từng project

### VietNet2026
```bash
gh workflow run deploy.yml --repo BHQUAN97/VietNet2026 --ref main
# INIT mode: seed data sau khi deploy
# docker exec vietnet-api node dist/scripts/seed-admin.js
```

### FashionEcom
```bash
gh workflow run deploy.yml --repo BHQUAN97/FashionEcom --ref master
# Lưu ý: branch là `master`, không phải `main`
# HOSTNAME=0.0.0.0 đã có trong docker-compose.prod.yml
```

### LeQuyDon
```bash
gh workflow run deploy.yml --repo BHQUAN97/LeQuyDon --ref main
```

### GEO Tracker
```bash
gh workflow run deploy.yml --repo BHQUAN97/geo-tracker --ref master
# Phụ thuộc shared-nginx phải running trước
```

### WebTemplate
```bash
gh workflow run deploy.yml --repo BHQUAN97/WebTemplate --ref main
```

### WebPhoto
```bash
gh workflow run deploy.yml --repo BHQUAN97/webphoto --ref main
# Stack: Vue 3 SPA + Express. Không phải Next.js standalone.
```

### DeployDashboard
```bash
gh workflow run deploy.yml --repo BHQUAN97/deploy-dashboard --ref main
# Hoặc: push lên main → auto-trigger
```

---

## Shared Infrastructure

Tất cả projects dùng chung:
- **shared-mysql** (MySQL 8.0) — `shared_mysql_data` volume
- **shared-redis** (Redis 7) — `shared_redis_data` volume
- **shared-nginx** (Nginx 1.27) — certs từ `shared_certbot_data` volume
- **infra-certbot** — auto-renew certs mỗi 12h
- Network: `webphoto_backend` — tất cả containers phải có mặt

Managed by: `VietNet2026/infra/docker-compose.yml` → deploy lên `/opt/infra/`

### Reset infra (nguy hiểm — mất data!)
```bash
gh workflow run vps-setup.yml --repo BHQUAN97/VietNet2026 --ref main -f action=reset-all
```

---

## SSL Certificates

Cấp cert mới (sau khi DNS đã trỏ đúng VPS):
```bash
ssh root@159.223.77.247
EMAIL="buihongquan28041997@gmail.com"

# Xóa placeholder cũ nếu có
docker exec infra-certbot rm -rf \
  /etc/letsencrypt/live/{domain} \
  /etc/letsencrypt/archive/{domain} \
  /etc/letsencrypt/renewal/{domain}.conf

# Cấp cert mới
docker exec infra-certbot certbot certonly --webroot -w /var/www/certbot \
  -d {domain} --email $EMAIL --agree-tos --non-interactive

# Reload nginx
docker exec shared-nginx nginx -t && docker exec shared-nginx nginx -s reload
```

Tất cả certs hiện có (hết hạn 2026-08-30):
- bhquan.store + www.bhquan.store
- shop.bhquan.store
- lqd.bhquan.store
- photostorage.cloud + 4 subdomains
- photo.bhquan.store
- template.bhquan.store

---

## GitHub Secrets — cập nhật khi đổi VPS

```bash
NEW_IP="xxx.xxx.xxx.xxx"
NEW_PASS="new-password"

for REPO in BHQUAN97/VietNet2026 BHQUAN97/FashionEcom BHQUAN97/LeQuyDon \
            BHQUAN97/webphoto BHQUAN97/WebTemplate BHQUAN97/geo-tracker \
            BHQUAN97/deploy-dashboard; do
  gh secret set VPS_HOST     --body "$NEW_IP"   --repo $REPO
  gh secret set VPS_PASSWORD --body "$NEW_PASS" --repo $REPO
  echo "Updated: $REPO"
done
```

---

## Troubleshooting nhanh

| Triệu chứng | Nguyên nhân | Fix |
|-------------|-------------|-----|
| 502 Bad Gateway | Container không trong `webphoto_backend` | `docker network connect webphoto_backend {container}` |
| 502 chỉ FE Next.js | HOSTNAME bind sai IP | Recreate với `-e HOSTNAME=0.0.0.0` |
| SSL error trên browser | Placeholder cert (self-signed) | Chạy certbot để lấy Let's Encrypt |
| nginx không start | `no such service: nginx` trong infra compose | Re-run `vps-setup fix-nginx` từ VietNet2026 |
| Deploy fail: "workflow_dispatch not found" | Workflow chưa có trigger | Thêm `workflow_dispatch:` vào on: |
| MySQL access denied | Root password không match | `docker exec shared-mysql printenv MYSQL_ROOT_PASSWORD` |
| Deploy failed: grep pipe exit 1 | Bash pipefail mode | Dùng while read loop thay vì grep pipe |

---

## Cron jobs trên VPS

| Thời gian | Job | Owner |
|-----------|-----|-------|
| 2:00 AM | SSL auto-renew (certbot daemon) | infra-certbot |
| 2:00 AM | VietNet backup | GitHub Actions |
| 2:30 AM | LeQuyDon backup | GitHub Actions |
| 3:00 AM | GEO Tracker backup | GitHub Actions |
| 3:30 AM | Tất cả databases → Google Drive | VPS cron |

---

## Kiểm tra sức khỏe nhanh

```bash
# SSH vào VPS
ssh root@159.223.77.247

# 1. Containers
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -v "NAMES"

# 2. Disk
df -h /

# 3. Memory
free -h

# 4. Test HTTP tất cả domains
for d in bhquan.store shop.bhquan.store lqd.bhquan.store \
          photostorage.cloud photo.bhquan.store template.bhquan.store \
          monitor.bhquan.store; do
  code=$(curl -sk -o /dev/null -w "%{http_code}" https://$d/ --max-time 5)
  echo "$d → $code"
done
```
