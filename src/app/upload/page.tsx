"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabase"
import { calculateFileHash, formatFileSize } from "@/lib/utils"
import type { User } from "@/lib/types"
import { Upload, File, AlertCircle, CheckCircle, X, Smartphone } from "lucide-react"

// File size limits (in bytes) - reduced for mobile
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB for better mobile performance
const MOBILE_MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB for mobile devices
const CHUNK_SIZE = 1024 * 1024 // 1MB chunks for mobile uploads

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "application/zip",
  "application/x-rar-compressed",
]

// Mobile detection utility
const isMobileDevice = () => {
  if (typeof window === "undefined") return false
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768
  )
}

export default function UploadPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const [form, setForm] = useState({
    title: "",
    description: "",
    course_code: "",
    course_title: "",
    level: "",
    semester: "",
    document_type: "",
    is_public: true,
  })

  const router = useRouter()

  useEffect(() => {
    // Detect mobile device
    setIsMobile(isMobileDevice())

    const checkUserAuth = async () => {
      try {
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
        } else {
          router.push("/login")
        }
      } catch (err) {
        console.error("Authentication check failed:", err)
        router.push("/login")
      }
    }

    checkUserAuth()
  }, [router])

  // Enhanced file validation for mobile
  const validateFile = useCallback(
    (file: File): string | null => {
      const maxSize = isMobile ? MOBILE_MAX_FILE_SIZE : MAX_FILE_SIZE

      // Check file size
      if (file.size > maxSize) {
        return `File size exceeds ${formatFileSize(maxSize)} limit${isMobile ? " (mobile)" : ""}. Current size: ${formatFileSize(file.size)}`
      }

      // Check file type
      if (!ALLOWED_FILE_TYPES.includes(file.type) && file.type !== "") {
        return "File type not supported. Please upload PDF, DOC, PPT, TXT, ZIP, or RAR files."
      }

      // Additional extension check
      const fileExtension = file.name.split(".").pop()?.toLowerCase()
      const allowedExtensions = ["pdf", "doc", "docx", "ppt", "pptx", "txt", "zip", "rar"]

      if (file.type === "" && !allowedExtensions.includes(fileExtension || "")) {
        return "File type not supported. Please upload PDF, DOC, PPT, TXT, ZIP, or RAR files."
      }

      // Mobile-specific warnings
      if (isMobile && file.size > 5 * 1024 * 1024) {
        console.warn("Large file on mobile device - may take longer to upload")
      }

      return null
    },
    [isMobile],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        // Reset any previous errors
        setError("")
        setUploadProgress(0)

        // Validate file
        const validationError = validateFile(selectedFile)
        if (validationError) {
          setError(validationError)
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }
          return
        }

        setFile(selectedFile)

        // Auto-populate title if empty
        setForm((prevForm) => {
          if (!prevForm.title) {
            return { ...prevForm, title: selectedFile.name.split(".")[0] }
          }
          return prevForm
        })
      }
    },
    [validateFile],
  )

  // Remove file handler
  const handleRemoveFile = useCallback(() => {
    setFile(null)
    setUploadProgress(0)
    setError("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  // Form input handlers
  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setForm((prevForm) => ({ ...prevForm, [id]: value }))
  }, [])

  const handleSelectChange = useCallback((id: string, value: string) => {
    setForm((prevForm) => ({ ...prevForm, [id]: value }))
  }, [])

  // Enhanced upload with progress tracking and mobile optimizations
  const uploadFileWithProgress = useCallback(
    async (file: File, filePath: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Create abort controller for cancellation
        abortControllerRef.current = new AbortController()

        const uploadFile = async () => {
          try {
            setUploadProgress(10) // Initial progress

            // For mobile devices, use a different upload strategy
            if (isMobile) {
              // Direct upload for mobile (simpler approach)
              const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
              })

              if (uploadError) throw uploadError
              setUploadProgress(100)
              resolve()
            } else {
              // Standard upload for desktop
              const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
              })

              if (uploadError) throw uploadError
              setUploadProgress(100)
              resolve()
            }
          } catch (error) {
            reject(error)
          }
        }

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return prev
            }
            return prev + Math.random() * 10
          })
        }, 500)

        uploadFile().finally(() => {
          clearInterval(progressInterval)
        })
      })
    },
    [isMobile],
  )

  // Main form submission with mobile optimizations
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!file) {
        setError("Please select a file to upload.")
        return
      }

      if (!user) {
        setError("User not authenticated. Please log in.")
        router.push("/login")
        return
      }

      // Validate required fields
      const requiredFields = ["title", "course_code", "course_title", "level", "semester", "document_type"]
      const missingFields = requiredFields.filter((field) => !form[field as keyof typeof form])

      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(", ")}`)
        return
      }

      // Final file validation
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      setLoading(true)
      setIsUploading(true)
      setError("")
      setSuccess("")
      setUploadProgress(0)

      try {
        // Step 1: Calculate file hash (with progress)
        setUploadProgress(5)
        const fileHash = await calculateFileHash(file)

        // Step 2: Check for duplicates
        setUploadProgress(15)
        const { data: existingDocs, error: checkError } = await supabase
          .from("documents")
          .select("id")
          .eq("file_hash", fileHash)
          .limit(1)

        if (checkError) throw checkError

        if (existingDocs && existingDocs.length > 0) {
          setError("This file (or an identical version) has already been uploaded.")
          return
        }

        // Step 3: Prepare file path
        const timestamp = Date.now()
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
        const uniqueFileName = `${timestamp}-${sanitizedFileName}`
        const filePath = `${user.id}/${uniqueFileName}`

        // Step 4: Upload file with progress
        setUploadProgress(20)
        await uploadFileWithProgress(file, filePath)

        // Step 5: Save metadata to database
        setUploadProgress(95)
        const { error: dbError } = await supabase.from("documents").insert({
          title: form.title.trim(),
          description: form.description.trim() || null,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type || "application/octet-stream",
          file_hash: fileHash,
          course_code: form.course_code.trim(),
          course_title: form.course_title.trim(),
          level: form.level,
          semester: form.semester,
          document_type: form.document_type,
          is_public: form.is_public,
          uploader_id: user.id,
          uploader_role: user.role,
          storage_path: filePath,
        })

        if (dbError) {
          console.error("Database insert error:", dbError)
          // Try to clean up uploaded file
          await supabase.storage.from("documents").remove([filePath])
          throw new Error(`Failed to save document metadata: ${dbError.message}`)
        }

        // Success!
        setUploadProgress(100)
        setSuccess("Document uploaded successfully! 🎉 Redirecting...")

        // Reset form
        setFile(null)
        setForm({
          title: "",
          description: "",
          course_code: "",
          course_title: "",
          level: "",
          semester: "",
          document_type: "",
          is_public: true,
        })

        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }

        // Redirect after success
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } catch (err: any) {
        console.error("Upload process error:", err)

        // Handle specific mobile errors
        if (isMobile && err.message?.includes("network")) {
          setError("Network error. Please check your connection and try again.")
        } else if (err.message?.includes("timeout")) {
          setError("Upload timeout. Please try again with a smaller file or better connection.")
        } else {
          setError(err.message || "An unexpected error occurred during upload.")
        }
      } finally {
        setLoading(false)
        setIsUploading(false)
        setUploadProgress(0)
        abortControllerRef.current = null
      }
    },
    [file, user, form, router, validateFile, uploadFileWithProgress, isMobile],
  )

  // Cancel upload handler
  const handleCancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setLoading(false)
    setIsUploading(false)
    setUploadProgress(0)
    setError("Upload cancelled")
  }, [])

  // Show loading spinner while authenticating
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  const maxFileSize = isMobile ? MOBILE_MAX_FILE_SIZE : MAX_FILE_SIZE
  const isFormValid =
    file && form.title && form.course_code && form.course_title && form.level && form.semester && form.document_type

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Document
            {isMobile && <Smartphone className="w-4 h-4 text-blue-500" />}
          </CardTitle>
          <CardDescription>
            Share your academic resources with the community
            <br />
            <span className="text-sm">
              Max file size: {formatFileSize(maxFileSize)}
              {isMobile && " (Mobile optimized)"}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Section */}
            <div className="space-y-2">
              <Label htmlFor="file">Select File *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.rar"
                  disabled={isUploading}
                />

                {file ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <File className="w-8 h-8 text-blue-600" />
                      <div className="text-left">
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        {file.size > maxFileSize * 0.8 && (
                          <p className="text-xs text-orange-500">Large file - may take longer to upload</p>
                        )}
                      </div>
                    </div>

                    {!isUploading && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveFile}
                        className="flex items-center gap-1 bg-transparent"
                      >
                        <X className="w-3 h-3" />
                        Remove File
                      </Button>
                    )}
                  </div>
                ) : (
                  <label htmlFor="file" className="cursor-pointer block">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">{isMobile ? "Tap to select a file" : "Click to select a file"}</p>
                    <p className="text-sm text-gray-400">PDF, DOC, PPT, TXT, ZIP files supported</p>
                    <p className="text-xs text-gray-400">Max size: {formatFileSize(maxFileSize)}</p>
                  </label>
                )}
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Upload Progress</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelUpload}
                    className="text-red-600 bg-transparent"
                  >
                    Cancel
                  </Button>
                </div>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-gray-500 text-center">
                  {uploadProgress < 20
                    ? "Preparing upload..."
                    : uploadProgress < 95
                      ? "Uploading file..."
                      : "Saving document..."}
                </p>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={handleFormChange}
                placeholder="Document title"
                required
                disabled={isUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={handleFormChange}
                placeholder="Brief description of the document"
                rows={3}
                disabled={isUploading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course_code">Course Code *</Label>
                <Input
                  id="course_code"
                  value={form.course_code}
                  onChange={handleFormChange}
                  placeholder="e.g., CSC101"
                  required
                  disabled={isUploading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course_title">Course Title *</Label>
                <Input
                  id="course_title"
                  value={form.course_title}
                  onChange={handleFormChange}
                  placeholder="e.g., Introduction to Programming"
                  required
                  disabled={isUploading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Level *</Label>
                <Select
                  value={form.level}
                  onValueChange={(value) => handleSelectChange("level", value)}
                  disabled={isUploading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
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

              <div className="space-y-2">
                <Label htmlFor="semester">Semester *</Label>
                <Select
                  value={form.semester}
                  onValueChange={(value) => handleSelectChange("semester", value)}
                  disabled={isUploading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First">First Semester</SelectItem>
                    <SelectItem value="Second">Second Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="document_type">Document Type *</Label>
              <Select
                value={form.document_type}
                onValueChange={(value) => handleSelectChange("document_type", value)}
                disabled={isUploading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lecture_notes">Lecture Notes</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="past_question">Past Question</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_public"
                checked={form.is_public}
                onCheckedChange={(checked) => setForm((prevForm) => ({ ...prevForm, is_public: checked }))}
                disabled={isUploading}
              />
              <Label htmlFor="is_public">Make this document public</Label>
            </div>

            {/* Error and Success Messages */}
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

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={loading || !isFormValid || isUploading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  {isUploading ? "Uploading..." : "Processing..."}
                </div>
              ) : (
                "Upload Document"
              )}
            </Button>

            {/* Mobile-specific tips */}
            {isMobile && (
              <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                <p className="font-medium text-blue-700 mb-1">Mobile Upload Tips:</p>
                <ul className="space-y-1">
                  <li>• Keep files under {formatFileSize(MOBILE_MAX_FILE_SIZE)} for best performance</li>
                  <li>• Ensure stable internet connection</li>
                  <li>• Don't switch apps during upload</li>
                </ul>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
