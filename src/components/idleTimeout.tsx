"use client"

import { useCallback } from "react"
import { useIdleTimer } from "react-idle-timer"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

interface Props {
  /** idle before logout, in milliseconds */
  timeoutMs?: number
}

export function IdleTimeout({ timeoutMs = 1000 * 60 * 10 }: Props) {
  const router = useRouter()

  const onIdle = useCallback(async () => {
    // sign out and redirect
    await supabase.auth.signOut()
    router.replace("/login")
  }, [router])

  useIdleTimer({
    timeout: timeoutMs,
    onIdle,
    debounce: 500,
    events: [
      "mousemove",
      "keydown",
      "mousedown",
      "touchstart",
      "scroll",
    ],
  })

  return null
}
