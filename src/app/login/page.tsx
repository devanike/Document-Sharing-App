"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { supabase } from "@/lib/supabase"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import ReCAPTCHA from "react-google-recaptcha"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [studentForm, setStudentForm] = useState({
    email: "",
    password: "",
  })
  const [adminForm, setAdminForm] = useState({
    email: "",
    password: "",
  })
  const [activeTab, setActiveTab] = useState("student")
  const router = useRouter()

  // Separate refs for each tab's reCAPTCHA
  const studentRecaptchaRef = useRef<ReCAPTCHA>(null)
  const adminRecaptchaRef = useRef<ReCAPTCHA>(null)

  // Clear forms when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setError("")
    // Clear both forms when switching tabs
    setStudentForm({ email: "", password: "" })
    setAdminForm({ email: "", password: "" })
    // Reset reCAPTCHA
    studentRecaptchaRef.current?.reset()
    adminRecaptchaRef.current?.reset()
  }

  // Function to verify reCAPTCHA on the server
  const verifyRecaptcha = useCallback(async (token: string) => {
    try {
      const response = await fetch("/api/verify-recaptcha", { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || "reCAPTCHA verification failed.")
      }
      return true
    } catch (err: any) {
      console.error("reCAPTCHA verification error:", err)
      throw new Error(err.message || "reCAPTCHA verification failed. Please try again.")
    }
  }, [])

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Get reCAPTCHA token
      const recaptchaToken = studentRecaptchaRef.current?.getValue()

      if (!recaptchaToken) {
        throw new Error("reCAPTCHA not loaded. Please refresh the page.")
      }

      await verifyRecaptcha(recaptchaToken) 

      const { data, error } = await supabase.auth.signInWithPassword({
        email: studentForm.email,
        password: studentForm.password,
      })

      if (error) throw error

      // Check if user is a student
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single()

      if (profile?.role !== "student") {
        throw new Error("Invalid credentials for student login")
      }

      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message)
      // Reset reCAPTCHA on error
      studentRecaptchaRef.current?.reset()
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Get reCAPTCHA token
      const recaptchaToken = adminRecaptchaRef.current?.getValue()
      
      if (!recaptchaToken) {
        throw new Error("Please complete the reCAPTCHA verification.")
      }

      await verifyRecaptcha(recaptchaToken)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminForm.email,
        password: adminForm.password,
      })

      if (error) throw error

      // Check if user is admin
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single()

      if (!profile || profile.role !== "admin") {
        throw new Error("Invalid credentials for admin/lecturer login")
      }

      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message)
      // Reset reCAPTCHA on error
      adminRecaptchaRef.current?.reset()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-900">Welcome Back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="student" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-transparent  rounded-none p-0 mb-4">
              <TabsTrigger 
                value="student"
                className="text-sm font-semibold rounded-none transition-all data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-b-blue-600 hover:bg-blue-50 hover:text-blue-600 text-gray-600 h-12 border-b-2 border-transparent"
              >
                Student
              </TabsTrigger>
              <TabsTrigger 
                value="admin"
                className="text-sm font-semibold rounded-none transition-all data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-b-blue-600 hover:bg-blue-50 hover:text-blue-600 text-gray-600 h-12 border-b-2 border-transparent"
              >
                Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="student">
              <form onSubmit={handleStudentLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student-email">Email</Label>
                  <Input
                    id="student-email"
                    type="email"
                    placeholder="your.email@student.edu"
                    value={studentForm.email}
                    autoComplete="off"
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="student-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={studentForm.password}
                      autoComplete="off"
                      onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* reCAPTCHA v2 for student login */}
                <div className="flex justify-center">
                  <ReCAPTCHA
                    ref={studentRecaptchaRef}
                    sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                    onChange={() => setError("")} 
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" /> : "Sign In as Student"}
                </Button>

                <div className="text-center space-y-2">
                  <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                    Forgot your password?
                  </Link>
                  <div className="text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-blue-600 hover:underline">
                      Sign up
                    </Link>
                  </div>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="admin">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@cs.edu"
                    value={adminForm.email}
                    autoComplete="off"
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter admin password"
                      value={adminForm.password}
                      autoComplete="off"
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                 {/* reCAPTCHA v2 for admin login */}
                <div className="flex justify-center">
                  <ReCAPTCHA
                    ref={adminRecaptchaRef}
                    sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                    onChange={() => setError("")} // Clear error when reCAPTCHA is completed
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" /> : "Sign In as Admin"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}


