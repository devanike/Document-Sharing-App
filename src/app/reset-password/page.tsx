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
import { formatFileSize, calculateFileHash } from "@/lib/utils"
import type { User } from "@/lib/types"
import { Upload, File, AlertCircle, CheckCircle, X } from "lucide-react"

// Unified file size limit for mobile compatibility
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB for all devices

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

export default function UploadPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploadStage, setUploadStage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

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

        if (profileError || !profile) {
          console.error("Error fetching profile:", profileError)
          router.push("/login")
          return
        }

        setUser(profile)
      } catch (err) {
        console.error("Authentication check failed:", err)
        router.push("/login")
      }
    }

    checkUserAuth()
  }, [router])

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit. Current size: ${formatFileSize(file.size)}`
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type) && file.type !== "") {
      return "File type not supported. Please upload PDF, DOC, PPT, TXT, ZIP, or RAR files."
    }

    const fileExtension = file.name.split(".").pop()?.toLowerCase()
    const allowedExtensions = ["pdf", "doc", "docx", "ppt", "pptx", "txt", "zip", "rar"]

    if (file.type === "" && !allowedExtensions.includes(fileExtension || "")) {
      return "File type not supported. Please upload PDF, DOC, PPT, TXT, ZIP, or RAR files."
    }

    return null
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        setError("")
        setUploadProgress(0)
        setUploadStage("")

        const validationError = validateFile(selectedFile)
        if (validationError) {
          setError(validationError)
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }
          return
        }

        setFile(selectedFile)
        setForm((prevForm) => ({
          ...prevForm,
          title: prevForm.title || selectedFile.name.split(".")[0],
        }))
      }
    },
    [validateFile],
  )

  const handleRemoveFile = useCallback(() => {
    setFile(null)
    setUploadProgress(0)
    setUploadStage("")
    setError("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setForm((prevForm) => ({ ...prevForm, [id]: value }))
  }, [])

  const handleSelectChange = useCallback((id: string, value: string) => {
    setForm((prevForm) => ({ ...prevForm, [id]: value }))
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // Basic validations
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

      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      setLoading(true)
      setError("")
      setSuccess("")
      setUploadProgress(0)

      try {
        // Step 1: Generate file hash with progress
        setUploadStage("Preparing file...")
        setUploadProgress(10)
        console.log("Starting file hash calculation...")

        const fileHash = await calculateFileHash(file)
        console.log("File hash generated:", fileHash)
        setUploadProgress(20)

        // Step 2: Check for duplicates
        setUploadStage("Checking for duplicates...")
        setUploadProgress(30)
        console.log("Checking for duplicate files...")

        const { data: existingDocs, error: checkError } = await supabase
          .from("documents")
          .select("id, title")
          .eq("file_hash", fileHash)
          .limit(1)

        if (checkError) {
          console.error("Duplicate check error:", checkError)
          throw new Error(`Database error: ${checkError.message}`)
        }

        if (existingDocs && existingDocs.length > 0) {
          throw new Error(`This file already exists: "${existingDocs[0].title}"`)
        }

        console.log("No duplicates found")
        setUploadProgress(40)

        // Step 3: Prepare file path
        setUploadStage("Preparing upload...")
        const timestamp = Date.now()
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
        const uniqueFileName = `${timestamp}-${sanitizedFileName}`
        const filePath = `${user.id}/${uniqueFileName}`

        console.log("Upload path:", filePath)
        setUploadProgress(50)

        // Step 4: Upload file to Supabase Storage
        setUploadStage("Uploading file...")
        console.log("Starting file upload...")

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          })

        if (uploadError) {
          console.error("Upload error:", uploadError)
          throw new Error(`Upload failed: ${uploadError.message}`)
        }

        console.log("File uploaded successfully:", uploadData)
        setUploadProgress(80)

        // Step 5: Save metadata to database
        setUploadStage("Saving document info...")
        console.log("Saving document metadata...")

        const documentData = {
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
        }

        const { data: dbData, error: dbError } = await supabase.from("documents").insert(documentData).select()

        if (dbError) {
          console.error("Database error:", dbError)
          // Try to clean up uploaded file
          try {
            await supabase.storage.from("documents").remove([filePath])
            console.log("Cleaned up uploaded file after database error")
          } catch (cleanupError) {
            console.error("Cleanup error:", cleanupError)
          }
          throw new Error(`Failed to save document: ${dbError.message}`)
        }

        console.log("Document saved successfully:", dbData)

        // Success!
        setUploadProgress(100)
        setUploadStage("Upload complete!")
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
        if (err.message?.includes("timeout")) {
          setError("Upload timeout. Please try again with a smaller file or better connection.")
        } else if (err.message?.includes("network")) {
          setError("Network error. Please check your connection and try again.")
        } else {
          setError(err.message || "An unexpected error occurred during upload.")
        }
      } finally {
        setLoading(false)
        setTimeout(() => {
          setUploadProgress(0)
          setUploadStage("")
        }, 3000)
      }
    },
    [file, user, form, router, validateFile],
  )

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  const isFormValid =
    file && form.title && form.course_code && form.course_title && form.level && form.semester && form.document_type

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Document
          </CardTitle>
          <CardDescription>
            Share your academic resources with the community
            <br />
            <span className="text-sm">Max file size: {formatFileSize(MAX_FILE_SIZE)}</span>
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
                  disabled={loading}
                />

                {file ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <File className="w-8 h-8 text-blue-600" />
                      <div className="text-left">
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>

                    {!loading && (
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
                    <p className="text-gray-600">Click to select a file</p>
                    <p className="text-sm text-gray-400">PDF, DOC, PPT, TXT, ZIP files supported</p>
                    <p className="text-xs text-gray-400">Max size: {formatFileSize(MAX_FILE_SIZE)}</p>
                  </label>
                )}
              </div>
            </div>

            {/* Upload Progress */}
            {loading && (
              <div className="space-y-2">
                <Label>Upload Progress</Label>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-gray-500 text-center">{uploadStage || "Starting..."}</p>
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
                disabled={loading}
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
                disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Level *</Label>
                <Select
                  value={form.level}
                  onValueChange={(value) => handleSelectChange("level", value)}
                  disabled={loading}
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
                  disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
            <Button type="submit" className="w-full" disabled={loading || !isFormValid}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  {uploadStage || "Processing..."}
                </div>
              ) : (
                "Upload Document"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
