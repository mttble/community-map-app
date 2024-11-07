import '@/styles/globals.css'
import 'leaflet/dist/leaflet.css'
import type { AppProps } from 'next/app'
import type { NextPage } from 'next'
import type { ReactElement } from 'react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { useState } from 'react'

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactElement
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const [supabaseClient] = useState(() => createPagesBrowserClient())

  const getLayout = Component.getLayout || ((page) => page)

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={pageProps.initialSession}
    >
      {getLayout(<Component {...pageProps} />)}
    </SessionContextProvider>
  )
}