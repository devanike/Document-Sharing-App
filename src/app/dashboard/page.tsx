"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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

const ITEMS_PER_PAGE = 9

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [userDocuments, setUserDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [success, setSuccess] = useState("")
  const [profileForm, setProfileForm] = useState({
    name: "",
    level: "",
  })
  const [currentPage, setCurrentPage] = useState(0) 
  const [totalUserDocumentCount, setTotalUserDocumentCount] = useState(0)
  const [documentVisibilityFilter, setDocumentVisibilityFilter] = useState<"all" | "public" | "private">("all") 

  const router = useRouter()

  useEffect(() => {
    checkAuthAndFetchData()
  }, [])

  useEffect(() => {
    if (user) {
      fetchUserDocuments(user.id, currentPage, documentVisibilityFilter)
    }
  }, [user, currentPage, documentVisibilityFilter]) 

  async function checkAuthAndFetchData() {
    try {
      setLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/login")
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (profileError) {
        console.error("Error fetching profile:", profileError)
        router.push("/login")
        return
      }

      if (profile) {
        setUser(profile)
        setProfileForm({
          name: profile.name,
          level: profile.level || "",
        })
      } else {
        router.push("/login")
      }
    } catch (error) {
      console.error("Auth check or profile fetch error:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const fetchUserDocuments = useCallback(
    async (userId: string, page: number, visibilityFilter: "all" | "public" | "private") => {
      try {
        setRefreshing(true)
        setError("")

        const from = page * ITEMS_PER_PAGE
        const to = from + ITEMS_PER_PAGE - 1

        let query = supabase
          .from("documents")
          .select(
            `
            *,
            uploader:profiles(name, role) 
            `,
            { count: "exact" }, 
          )
          .eq("uploader_id", userId) 

        if (visibilityFilter === "public") {
          query = query.eq("is_public", true)
        } else if (visibilityFilter === "private") {
          query = query.eq("is_public", false)
        }

        const { data, error, count } = await query
          .order("created_at", { ascending: false }) 
          .range(from, to) 

        if (error) {
          console.error("Error fetching user documents:", error)
          setError(`Failed to fetch documents: ${error.message}`)
          setUserDocuments([]) 
          setTotalUserDocumentCount(0)
        } else {
          // Map to ensure 'uploader' is directly on the Document object for DocumentCard
          const documentsWithUploader = data.map(doc => ({
            ...doc,
            uploader: doc.uploader ? doc.uploader : { name: "Unknown", role: "unknown" } 
          })) as Document[];

          setUserDocuments(documentsWithUploader)
          setTotalUserDocumentCount(count || 0)
        }
      } catch (err: any) {
        console.error("fetchUserDocuments caught error:", err)
        setError(`An unexpected error occurred: ${err.message}`)
      } finally {
        setRefreshing(false)
      }
    },
    [], 
  )

  const updateProfile = useCallback(async () => {
    if (!user) return

    setUpdating(true)
    setError("")
    setSuccess("")

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          name: profileForm.name,
          level: profileForm.level,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (updateError) throw updateError

      // Update the local user state immediately
      setUser((prevUser) => (prevUser ? { ...prevUser, name: profileForm.name, level: profileForm.level } : null))
      setSuccess("Profile updated successfully! ✨")
    } catch (err: any) {
      console.error("Profile update error:", err)
      setError(err.message)
    } finally {
      setUpdating(false)
    }
  }, [user, profileForm.name, profileForm.level])


  const handleDownload = useCallback(async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage.from("documents").download(doc.storage_path)

      if (error) throw error

      if (typeof window !== "undefined" && data) { // Ensure window is defined for browser operations
        const url = URL.createObjectURL(data)
        const a = document.createElement("a")
        a.href = url
        a.download = doc.file_name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (!data) {
        setError("Failed to download file: No data received.")
      } else {
        console.warn("Download attempted in a non-browser environment. Skipping DOM manipulation.");
      }
    } catch (err: any) {
      console.error("Download error:", err)
      setError(`Failed to download file: ${err.message || "An unknown error occurred."}`)
    }
  }, [])

  const handleDelete = useCallback(async (documentId: string) => {
    if (!user) return

    try {
      setError("")
      setSuccess("")

      // Find the document to get its storage_path
      const docToDelete = userDocuments.find((doc) => doc.id === documentId)

      // Delete from database
      const { error: dbError } = await supabase.from("documents").delete().eq("id", documentId)
      if (dbError) throw dbError

      // Delete from storage if storage_path exists
      if (docToDelete && docToDelete.storage_path) {
        const { error: storageError } = await supabase.storage.from("documents").remove([docToDelete.storage_path])
        if (storageError) {
          console.warn("Could not delete file from storage (might already be gone or permissions issue):", storageError.message)
        }
      }

      // Re-fetch documents to update the list and correct pagination
      fetchUserDocuments(user.id, currentPage, documentVisibilityFilter)
      setSuccess("Document deleted successfully! ✅")
    } catch (err: any) {
      console.error("Delete error:", err)
      setError(err.message || "Failed to delete document.")
    }
  }, [user, userDocuments, fetchUserDocuments, currentPage, documentVisibilityFilter]) 

  const totalPages = useMemo(() => Math.ceil(totalUserDocumentCount / ITEMS_PER_PAGE), [totalUserDocumentCount]);

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
            onClick={() => {
              setCurrentPage(0); 
              fetchUserDocuments(user.id, 0, documentVisibilityFilter); 
            }}
            disabled={refreshing}
          >
            {refreshing
              ? <LoadingSpinner size="sm" />
              : "Refresh"}
          </Button>

          <Button asChild>
            <a href="/upload">
              <Upload className="w-4 h-4 md:mr-2" />
              <span className="hidden md:block">Upload Document</span>
            </a>
          </Button>
        </div>
      </div>

      {/* Centralized error and success messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="default" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Dashboard Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUserDocumentCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Public Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userDocuments.filter((doc) => doc.is_public).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Private Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userDocuments.filter((doc) => !doc.is_public).length}</div>
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
        <TabsList className="bg-gray-200">
          <TabsTrigger 
            value="documents" 
            className="text-sm font-medium rounded-md transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-blue-50 hover:text-blue-600 text-gray-600 h-10"
          >
            My Documents
          </TabsTrigger>
          <TabsTrigger 
            value="profile" 
            className="text-sm font-medium rounded-md transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-blue-50 hover:text-blue-600 text-gray-600 h-10"
          >
            Profile Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Documents</h2>
            {/* New: Public/Private Filter for My Documents */}
            <Select
              value={documentVisibilityFilter}
              onValueChange={(value: "all" | "public" | "private") => {
                setDocumentVisibilityFilter(value);
                setCurrentPage(0); 
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {refreshing && ( 
            <div className="flex items-center justify-center min-h-[200px]">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {!refreshing && userDocuments.length === 0 ? (
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
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {userDocuments.map((document) => (
                  <DocumentCard
                    key={document.id}
                    document={document}
                    canDelete={true}
                    onDelete={handleDelete}
                    onDownload={handleDownload}
                  />
                ))}
              </div>

              {/* Pagination Controls for My Documents */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8">
                  <Button
                    onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                    disabled={currentPage === 0 || refreshing}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage === totalPages - 1 || refreshing}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
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
                      <SelectItem value="500">500 Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-500">Role cannot be changed</p>
              </div>

              {/* Error and Success messages specific to profile update */}
              {/* {error && (
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
              )} */}

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
