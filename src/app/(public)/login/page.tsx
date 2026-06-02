import { Suspense } from 'react'
import { LoginClient } from '@/components/auth/LoginClient'

export const metadata = { title: 'Login · DeployHub' }

export default function LoginPage() {
  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  )
}
