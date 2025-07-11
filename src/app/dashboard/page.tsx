"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { DocumentCard } from "@/components/document-card"
import { supabase } from "@/lib/supabase"
import type { User, Document } from "@/lib/types"
import { FileText, Upload, Settings, AlertCircle, CheckCircle } from "lucide-react"

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [success, setSuccess] = useState("")
  const [profileForm, setProfileForm] = useState({
    name: "",
    level: "",
  })
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (profile) {
        setUser(profile)
        setProfileForm({
          name: profile.name,
          level: profile.level || "",
        })
        await fetchUserDocuments(profile.id)
      } else {
        router.push("/login")
      }
    } catch (error) {
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  async function fetchUserDocuments(userId: string) {
    try {

      const { data: simpleData, error: simpleError } = await supabase
        .from("documents")
        .select("*")
        .eq("uploader_id", userId)

      console.log("Simple document query result:", simpleData) 
      console.log("Simple document query error:", simpleError) 

      if (simpleError) {
        console.error("Simple query error:", simpleError)
        setError(`Database error: ${simpleError.message}`)
        return
      }

      // profiles!documents_uploader_id_fkey(name, role)
      const { data, error } = await supabase
        .from("documents")
        .select(`
          *,
          profiles(
            name,
            role
          ) 
        `)
        .eq("uploader_id", userId)
        .order("created_at", { ascending: false })

    if (error) {
        console.error("Complex query error:", error)

        setDocuments(simpleData || [])
        setError(`Join query failed: ${error.message}. Using simple query.`)
      } else {
        setDocuments(data || [])
      }

      // Additional debugging - check if documents table exists and has data
      const { data: allDocs, error: allDocsError } = await supabase
        .from("documents")
        .select("id, uploader_id, file_name")
        .limit(5)

      console.log("Sample documents in table:", allDocs) // Debug log
      console.log("All docs query error:", allDocsError) // Debug log

    } catch (error: any) {
      console.error("fetchUserDocuments error:", error)
      setError(`Failed to fetch documents: ${error.message}`)
    }
  }

  async function updateProfile() {
    if (!user) return

    setUpdating(true)
    setError("")
    setSuccess("")

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: profileForm.name,
          level: profileForm.level,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      setUser({ ...user, name: profileForm.name, level: profileForm.level })
      setSuccess("Profile updated successfully!")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setUpdating(false)
    }
  }

  async function handleDownload(doc: Document) {
    try {
      const { data, error } = await supabase.storage.from("documents").download(doc.storage_path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = doc.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      setError("Failed to download file")
    }
  }

  async function handleDelete(documentId: string) {
    try {
      const { error } = await supabase.from("documents").delete().eq("id", documentId)

      if (error) throw error

      setDocuments(documents.filter((doc) => doc.id !== documentId))
      setSuccess("Document deleted successfully!")
    } catch (error: any) {
      setError(error.message)
    }
  }

  async function refreshDocuments() {
    if (!user) return

    setRefreshing(true)
    setError("")
    setSuccess("")

    try {
      await fetchUserDocuments(user.id)
      console.log("Refresh successful")
      setSuccess("Documents refreshed!")
    } catch {
      setError("Failed to refresh documents")
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.name}!</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={refreshDocuments}
            disabled={refreshing}
          >
            {refreshing
              ? <LoadingSpinner size="sm" />
              : "Refresh"}
          </Button>

          {/* {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>} */}
          <Button asChild>
            <a href="/upload">
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Public Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.filter((doc) => doc.is_public).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Private Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.filter((doc) => !doc.is_public).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Account Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{user.role}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">My Documents</TabsTrigger>
          <TabsTrigger value="profile">Profile Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Documents</h2>
          </div>

          {documents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
                <p className="text-gray-600 mb-4">Start sharing your academic resources with the community.</p>
                <Button asChild>
                  <a href="/upload">Upload Your First Document</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {documents.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  canDelete={true}
                  onDelete={handleDelete}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Profile Settings
              </CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>

              {user.role === "student" && (
                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <Select
                    value={profileForm.level}
                    onValueChange={(value) => setProfileForm({ ...profileForm, level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100 Level</SelectItem>
                      <SelectItem value="200">200 Level</SelectItem>
                      <SelectItem value="300">300 Level</SelectItem>
                      <SelectItem value="400">400 Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-500">Role cannot be changed</p>
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

              <Button onClick={updateProfile} disabled={updating}>
                {updating ? <LoadingSpinner size="sm" /> : "Update Profile"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
