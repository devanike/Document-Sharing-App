export interface User {
  id: string
  email: string
  name: string
  level?: string
  role: "student" | "admin"
  created_at: string
  updated_at: string
}

export interface Document {
  // createElement(arg0: string): unknown
  // body: any
  id: string
  title: string
  description?: string
  file_name: string
  file_size: number
  file_type: string
  file_hash: string
  course_code?: string
  course_title?: string
  level?: string
  semester?: string
  document_type?: string
  is_public: boolean
  uploader_id: string
  uploader_role: string
  storage_path: string
  created_at: string
  updated_at: string
  uploader?: {
    name: string
    role: string
  }
}

export interface DocumentFilters {
  search?: string
  course_code?: string
  level?: string
  semester?: string
  document_type?: string
  uploader_role?: string
}
