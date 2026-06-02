export interface SeedScript {
  id: string
  label: string
  /** Command chạy bên trong container (wrapped bởi docker exec). Default: `node dist/scripts/${id}.js` */
  command?: string
  /** Command chạy thẳng trên VPS host qua SSH — dùng khi seed không qua container backend (ví dụ: SQL pipe vào shared-mysql) */
  hostCommand?: string
}

export interface DemoCredentials {
  adminUrl: string
  username: string
  password: string
  note?: string
}

export interface ProjectConfig {
  id: string
  name: string
  repo: string
  branch: string
  domain: string
  domains: string[]           // all domains for this project
  stack: string[]
  description: string
  longDescription: string     // for showcase page
  color: string               // hex color for card accent
  icon: string                // emoji icon
  containers: string[]
  deployWorkflow: string
  backupWorkflow?: string     // 'backup.yml' nếu có
  backupDatabase?: string     // tên DB cần backup
  logContainers: string[]     // containers để xem logs
  logFile?: string            // đường dẫn log file trong container
  seedScripts: SeedScript[]
  containerForSeed?: string
  demoCredentials?: DemoCredentials
}

export const PROJECTS: ProjectConfig[] = [
  {
    id: 'vietnet2026',
    name: 'VietNet Interior 2026',
    repo: 'VietNet2026',
    branch: 'main',
    domain: 'bhquan.store',
    domains: ['bhquan.store', 'www.bhquan.store'],
    stack: ['Next.js 15', 'NestJS 10', 'MySQL 8', 'Redis 7', 'BullMQ'],
    description: 'Website nội thất cao cấp với CMS và Page Builder',
    longDescription: 'Website giới thiệu và bán sản phẩm nội thất cao cấp. Tích hợp CMS với Page Builder cho admin, SSR hoàn toàn cho SEO, quản lý sản phẩm, dự án và bài viết.',
    color: '#6366f1',
    icon: '🏠',
    containers: ['vietnet-frontend', 'vietnet-api'],
    deployWorkflow: 'deploy.yml',
    seedScripts: [
      { id: 'seed-admin', label: 'Admin user (admin@vietnet.local)' },
      { id: 'seed-data', label: 'Categories + Projects + Articles + Settings' },
      { id: 'seed-products-20', label: '20 Products với 10 ảnh mỗi sản phẩm' },
      { id: 'seed-demo-data', label: 'Full demo content (35 categories, 20 projects, 23 articles)' },
    ],
    backupWorkflow: 'backup.yml',
    backupDatabase: 'vietnet',
    logContainers: ['vietnet-api', 'vietnet-frontend'],
    logFile: '/app/logs/error.log',
    containerForSeed: 'vietnet-api',
    demoCredentials: {
      adminUrl: 'https://bhquan.store/admin',
      username: 'admin@vietnet.local',
      password: 'Admin@123',
      note: 'Super admin account',
    },
  },
  {
    id: 'fashionecom',
    name: 'FashionEcom',
    repo: 'FashionEcom',
    branch: 'master',
    domain: 'shop.bhquan.store',
    domains: ['shop.bhquan.store'],
    stack: ['Next.js 14', 'NestJS 10', 'MySQL 8', 'Redis 7'],
    description: 'E-commerce thời trang online với đầy đủ tính năng mua sắm',
    longDescription: 'Nền tảng thương mại điện tử thời trang. Giao diện lấy cảm hứng từ Torano.vn và Aristino.com. Tích hợp thanh toán, giỏ hàng, quản lý đơn hàng và CMS sản phẩm.',
    color: '#ec4899',
    icon: '👗',
    containers: ['fashionecom-frontend', 'fashionecom-api'],
    deployWorkflow: 'deploy.yml',
    backupWorkflow: 'backup.yml',
    backupDatabase: 'fashionecom',
    logContainers: ['fashionecom-api', 'fashionecom-frontend'],
    logFile: '/app/logs/error.log',
    seedScripts: [
      {
        id: 'seed-dev-data',
        label: 'Dev data (admin + categories + products)',
        hostCommand: [
          `DB_PASS=$(grep '^DB_PASSWORD=' /opt/fashionecom/.env | cut -d= -f2-)`,
          `DB_USER=$(grep '^DB_USERNAME=' /opt/fashionecom/.env | cut -d= -f2-)`,
          `DB_NAME=$(grep '^DB_NAME=' /opt/fashionecom/.env | cut -d= -f2-)`,
          `cat /opt/fashionecom/db/seed/seed_dev_data.sql | docker exec -i shared-mysql mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME"`,
        ].join(' && '),
      },
    ],
    demoCredentials: {
      adminUrl: 'https://shop.bhquan.store/admin',
      username: 'admin@fashionecom.local',
      password: 'Admin@123',
    },
  },
  {
    id: 'lequydon',
    name: 'Trường Lê Quý Đôn',
    repo: 'LeQuyDon',
    branch: 'main',
    domain: 'lqd.bhquan.store',
    domains: ['lqd.bhquan.store'],
    stack: ['Next.js 14', 'NestJS 10', 'MySQL 8', 'Redis 7'],
    description: 'Website trường tiểu học Lê Quý Đôn — CMS giáo dục',
    longDescription: 'Hệ thống CMS cho trường Tiểu học Lê Quý Đôn, Hà Nội. Quản lý tin tức, sự kiện, tuyển sinh, và thông tin nhà trường. 22 trang public + 19 trang admin.',
    color: '#14b8a6',
    icon: '🏫',
    containers: ['lqd-frontend', 'lqd-api'],
    deployWorkflow: 'deploy.yml',
    backupWorkflow: 'backup.yml',
    backupDatabase: 'lequydon',
    logContainers: ['lqd-api', 'lqd-frontend'],
    logFile: '/app/logs/error.log',
    containerForSeed: 'lqd-api',
    seedScripts: [
      { id: 'admin-seed',                  label: 'Admin user',                                       command: 'node dist/database/seeds/admin-seed.js' },
      { id: 'content-seed',                label: 'Trang + nội dung cơ bản',                          command: 'node dist/database/seeds/content-seed.js' },
      { id: 'seed-categories-articles',    label: 'Danh mục + bài viết',                              command: 'node dist/database/seeds/seed-categories-articles.js' },
      { id: 'seed-admissions',             label: 'Tuyển sinh',                                       command: 'node dist/database/seeds/seed-admissions.js' },
      { id: 'seed-events',                 label: 'Sự kiện',                                          command: 'node dist/database/seeds/seed-events.js' },
      { id: 'seed-contacts-settings-nav',  label: 'Liên hệ + cài đặt + nav',                         command: 'node dist/database/seeds/seed-contacts-settings-nav.js' },
      { id: 'seed-media',                  label: 'Media',                                            command: 'node dist/database/seeds/seed-media.js' },
      { id: 'seed-pages-part1',            label: 'Trang tĩnh (part 1/3)',                            command: 'node dist/database/seeds/seed-pages-part1.js' },
      { id: 'seed-pages-part2',            label: 'Trang tĩnh (part 2/3)',                            command: 'node dist/database/seeds/seed-pages-part2.js' },
      { id: 'seed-pages-part3',            label: 'Trang tĩnh (part 3/3)',                            command: 'node dist/database/seeds/seed-pages-part3.js' },
    ],
    demoCredentials: {
      adminUrl: 'https://lqd.bhquan.store/admin',
      username: 'admin@lequydon.local',
      password: 'Admin@123',
    },
  },
  {
    id: 'geotracker',
    name: 'GEO Tracker',
    repo: 'geo-tracker',
    branch: 'master',
    domain: 'photostorage.cloud',
    domains: ['photostorage.cloud', 'www.photostorage.cloud', 't.photostorage.cloud', 'admin.photostorage.cloud', 'analytics.photostorage.cloud'],
    stack: ['Next.js 15', 'Fastify 4', 'MySQL 8', 'Prisma 5', 'Plausible'],
    description: 'Affiliate link tracker với analytics tích hợp Plausible',
    longDescription: 'Hệ thống theo dõi affiliate marketing với click tracking, postback conversion, dashboard analytics, và Plausible Analytics tích hợp. Multi-workspace với JWT auth.',
    color: '#f59e0b',
    icon: '📊',
    containers: ['tracker-api', 'tracker-dashboard', 'tracker-plausible'],
    deployWorkflow: 'deploy.yml',
    logContainers: ['tracker-api', 'tracker-dashboard'],
    logFile: '/app/logs/error.log',
    seedScripts: [],
    demoCredentials: {
      adminUrl: 'https://photostorage.cloud',
      username: '(xem .env ADMIN_EMAIL)',
      password: '(xem .env ADMIN_PASSWORD)',
      note: 'Auto-created khi API start lần đầu',
    },
  },
  {
    id: 'webtemplate',
    name: 'WebTemplate',
    repo: 'WebTemplate',
    branch: 'main',
    domain: 'template.bhquan.store',
    domains: ['template.bhquan.store'],
    stack: ['Next.js 14', 'NestJS 10', 'MySQL 8', 'Redis 7'],
    description: 'Template website đa năng cho doanh nghiệp vừa và nhỏ',
    longDescription: 'Template website chuẩn cho các doanh nghiệp vừa và nhỏ. Bao gồm landing page, blog, trang giới thiệu, liên hệ và panel quản trị nội dung.',
    color: '#8b5cf6',
    icon: '🌐',
    containers: ['wt-frontend', 'wt-backend'],
    deployWorkflow: 'deploy.yml',
    backupWorkflow: 'backup.yml',
    backupDatabase: 'webtemplate',
    logContainers: ['wt-backend', 'wt-frontend'],
    logFile: '/app/logs/error.log',
    seedScripts: [],
    demoCredentials: {
      adminUrl: 'https://template.bhquan.store/admin',
      username: 'admin@template.local',
      password: 'Admin@123',
    },
  },
  {
    id: 'webphoto',
    name: 'PhotoStorage',
    repo: 'webphoto',
    branch: 'main',
    domain: 'photo.bhquan.store',
    domains: ['photo.bhquan.store'],
    stack: ['Vue 3', 'Express.js 5', 'MySQL 8', 'Redis 7', 'BullMQ', 'Cloudflare R2'],
    description: 'Nền tảng lưu trữ và chia sẻ ảnh với payment gateway',
    longDescription: 'Dịch vụ lưu trữ ảnh online với subscription plans, xử lý ảnh async (BullMQ), chia sẻ album, payment thủ công qua chuyển khoản và admin approval.',
    color: '#06b6d4',
    icon: '📷',
    containers: ['photo-api', 'photo-worker'],
    deployWorkflow: 'deploy.yml',
    backupWorkflow: 'backup.yml',
    backupDatabase: 'photo_storage',
    logContainers: ['photo-api', 'photo-worker'],
    logFile: '/app/logs/error.log',
    containerForSeed: 'photo-api',
    seedScripts: [
      { id: 'seed', label: 'Plans + system settings + admin user', command: 'node dist/database/seed.js' },
    ],
    demoCredentials: {
      adminUrl: 'https://photo.bhquan.store',
      username: 'admin@photostorage.com',
      password: 'admin123',
      note: 'Default admin account',
    },
  },
]

export function getProjectById(id: string): ProjectConfig | undefined {
  return PROJECTS.find(p => p.id === id)
}

export function getProjectByRepo(repo: string): ProjectConfig | undefined {
  return PROJECTS.find(p => p.repo === repo)
}
