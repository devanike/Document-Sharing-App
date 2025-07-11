"use client"

import { useEffect, useState } from "react"
import { Logo } from "./ui/logo"

export function LoadingScreen() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        <Logo size="lg" />
        <div className="mt-4 animate-pulse">
          <div className="w-32 h-1 bg-blue-200 rounded-full overflow-hidden">
            <div className="w-full h-full bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="mt-2 text-blue-600 font-medium">Loading CS DocShare...</p>
      </div>
    </div>
  )
}
