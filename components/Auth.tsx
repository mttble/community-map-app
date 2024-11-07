import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabase-client'

export default function AuthComponent() {
  const handleAnonymousSignIn = async () => {
    try {
      // Try simple anonymous sign in first
      const { data, error } = await supabase.auth.signInAnonymously()
      
      if (error) {
        console.error('Anonymous sign in error:', error.message)
        return
      }
      
      console.log('Successfully signed in anonymously:', data)
      
      // Optional: redirect after successful sign in
      window.location.href = '/'
      
    } catch (error) {
      console.error('Error in anonymous sign in:', error)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={[]}
        magicLink={true}
        redirectTo={`${window.location.origin}/auth/callback`}
      />
      <div className="mt-4">
        <button
          onClick={handleAnonymousSignIn}
          className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  )
} 