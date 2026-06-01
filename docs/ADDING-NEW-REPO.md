# Thêm Repo Mới lên VPS

> Checklist đầy đủ khi onboard 1 project mới lên shared VPS 159.223.77.247

---

## 1. Chuẩn bị codebase

### 1.1 Chọn port (tránh conflict)

| Project | FE | BE | MySQL | Redis |
|---------|----|----|-------|-------|
| VietNet2026 | 5100 | 5102 | shared | shared |
| LeQuyDon | 5200 | 5202 | shared | shared |
| FashionEcom | 5300 | 5302 | shared | shared |
| GEO Tracker | 5500 | 5501 | shared | shared |
| WebTemplate | 6000 | 6001 | shared | shared |
| WebPhoto | — | 7100 | shared | shared |
| DeployDashboard | — | 7000 | — | — |
| **Project mới** | **5400** | **5402** | shared | shared |

> Rule: cộng 100 cho mỗi project mới. FE = x00, BE = x02, dev MySQL = x09, dev Redis = x82.

### 1.2 Cấu trúc Docker bắt buộc

```yaml
# docker-compose.prod.yml
services:
  frontend:
    container_name: {project}-frontend
    networks:
      - {project}-net
      - webphoto_backend   # BẮT BUỘC — shared nginx dùng mạng này
    environment:
      HOSTNAME: "0.0.0.0"  # BẮT BUỘC nếu Next.js standalone — tránh 502

  backend:
    container_name: {project}-api
    networks:
      - {project}-net
      - webphoto_backend   # BẮT BUỘC

networks:
  {project}-net:
  webphoto_backend:
    name: webphoto_backend
    external: true
```

> **Lý do `HOSTNAME: "0.0.0.0"`**: Next.js standalone bind theo Docker `HOSTNAME` env (= container ID). Nếu không set, app chỉ bind vào IP của network đầu tiên → nginx 502 sau khi connect thêm `webphoto_backend`.

---

## 2. Nginx config

Tạo file `infra/nginx/conf.d/{domain}.conf`:

```nginx
resolver 127.0.0.11 valid=30s ipv6=off;  # Docker DNS — LUÔN dùng

server {
    listen 80;
    server_name {domain};
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl;
    http2 on;
    server_name {domain};

    ssl_certificate     /etc/letsencrypt/live/{domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/{domain}/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    # Docker DNS resolver + biến — tránh nginx crash khi container chưa up
    set $fe http://{project}-frontend:3000;
    set $be http://{project}-api:4000;

    location /api/ { proxy_pass $be; proxy_http_version 1.1; ... }
    location / { proxy_pass $fe; proxy_http_version 1.1; ... }
}
```

> **Tại sao dùng `set $upstream` thay vì `proxy_pass http://container:port` trực tiếp?**
> Nginx resolve hostname lúc start. Nếu container chưa chạy → nginx crash, kéo theo shared-nginx down → tất cả projects mất. `set $var` + `resolver 127.0.0.11` → resolve lúc request → 502 thay vì crash.

---

## 3. GitHub Actions workflow

### 3.1 Template deploy.yml

Copy từ project tương tự (VietNet2026 hoặc FashionEcom) và thay:
- `APP_DIR=/opt/{project}`
- Container names
- `INFRA_DIR=/opt/infra`
- Domain trong certbot step

### 3.2 Secrets cần set (dùng lệnh này)

```bash
REPO="BHQUAN97/{new-repo}"
gh secret set VPS_HOST     --body "159.223.77.247" --repo $REPO
gh secret set VPS_PORT     --body "22"             --repo $REPO
gh secret set VPS_USER     --body "root"           --repo $REPO
gh secret set VPS_PASSWORD --body "12345678@AbcBHQuan" --repo $REPO
# Thêm secrets riêng của project (DB pass, API keys...)
```

### 3.3 Pattern tránh lỗi thường gặp

```yaml
# ❌ SAI — grep với pipe fail trên GitHub Actions (set -eo pipefail)
grep -v '^#' config/env >> $GITHUB_ENV

# ✓ ĐÚNG
while IFS= read -r line; do
  [[ "$line" == \#* ]] && continue
  [[ -z "$line" ]] && continue
  echo "$line" >> $GITHUB_ENV
done < config/env
```

---

## 4. Lần đầu deploy — thứ tự thực hiện

```bash
# 1. Đảm bảo DNS đã trỏ về 159.223.77.247
dig +short {domain}

# 2. Trigger deploy (hoặc push code)
gh workflow run deploy.yml --repo BHQUAN97/{repo} --ref main

# 3. Sau khi containers up, cấp SSL cert
ssh root@159.223.77.247
docker exec infra-certbot certbot certonly --webroot -w /var/www/certbot \
  -d {domain} --email buihongquan28041997@gmail.com --agree-tos --non-interactive
docker exec shared-nginx nginx -s reload

# 4. Fix networks nếu 502
docker network connect webphoto_backend {project}-frontend
docker network connect webphoto_backend {project}-api
docker exec shared-nginx nginx -s reload
```

---

## 5. Cập nhật Deploy Dashboard

Sau khi thêm project mới, cập nhật:

**`E:\DEVELOP\deploy-dashboard\src\config\projects.ts`** — thêm entry:
```typescript
{
  id: '{id}',
  name: '{Tên hiển thị}',
  repo: '{repo-name}',
  branch: 'main',
  domain: '{domain}',
  domains: ['{domain}'],
  stack: ['Next.js', 'NestJS', 'MySQL'],
  description: '...',
  longDescription: '...',
  color: '#hex',
  icon: '🎯',
  containers: ['{project}-frontend', '{project}-api'],
  deployWorkflow: 'deploy.yml',
  seedScripts: [],
  demoCredentials: {
    adminUrl: 'https://{domain}/admin',
    username: 'admin@...',
    password: '...',
  },
}
```

**`src/config/vps-domains.ts`** — thêm vào `VPS_DOMAINS` và `NETWORK_CONTAINERS`.

---

## 6. Blast radius check

Trước khi deploy project mới, verify:
- Port không trùng với project khác
- Container name không trùng (dùng prefix `{project}-`)
- Không upload `infra/docker-compose.yml` lên `/opt/infra/` (overwrite shared infra)
- Nginx conf không dùng `proxy_pass` trực tiếp (dùng `set $var` pattern)
