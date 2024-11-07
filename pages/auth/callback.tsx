import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createPagesBrowserClient()

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        await supabase.auth.getSession()
        router.push('/')
      } catch (error) {
        console.error('Error in auth callback:', error)
        router.push('/auth/signin')
      }
    }

    handleRedirect()
  }, [router, supabase.auth])

  return null
} 