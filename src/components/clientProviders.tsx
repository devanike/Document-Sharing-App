"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { IdleTimeout } from "./idleTimeout"

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    // get initial session
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    // subscribe to changes
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <>
      {session && <IdleTimeout timeoutMs={1000 * 60 * 15} />}
      {children}
    </>
  )
}
