"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
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
import { Upload, File, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"

// File size limits (in bytes)
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
  'application/x-rar-compressed'
]

export default function UploadPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
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

        const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

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

  // File validation function
  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit. Current size: ${formatFileSize(file.size)}`
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type) && file.type !== '') {
      return "File type not supported. Please upload PDF, DOC, PPT, TXT, ZIP, or RAR files."
    }

    // Additional extension check for files with empty MIME type
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'zip', 'rar']
    if (file.type === '' && !allowedExtensions.includes(fileExtension || '')) {
      return "File type not supported. Please upload PDF, DOC, PPT, TXT, ZIP, or RAR files."
    }

    return null
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file before setting
      const validationError = validateFile(selectedFile)
      if (validationError) {
        setError(validationError)
        return
      }

      setFile(selectedFile)
      setForm((prevForm) => {
        if (!prevForm.title) {
          return { ...prevForm, title: selectedFile.name.split(".")[0] }
        }
        return prevForm
      })
      setError("")
      setUploadProgress(0)
    }
  }, [validateFile])

  // Callback for form input changes
  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setForm((prevForm) => ({ ...prevForm, [id]: value }))
  }, [])

  // Callback for select changes (specific handler for selects)
  const handleSelectChange = useCallback((id: string, value: string) => {
    setForm((prevForm) => ({ ...prevForm, [id]: value }))
  }, [])

  // Retry logic with exponential backoff
  const retryOperation = useCallback(async (operation: () => Promise<any>, maxRetries: number = 3): Promise<any> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error: any) {
        if (attempt === maxRetries) {
          throw error
        }
        
        // Exponential backoff: wait 1s, then 2s, then 4s
        const delay = Math.pow(2, attempt) * 1000
        setRetryCount(attempt + 1)
        setIsRetrying(true)
        setCurrentStep(`Retrying... (${attempt + 1}/${maxRetries})`)
        
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }, [])

  // Upload with progress tracking
  // const uploadFileWithProgress = useCallback(async (filePath: string, file: File) => {
  //   return new Promise((resolve, reject) => {
  //     const xhr = new XMLHttpRequest()
      
  //     // Track upload progress
  //     xhr.upload.addEventListener('progress', (e) => {
  //       if (e.lengthComputable) {
  //         const percentComplete = (e.loaded / e.total) * 100
  //         setUploadProgress(percentComplete)
  //       }
  //     })
      
  //     xhr.onload = () => {
  //       if (xhr.status === 200) {
  //         resolve(xhr.response)
  //       } else {
  //         reject(new Error(`Upload failed with status ${xhr.status}`))
  //       }
  //     }
      
  //     xhr.onerror = () => reject(new Error('Upload failed'))
      
  //     // Use Supabase storage upload (fallback to regular method if XMLHttpRequest doesn't work)
  //     supabase.storage.from("documents").upload(filePath, file)
  //       .then(result => {
  //         if (result.error) {
  //           reject(result.error)
  //         } else {
  //           setUploadProgress(100)
  //           resolve(result)
  //         }
  //       })
  //       .catch(reject)
  //   })
  // }, [])

  // Main form submission logic
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
    if (!form.title || !form.course_code || !form.course_title || !form.level || !form.semester || !form.document_type) {
      setError("Please fill in all required fields.")
      return
    }

    // Validate file again before upload
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")
    setUploadProgress(0)
    setRetryCount(0)
    setIsRetrying(false)

    try {
      // Step 1: Calculate file hash
      setCurrentStep("Calculating file hash...")
      setUploadProgress(10)
      
      const fileHash = await retryOperation(async () => {
        return await calculateFileHash(file)
      })

      // Step 2: Check for duplicates
      setCurrentStep("Checking for duplicates...")
      setUploadProgress(20)
      
      const { data: existingDocuments, error: checkError } = await retryOperation(async () => {
        return await supabase
          .from("documents")
          .select("id")
          .eq("file_hash", fileHash)
          .limit(1)
      })

      if (checkError) {
        throw checkError
      }

      if (existingDocuments && existingDocuments.length > 0) {
        setError("This file (or an identical version) has already been uploaded.")
        return
      }

      // Step 3: Upload file
      setCurrentStep("Uploading file...")
      setUploadProgress(30)
      
      const uniqueFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}` 
      const filePath = `${user.id}/${uniqueFileName}` 

      await retryOperation(async () => {
        const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file)
        if (uploadError) {
          if (uploadError.message.includes("duplicate key")) {
            throw new Error("A file with this name already exists in your storage. Please rename your file or try again.")
          } else {
            throw uploadError
          }
        }
      })

      // Step 4: Save to database
      setCurrentStep("Saving document metadata...")
      setUploadProgress(90)
      
      const { error: dbError } = await retryOperation(async () => {
        return await supabase.from("documents").insert({
          title: form.title,
          description: form.description || null,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type || "application/octet-stream",
          file_hash: fileHash,
          course_code: form.course_code,
          course_title: form.course_title,
          level: form.level,
          semester: form.semester,
          document_type: form.document_type,
          is_public: form.is_public,
          uploader_id: user.id,
          uploader_role: user.role,
          storage_path: filePath,
          created_at: new Date().toISOString(),
        })
      })

      if (dbError) {
        console.error("Database insert error:", dbError)
        throw new Error(`Failed to save document metadata: ${dbError.message}`)
      }

      // Step 5: Complete
      setCurrentStep("Upload completed!")
      setUploadProgress(100)
      setSuccess("Document uploaded successfully! 🎉 Redirecting to documents...")
      
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

      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (err: any) {
      console.error("Upload process error:", err)
      setError(err.message || "An unexpected error occurred during upload.")
      setCurrentStep("")
      setUploadProgress(0)
    } finally {
      setLoading(false)
      setIsRetrying(false)
    }
  }, [file, user, form, router, validateFile, retryOperation])

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Document
          </CardTitle>
          <CardDescription>
            Share your academic resources with the community (Max file size: {formatFileSize(MAX_FILE_SIZE)})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="file">Select File</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.rar"
                />
                <label htmlFor="file" className="cursor-pointer">
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <File className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                        {file.size > MAX_FILE_SIZE * 0.8 && (
                          <p className="text-xs text-orange-500">Large file - may take longer to upload</p>
                        )}
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => setFile(null)} className="mt-2">
                        Remove File
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Click to select a file</p>
                      <p className="text-sm text-gray-400">PDF, DOC, PPT, TXT, ZIP files supported</p>
                      <p className="text-xs text-gray-400">Max size: {formatFileSize(MAX_FILE_SIZE)}</p>
                    </div>
                  )}
                </label>
              </div>
              {!file && <p className="text-red-500 text-sm">A file is required to upload.</p>} 
            </div>

            {/* Progress indicator */}
            {loading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{currentStep}</span>
                  {isRetrying && (
                    <div className="flex items-center gap-1 text-sm text-blue-600">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Retry {retryCount}/3
                    </div>
                  )}
                </div>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-gray-500">{Math.round(uploadProgress)}% complete</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={handleFormChange}
                placeholder="Document title"
                required
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
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course_code">Course Code</Label>
                <Input
                  id="course_code"
                  value={form.course_code}
                  onChange={handleFormChange}
                  placeholder="e.g., CSC101"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course_title">Course Title</Label>
                <Input
                  id="course_title"
                  value={form.course_title}
                  onChange={handleFormChange}
                  placeholder="e.g., Introduction to Programming"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select value={form.level} onValueChange={(value) => handleSelectChange("level", value)} required>
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
                <Label htmlFor="semester">Semester</Label>
                <Select value={form.semester} onValueChange={(value) => handleSelectChange("semester", value)} required>
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
              <Label htmlFor="document_type">Document Type</Label>
              <Select 
                value={form.document_type} 
                onValueChange={(value) => handleSelectChange("document_type", value)}
                required
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
                className="bg-black"
                id="is_public"
                checked={form.is_public}
                onCheckedChange={(checked) => setForm((prevForm) => ({ ...prevForm, is_public: checked }))}
              />
              <Label htmlFor="is_public">Make this document public</Label>
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

            <Button type="submit" className="w-full" disabled={loading || !file || !form.title || !form.course_code || !form.course_title || !form.level || !form.semester || !form.document_type}>
              {loading ? <LoadingSpinner size="sm" /> : "Upload Document"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}