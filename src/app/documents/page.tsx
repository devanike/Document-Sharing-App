"use client"

import { useState, useEffect, Suspense } from "react"
import { DocumentCard } from "@/components/document-card"
import { DocumentFilters } from "@/components/document-filters"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import type { Document, DocumentFilters as DocumentFiltersType, User } from "@/lib/types"
import { AlertCircle } from "lucide-react"

function DocumentsContent() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [filters, setFilters] = useState<DocumentFiltersType>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetchDocuments()
    getCurrentUser()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [documents, filters])

  async function getCurrentUser() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

        if (profile) {
          setUser(profile)
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    }
  }

  async function fetchDocuments() {
    try {
      setLoading(true)
      
      // Fetch documents first
      const { data: documentsData, error: documentsError } = await supabase
        .from("documents")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })

      if (documentsError) throw documentsError

      if (!documentsData || documentsData.length === 0) {
        setDocuments([])
        return
      }

      // Get unique uploader IDs
      const uploaderIds = [...new Set(documentsData.map(doc => doc.uploader_id))]
      
      // Fetch profiles for the uploaders
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, role")
        .in("id", uploaderIds)

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError)
        // Continue without profile data rather than failing completely
      }

      // Combine the data
      const documentsWithUploaders = documentsData.map(doc => ({
        ...doc,
        uploader: profilesData?.find(profile => profile.id === doc.uploader_id) || {
          name: "Unknown User",
          role: doc.uploader_role || "student"
        }
      }))

      setDocuments(documentsWithUploaders)
    } catch (error: any) {
      console.error("Fetch documents error:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let filtered = documents

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchTerm) ||
          doc.description?.toLowerCase().includes(searchTerm) ||
          doc.file_name.toLowerCase().includes(searchTerm) ||
          doc.course_code?.toLowerCase().includes(searchTerm) ||
          doc.course_title?.toLowerCase().includes(searchTerm),
      )
    }

    if (filters.course_code) {
      filtered = filtered.filter((doc) => doc.course_code === filters.course_code)
    }

    if (filters.level) {
      filtered = filtered.filter((doc) => doc.level === filters.level)
    }

    if (filters.semester) {
      filtered = filtered.filter((doc) => doc.semester === filters.semester)
    }

    if (filters.document_type) {
      filtered = filtered.filter((doc) => doc.document_type === filters.document_type)
    }

    if (filters.uploader_role) {
      filtered = filtered.filter((doc) => doc.uploader_role === filters.uploader_role)
    }

    setFilteredDocuments(filtered)
  }

  async function handleDownload(document: Document) {
  try {
    const { data, error } = await supabase.storage.from("documents").download(document.storage_path);

    if (error) throw error;

    if (typeof window !== 'undefined' && data) {
      const url = URL.createObjectURL(data);
      const a = window.document.createElement("a") as HTMLAnchorElement; 
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a); 
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (!data) {
      console.error("Download error: No data received for download.");
      setError("Failed to download file: No data.");
    } else {
      console.warn("Download attempted in a non-browser environment. Skipping DOM manipulation.");
    }
  } catch (error: any) {
    console.error("Download error:", error);
    setError("Failed to download file");
  }
}


  async function handleDelete(documentId: string) {
    if (!user || user.role !== "admin") {
      setError("You do not have permission to delete documents")
      return
    }

    try {
      const { error } = await supabase.from("documents").delete().eq("id", documentId)

      if (error) throw error

      setDocuments(documents.filter((doc) => doc.id !== documentId))
    } catch (error: any) {
      setError(error.message)
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

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Library</h1>
        <p className="text-gray-600">Browse and download academic resources</p>
      </div>

      <DocumentFilters filters={filters} onFiltersChange={setFilters} />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredDocuments.length} of {documents.length} documents
        </p>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No documents found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              canDelete={!!(user && user.role === "admin")}
              onDelete={handleDelete}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function DocumentsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      }
    >
      <DocumentsContent />
    </Suspense>
  )
}