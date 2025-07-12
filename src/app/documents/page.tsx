"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { DocumentCard } from "@/components/document-card"
import { DocumentFilters } from "@/components/document-filters"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import type { Document, DocumentFilters as DocumentFiltersType, User } from "@/lib/types"
import { AlertCircle } from "lucide-react"

const ITEMS_PER_PAGE = 12

function DocumentsContent() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [filters, setFilters] = useState<DocumentFiltersType>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [user, setUser] = useState<User | null>(null)
  const [currentPage, setCurrentPage] = useState(0) 
  const [totalDocumentCount, setTotalDocumentCount] = useState(0)

  useEffect(() => {
    fetchDocuments(currentPage, filters)
  }, [currentPage, filters])

  useEffect(() => {
    getCurrentUser()
  }, [])

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

  const fetchDocuments = useCallback(
    async (pageToFetch: number, currentFilters: DocumentFiltersType) => {
      try {
        setLoading(true)
        setError("")

        const from = pageToFetch * ITEMS_PER_PAGE
        const to = from + ITEMS_PER_PAGE - 1

        let query = supabase
          .from("documents")
          .select(
            `
            *,
            uploader:profiles(id, name, role)
          `,
            { count: "exact" }, // Requests the exact count of matching rows
          )
          .eq("is_public", true)

        // Apply filters directly to the Supabase query
        if (currentFilters.search) {
          // Use ILIKE for case-insensitive search
          query = query.or(
            `title.ilike.%${currentFilters.search}%,description.ilike.%${currentFilters.search}%,file_name.ilike.%${currentFilters.search}%,course_code.ilike.%${currentFilters.search}%,course_title.ilike.%${currentFilters.search}%`,
          )
        }
        if (currentFilters.course_code) {
          query = query.eq("course_code", currentFilters.course_code)
        }
        if (currentFilters.level) {
          query = query.eq("level", currentFilters.level)
        }
        if (currentFilters.semester) {
          query = query.eq("semester", currentFilters.semester)
        }
        if (currentFilters.document_type) {
          query = query.eq("document_type", currentFilters.document_type)
        }
        if (currentFilters.uploader_role) {
          query = query.eq("uploader.role", currentFilters.uploader_role)
        }

        query = query.order("created_at", { ascending: false }).range(from, to)

        const { data: documentsData, error: documentsError, count } = await query

        if (documentsError) throw documentsError

        setDocuments(documentsData as Document[])
        setFilteredDocuments(documentsData as Document[]) 
        setTotalDocumentCount(count || 0)
      } catch (error: any) {
        console.error("Fetch documents error:", error)
        setError(error.message || "Failed to load documents.")
      } finally {
        setLoading(false)
      }
    },
    [], 
  )

  const handleFiltersChange = useCallback(
    (newFilters: DocumentFiltersType) => {
      setFilters(newFilters)
      setCurrentPage(0) 
    },
    [],
  )

  const handleDownload = useCallback(async (document: Document) => {
    try {
      const { data, error } = await supabase.storage.from("documents").download(document.storage_path)

      if (error) throw error

      if (typeof window !== "undefined" && data) {
        const url = URL.createObjectURL(data)
        const a = window.document.createElement("a") as HTMLAnchorElement
        a.href = url
        a.download = document.file_name
        window.document.body.appendChild(a)
        a.click()
        window.document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (!data) {
        console.error("Download error: No data received for download.")
        setError("Failed to download file: No data.")
      } else {
        console.warn("Download attempted in a non-browser environment. Skipping DOM manipulation.")
      }
    } catch (error: any) {
      console.error("Download error:", error)
      setError(`Failed to download file: ${error.message || "An unknown error occurred."}`)
    }
  }, [])
  
  const handleDelete = useCallback(
    async (documentId: string) => {
      if (!user || user.role !== "admin") {
        setError("You do not have permission to delete documents")
        return
      }

      try {
        const docToDelete = documents.find((doc) => doc.id === documentId)

        const { error: dbError } = await supabase.from("documents").delete().eq("id", documentId)
        if (dbError) throw dbError

        if (docToDelete && docToDelete.storage_path) {
          const { error: storageError } = await supabase.storage.from("documents").remove([docToDelete.storage_path])
          if (storageError) {
            console.warn(
              "Could not delete file from storage (might already be gone or permissions issue):",
              storageError.message,
            )
          }
        }

        fetchDocuments(currentPage, filters)

        setError("") 
      } catch (error: any) {
        console.error("Delete error:", error)
        setError(error.message || "Failed to delete document.")
      }
    },
    [user, documents, fetchDocuments, currentPage, filters], 
  )

  const totalPages = Math.ceil(totalDocumentCount / ITEMS_PER_PAGE)

  // if (loading) {
  //   return (
  //     <div className="container mx-auto px-4 py-8">
  //       <div className="flex items-center justify-center min-h-[400px]">
  //         <LoadingSpinner size="lg" />
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Library</h1>
        <p className="text-gray-600">Browse and download academic resources</p>
      </div>

      <DocumentFilters filters={filters} onFiltersChange={handleFiltersChange} />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredDocuments.length} of {totalDocumentCount} documents
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center min-h-[200px]">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {!loading && filteredDocuments.length === 0 ? (
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

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0 || loading}
            variant="outline"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-700">
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage === totalPages - 1 || loading}
            variant="outline"
          >
            Next
          </Button>
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