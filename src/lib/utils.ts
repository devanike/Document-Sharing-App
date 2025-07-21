import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// export async function calculateFileHash(file: File): Promise<string> {
//   try {
//     if (crypto?.subtle) {
//       const arrayBuffer = await file.arrayBuffer()
//       const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer)
//       const hashArray = Array.from(new Uint8Array(hashBuffer))
//       return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
//     }
//   } catch (error) {
//     console.warn("Web Crypto API failed, using spark-md5 fallback:", error)
//   }

//   return new Promise((resolve, reject) => {
//     const chunkSize = 2097152 // 2MB
//     const spark = new SparkMD5.ArrayBuffer()
//     const fileReader = new FileReader()
//     let cursor = 0

//     fileReader.onload = (e) => {
//       spark.append(e.target?.result as ArrayBuffer)
//       cursor += chunkSize
//       if (cursor < file.size) {
//         readNext()
//       } else {
//         resolve(spark.end())
//       }
//     }

//     fileReader.onerror = () => reject(new Error("Failed to read file for hashing"))

//     function readNext() {
//       const slice = file.slice(cursor, cursor + chunkSize)
//       fileReader.readAsArrayBuffer(slice)
//     }

//     readNext()
//   })
// }

export async function calculateFileHash(file: File): Promise<string> {
  try {
    // For very large files on mobile, use a simpler approach
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

    if (isMobile && file.size > 10 * 1024 * 1024) {
      // 10MB
      // Use file metadata for very large files on mobile
      const simpleHash = btoa(`${file.name}-${file.size}-${file.lastModified}-${file.type}`)
      return simpleHash.replace(/[^a-zA-Z0-9]/g, "").substring(0, 64)
    }

    // Try Web Crypto API first
    if (crypto?.subtle) {
      const arrayBuffer = await file.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    }
  } catch (error) {
    console.warn("Web Crypto API failed, using fallback:", error)
  }

  // Fallback: use file metadata
  const fallbackHash = btoa(`${file.name}-${file.size}-${file.lastModified}-${file.type}`)
  return fallbackHash.replace(/[^a-zA-Z0-9]/g, "").substring(0, 64)
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function generateTempPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  let password = ""
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export function validatePassword(password: string): boolean {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
}
