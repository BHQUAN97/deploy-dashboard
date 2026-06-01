# Luồng Backup Data Khách Hàng → Google Drive

> Tài liệu thiết kế hệ thống backup tự động: MySQL dumps + uploads → Google Drive shared folder.
> Áp dụng cho: tất cả projects trên VPS 159.223.77.247

---

## Tổng quan kiến trúc

```
VPS Cron (2:00 AM daily)
  │
  ├── Dump MySQL databases
  │   ├── photo_storage    → /backup/YYYY-MM-DD/photo_storage.sql.gz
  │   ├── vietnet          → /backup/YYYY-MM-DD/vietnet.sql.gz
  │   ├── fashionecom      → /backup/YYYY-MM-DD/fashionecom.sql.gz
  │   └── lequydon         → /backup/YYYY-MM-DD/lequydon.sql.gz
  │
  ├── Encrypt (GPG hoặc openssl)
  │
  └── Upload → Google Drive (rclone)
        └── My Drive/VPS-Backups/YYYY-MM-DD/
              ├── photo_storage.sql.gz.enc
              ├── vietnet.sql.gz.enc
              └── ...

GitHub Actions (cron: 0 2 * * *)
  └── Trigger backup script via SSH → notify Telegram khi xong
```

---

## Phần 1: Cài đặt rclone + Google Drive

### 1.1 Cài rclone trên VPS

```bash
ssh root@159.223.77.247
curl https://rclone.org/install.sh | sudo bash
rclone version  # verify
```

### 1.2 Cấu hình Google Drive OAuth

```bash
# Chạy trên local (cần browser)
rclone config

# Theo prompts:
# n → new remote
# Name: gdrive
# Storage: drive (Google Drive)
# client_id: (để trống → dùng shared)
# client_secret: (để trống)
# scope: drive (full access)
# root_folder_id: (để trống → root)
# service_account_file: (để trống)
# Edit advanced config: No
# Use auto config: Yes → sẽ mở browser để OAuth
# Is this OK: Yes

# Sau khi config xong, copy ~/.config/rclone/rclone.conf lên VPS
scp ~/.config/rclone/rclone.conf root@159.223.77.247:/root/.config/rclone/rclone.conf
```

### 1.3 Test kết nối

```bash
rclone ls gdrive:
rclone mkdir "gdrive:VPS-Backups"
echo "test" | rclone rcat "gdrive:VPS-Backups/test.txt"
rclone ls "gdrive:VPS-Backups"
```

---

## Phần 2: Script backup

### 2.1 Script `/opt/scripts/backup-to-gdrive.sh`

```bash
#!/bin/bash
set -euo pipefail

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/tmp/vps-backup/${DATE}"
GDRIVE_DIR="gdrive:VPS-Backups/${DATE}"
LOG_FILE="/var/log/vps-backup.log"
MYSQL_ROOT_PASS=$(docker exec shared-mysql printenv MYSQL_ROOT_PASSWORD)

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

log "=== Backup bắt đầu: ${DATE} ==="
mkdir -p "$BACKUP_DIR"

# ── 1. Dump từng database ──────────────────────────────────────
declare -A DATABASES=(
  ["vietnet"]="vietnet"
  ["fashionecom"]="fashionecom"
  ["lequydon"]="lequydon"
  ["photo_storage"]="photo_storage"
  ["tracker"]="tracker"
)

for DB_NAME in "${!DATABASES[@]}"; do
  DB_LABEL="${DATABASES[$DB_NAME]}"
  DUMP_FILE="$BACKUP_DIR/${DB_LABEL}.sql.gz"

  log "Dumping ${DB_NAME}..."
  docker exec -e MYSQL_PWD="$MYSQL_ROOT_PASS" shared-mysql \
    mysqldump -u root \
    --single-transaction --quick --lock-tables=false \
    "$DB_NAME" 2>/dev/null \
    | gzip -9 > "$DUMP_FILE"

  SIZE=$(du -sh "$DUMP_FILE" | cut -f1)
  log "  → ${DB_LABEL}.sql.gz (${SIZE})"
done

# ── 2. Encrypt mỗi file ────────────────────────────────────────
ENCRYPT_KEY="${BACKUP_ENCRYPT_KEY:-}"
if [ -n "$ENCRYPT_KEY" ]; then
  log "Encrypting files..."
  for f in "$BACKUP_DIR"/*.sql.gz; do
    openssl enc -aes-256-cbc -pbkdf2 -k "$ENCRYPT_KEY" \
      -in "$f" -out "${f}.enc" && rm "$f"
    log "  → $(basename ${f}).enc"
  done
fi

# ── 3. Upload lên Google Drive ─────────────────────────────────
log "Uploading to Google Drive: ${GDRIVE_DIR}"
rclone copy "$BACKUP_DIR" "$GDRIVE_DIR" \
  --progress --transfers=4 \
  --log-file="$LOG_FILE" --log-level=INFO

# ── 4. Giữ 30 ngày backup, xóa cũ hơn ────────────────────────
log "Cleaning backups older than 30 days on Google Drive..."
rclone delete "gdrive:VPS-Backups" \
  --min-age 30d --rmdirs 2>/dev/null || true

# ── 5. Cleanup local temp ──────────────────────────────────────
rm -rf "$BACKUP_DIR"
log "=== Backup hoàn thành ==="

# ── 6. Thông báo Telegram (optional) ──────────────────────────
if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ]; then
  TOTAL=$(rclone size "$GDRIVE_DIR" 2>/dev/null | grep "Total size" || echo "unknown")
  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d chat_id="${TELEGRAM_CHAT_ID}" \
    -d text="✅ VPS Backup ${DATE} hoàn thành%0A${TOTAL}" > /dev/null
fi
```

