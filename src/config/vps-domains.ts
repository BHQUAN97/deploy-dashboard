export interface CertDomain {
  domain: string        // cert name (primary domain)
  sans: string[]        // all SANs including primary
  projectId: string     // which project owns this cert
}

export const VPS_DOMAINS: CertDomain[] = [
  {
    domain: 'bhquan.store',
    sans: ['bhquan.store', 'www.bhquan.store'],
    projectId: 'vietnet2026',
  },
  {
    domain: 'shop.bhquan.store',
    sans: ['shop.bhquan.store'],
    projectId: 'fashionecom',
  },
  {
    domain: 'lqd.bhquan.store',
    sans: ['lqd.bhquan.store'],
    projectId: 'lequydon',
  },
  {
    domain: 'photostorage.cloud',
    sans: ['photostorage.cloud', 'www.photostorage.cloud', 't.photostorage.cloud', 'admin.photostorage.cloud', 'analytics.photostorage.cloud'],
    projectId: 'geotracker',
  },
  {
    domain: 'photo.bhquan.store',
    sans: ['photo.bhquan.store'],
    projectId: 'webphoto',
  },
  {
    domain: 'template.bhquan.store',
    sans: ['template.bhquan.store'],
    projectId: 'webtemplate',
  },
]

// Certbot shared container name trên VPS
export const CERTBOT_CONTAINER = 'infra-certbot'
export const NGINX_CONTAINER = 'shared-nginx'
export const CERTBOT_WEBROOT = '/var/www/certbot'
export const NETWORKS_TO_FIX = 'webphoto_backend'

// Containers cần connect vào webphoto_backend khi fix networks
export const NETWORK_CONTAINERS = [
  'vietnet-frontend', 'vietnet-api',
  'fashionecom-frontend', 'fashionecom-api',
  'lqd-frontend', 'lqd-api',
  'wt-frontend', 'wt-backend',
  'photo-api', 'photo-worker',
]
