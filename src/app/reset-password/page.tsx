"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { resetPassword } from "@/lib/auth"
import { validatePassword } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock } from "lucide-react"

function ResetPasswordContent() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isValidSession, setIsValidSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const router = useRouter()
  const searchParams = useSearchParams()

  const addDebug = (message: string) => {
    console.log(message)
    setDebugInfo((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        addDebug("Starting auth callback...")

        // Function to get URL parameters from both hash and search params
        const getUrlParam = (key: string): string | null => {
          // First try search params
          const searchParam = searchParams.get(key)
          if (searchParam) return searchParam

          // Then try hash params
          const hash = window.location.hash.substring(1)
          const hashParams = new URLSearchParams(hash)
          return hashParams.get(key)
        }

        // Check for error parameters first
        const errorParam = getUrlParam("error")
        const errorCode = getUrlParam("error_code")
        const errorDescription = getUrlParam("error_description")

        if (errorParam) {
          addDebug(`URL contains error: ${errorParam}`)
          if (errorCode === "otp_expired") {
            setError("This password reset link has expired. Please request a new one.")
          } else if (errorParam === "access_denied") {
            setError("Invalid or expired reset link. Please request a new password reset.")
          } else {
            setError(`Reset link error: ${errorDescription || errorParam}`)
          }
          setCheckingSession(false)
          return
        }

        // Get URL parameters for valid tokens
        const accessToken = getUrlParam("access_token")
        const refreshToken = getUrlParam("refresh_token")
        const type = getUrlParam("type")

        addDebug(`Found tokens - Access: ${!!accessToken}, Refresh: ${!!refreshToken}, Type: ${type}`)

        // If we have tokens in URL, try alternative approach
        if (accessToken && refreshToken && type === "recovery") {
          addDebug("Using alternative session approach...")

          try {
            // Method 1: Try with timeout
            addDebug("Attempting setSession with 5-second timeout...")

            const sessionPromise = supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error("Session timeout")), 5000)
            })

            const result = (await Promise.race([sessionPromise, timeoutPromise])) as any

            if (result.error) {
              throw result.error
            }

            if (result.data?.session) {
              addDebug(`Session set successfully for user: ${result.data.session.user.id}`)
              setIsValidSession(true)
              setCheckingSession(false)

              // Clean up URL to remove tokens
              const cleanUrl = window.location.pathname
              window.history.replaceState({}, document.title, cleanUrl)
              return
            } else {
              throw new Error("No session returned")
            }
          } catch (sessionError: any) {
            addDebug(`setSession failed: ${sessionError.message}`)

            // Method 2: Try manual token validation
            addDebug("Trying manual token validation...")

            try {
              // Validate the access token by making a simple API call
              const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                },
              })

              if (response.ok) {
                const userData = await response.json()
                addDebug(`Token validation successful for user: ${userData.id}`)

                // Manually create a session-like state
                setIsValidSession(true)
                setCheckingSession(false)

                // Store tokens for later use
                sessionStorage.setItem("reset_access_token", accessToken)
                sessionStorage.setItem("reset_refresh_token", refreshToken)

                // Clean up URL
                const cleanUrl = window.location.pathname
                window.history.replaceState({}, document.title, cleanUrl)
                return
              } else {
                throw new Error(`Token validation failed: ${response.status}`)
              }
            } catch (validationError: any) {
              addDebug(`Token validation failed: ${validationError.message}`)

              // Method 3: Check if tokens look valid (basic format check)
              if (accessToken.startsWith("eyJ") && refreshToken.length > 20) {
                addDebug("Tokens appear valid, proceeding with caution...")
                setIsValidSession(true)
                setCheckingSession(false)

                // Store tokens for password reset
                sessionStorage.setItem("reset_access_token", accessToken)
                sessionStorage.setItem("reset_refresh_token", refreshToken)

                // Clean up URL
                const cleanUrl = window.location.pathname
                window.history.replaceState({}, document.title, cleanUrl)
                return
              } else {
                throw new Error("Invalid token format")
              }
            }
          }
        }

        // If no tokens in URL, check for existing session or stored tokens
        addDebug("Checking for existing session or stored tokens...")

        // Check for stored tokens from previous attempt
        const storedAccessToken = sessionStorage.getItem("reset_access_token")
        const storedRefreshToken = sessionStorage.getItem("reset_refresh_token")

        if (storedAccessToken && storedRefreshToken) {
          addDebug("Found stored tokens, using them...")
          setIsValidSession(true)
          setCheckingSession(false)
          return
        }

        // Check for existing session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          addDebug(`Session check error: ${sessionError.message}`)
          setError("Authentication error. Please request a new password reset.")
          setCheckingSession(false)
          return
        }

        if (!session) {
          addDebug("No existing session found")
          setError("No valid session found. Please request a new password reset.")
          setCheckingSession(false)
          return
        }

        addDebug(`Found existing session for user: ${session.user.id}`)
        setIsValidSession(true)
        setCheckingSession(false)
      } catch (err: any) {
        addDebug(`Auth callback failed: ${err.message}`)
        console.error("Reset session check failed:", err)
        setError("Something went wrong. Please try again.")
        setCheckingSession(false)
      }
    }

    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (checkingSession) {
        addDebug("Auth callback timed out after 8 seconds")
        setError("Authentication check timed out. Please try again.")
        setCheckingSession(false)
      }
    }, 8000)

    handleAuthCallback().finally(() => {
      clearTimeout(timeout)
    })

    return () => clearTimeout(timeout)
  }, [searchParams, checkingSession])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters")
      setLoading(false)
      return
    }

    try {
      // Check if we have stored tokens to use
      const storedAccessToken = sessionStorage.getItem("reset_access_token")

      if (storedAccessToken) {
        // Use direct API call for password reset
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${storedAccessToken}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: password,
          }),
        })

        if (!response.ok) {
          throw new Error(`Password update failed: ${response.status}`)
        }

        // Clear stored tokens
        sessionStorage.removeItem("reset_access_token")
        sessionStorage.removeItem("reset_refresh_token")

        setSuccess("Password updated successfully! Redirecting to login...")

        // Redirect to login after success
        setTimeout(() => {
          router.push("/login?message=Password updated successfully")
        }, 2000)
      } else {
        // Use the normal auth function
        await resetPassword(password)
        setSuccess("Password updated successfully! Redirecting to login...")

        // Sign out the user after password reset
        await supabase.auth.signOut()

        // Redirect to login after success
        setTimeout(() => {
          router.push("/login?message=Password updated successfully")
        }, 2000)
      }
    } catch (error: any) {
      console.error("Password reset error:", error)
      if (error.message.includes("expired") || error.message.includes("invalid")) {
        setError("Your session has expired. Please request a new password reset.")
      } else {
        setError(error.message || "Failed to update password. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-600">Verifying reset link...</p>
            <p className="text-xs text-gray-500">This may take a few seconds</p>

            {/* Debug information */}
            {debugInfo.length > 0 && (
              <div className="w-full mt-4">
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                    Show debug info ({debugInfo.length} entries)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded max-h-40 overflow-y-auto">
                    {debugInfo.map((info, index) => (
                      <div key={index} className="font-mono text-xs text-gray-600">
                        {info}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}

            {/* Emergency bypass button after showing for a bit */}
            {debugInfo.length > 2 && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setError("Authentication check failed. Please request a new password reset.")
                    setCheckingSession(false)
                  }}
                >
                  Skip Verification (if stuck)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-900">Reset Link Issue</CardTitle>
            <CardDescription>There's a problem with your password reset link.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            {/* Show debug info on error */}
            {debugInfo.length > 0 && (
              <div className="w-full">
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Show technical details</summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded max-h-40 overflow-y-auto">
                    {debugInfo.map((info, index) => (
                      <div key={index} className="font-mono text-xs text-gray-600">
                        {info}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}

            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>Common reasons:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>The link has expired (links expire after 1 hour)</li>
                <li>The link has already been used</li>
                <li>The link was copied incorrectly</li>
                <li>You're opening the link in a different browser</li>
                <li>Network connectivity issues with authentication service</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Solution:</strong> Request a new password reset link. The new link will be valid for 1 hour.
              </p>
            </div>

            <div className="text-center space-y-2">
              <Button asChild className="w-full">
                <a href="/forgot-password">Request New Reset Link</a>
              </Button>
              <Button variant="outline" asChild className="w-full bg-transparent">
                <a href="/login">Back to Login</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-blue-900">Set New Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Must be 8+ characters with uppercase, lowercase, numbers, and special characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </CardContent>
          </Card>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