```bash
chmod +x /opt/scripts/backup-to-gdrive.sh
```

### 2.2 Crontab (offset để tránh conflict với projects khác)

```bash
# /etc/cron.d/vps-backup
# Chạy lúc 3:30 AM (offset khỏi VietNet 2:00, LeQuyDon 2:30)
30 3 * * * root /opt/scripts/backup-to-gdrive.sh >> /var/log/vps-backup.log 2>&1
```

---

## Phần 3: GitHub Actions workflow (trigger + monitor)

### `.github/workflows/backup.yml` (trong deploy-dashboard repo)

```yaml
name: VPS Backup

on:
  schedule:
    - cron: '0 20 * * *'  # 3:00 AM Vietnam (UTC+7 = 20:00 UTC hôm trước)
  workflow_dispatch:       # Manual trigger

jobs:
  backup:
    name: Trigger & Verify Backup
    runs-on: ubuntu-latest
    steps:
      - name: Setup SSH
        run: |
          sudo apt-get install -y -qq sshpass > /dev/null
          mkdir -p ~/.ssh
          ssh-keyscan -H ${{ secrets.VPS_HOST }} >> ~/.ssh/known_hosts 2>/dev/null
          echo "SSHPASS=${{ secrets.VPS_PASSWORD }}" >> $GITHUB_ENV

      - name: Run backup script
        run: |
          sshpass -e ssh root@${{ secrets.VPS_HOST }} \
            "BACKUP_ENCRYPT_KEY='${{ secrets.BACKUP_ENCRYPT_KEY }}' \
             TELEGRAM_BOT_TOKEN='${{ secrets.TELEGRAM_BOT_TOKEN }}' \
             TELEGRAM_CHAT_ID='${{ secrets.TELEGRAM_CHAT_ID }}' \
             /opt/scripts/backup-to-gdrive.sh"

      - name: Verify backup on Drive
        run: |
          DATE=$(date +%Y-%m-%d)
          sshpass -e ssh root@${{ secrets.VPS_HOST }} \
            "rclone ls gdrive:VPS-Backups/${DATE} | wc -l"
```

### Secrets cần thêm vào deploy-dashboard repo

```bash
REPO="BHQUAN97/deploy-dashboard"
gh secret set BACKUP_ENCRYPT_KEY  --body "your-strong-passphrase" --repo $REPO
gh secret set TELEGRAM_BOT_TOKEN  --body "bot_token_from_botfather" --repo $REPO
gh secret set TELEGRAM_CHAT_ID    --body "your_chat_id" --repo $REPO
```

---

## Phần 4: Tích hợp vào Deploy Dashboard UI

### Thêm Backup panel vào Maintenance page

Thêm entry vào `src/config/projects.ts` field `backupDatabases`:
```typescript
backupDatabases: ['vietnet', 'fashionecom', 'lequydon', 'photo_storage']
```

Thêm API route `src/app/api/vps/backup-stream/route.ts`:
```typescript
// GET SSE — trigger backup script và stream output
const cmd = `BACKUP_ENCRYPT_KEY="${process.env.BACKUP_ENCRYPT_KEY}" /opt/scripts/backup-to-gdrive.sh`
return new Response(createSshStream(cmd, 300000), { headers: SSE_HEADERS })
```

Thêm `BackupPanel` component vào `src/app/(protected)/maintenance/page.tsx`.

---

## Phần 5: Restore

```bash
# 1. Download từ Google Drive
rclone copy "gdrive:VPS-Backups/2026-06-01/vietnet.sql.gz.enc" /tmp/restore/

# 2. Decrypt
openssl enc -d -aes-256-cbc -pbkdf2 -k "YOUR_KEY" \
  -in /tmp/restore/vietnet.sql.gz.enc \
  -out /tmp/restore/vietnet.sql.gz

# 3. Restore vào MySQL
zcat /tmp/restore/vietnet.sql.gz | \
  docker exec -i -e MYSQL_PWD="$ROOT_PASS" shared-mysql \
  mysql -u root vietnet

# 4. Verify
docker exec -e MYSQL_PWD="$ROOT_PASS" shared-mysql \
  mysql -u root -e "SELECT COUNT(*) FROM vietnet.users"
```

---

## Cấu trúc Google Drive

```
My Drive/
└── VPS-Backups/
    ├── 2026-06-01/
    │   ├── vietnet.sql.gz.enc        (~15MB)
    │   ├── fashionecom.sql.gz.enc    (~8MB)
    │   ├── lequydon.sql.gz.enc       (~5MB)
    │   ├── photo_storage.sql.gz.enc  (~20MB)
    │   └── tracker.sql.gz.enc        (~3MB)
    ├── 2026-06-02/
    │   └── ...
    └── (30 ngày gần nhất — tự động xóa cũ hơn)
```

**Ước tính storage**: ~60MB/ngày × 30 ngày = ~1.8GB trên Google Drive.
Google Drive free tier: 15GB — đủ ~8 tháng backup không xóa.
