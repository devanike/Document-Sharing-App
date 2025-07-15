import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from "crypto"
import SparkMD5 from "spark-md5"

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
//     // Check if crypto.subtle is available
//     if (!crypto || !crypto.subtle) {
//       console.warn('Web Crypto API not available, using fallback hash');
//       // Fallback: use file name + size + lastModified as a simple hash
//       return btoa(`${file.name}-${file.size}-${file.lastModified}`);
//     }

//     // Read the file as ArrayBuffer
//     const arrayBuffer = await file.arrayBuffer();
    
//     // Calculate SHA-256 hash
//     const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    
//     // Convert to hex string
//     const hashArray = Array.from(new Uint8Array(hashBuffer));
//     const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
//     return hashHex;
//   } catch (error) {
//     console.error('Error calculating file hash:', error);
//     // Fallback hash if crypto fails
//     return btoa(`${file.name}-${file.size}-${file.lastModified}`);
//   }
// }

export async function calculateFileHash(file: File): Promise<string> {
  try {
    if (crypto?.subtle) {
      const arrayBuffer = await file.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
    }
  } catch (error) {
    console.warn("Web Crypto API failed, using spark-md5 fallback:", error)
  }

  return new Promise((resolve, reject) => {
    const chunkSize = 2097152 // 2MB
    const spark = new SparkMD5.ArrayBuffer()
    const fileReader = new FileReader()
    let cursor = 0

    fileReader.onload = (e) => {
      spark.append(e.target?.result as ArrayBuffer)
      cursor += chunkSize
      if (cursor < file.size) {
        readNext()
      } else {
        resolve(spark.end())
      }
    }

    fileReader.onerror = () => reject(new Error("Failed to read file for hashing"))

    function readNext() {
      const slice = file.slice(cursor, cursor + chunkSize)
      fileReader.readAsArrayBuffer(slice)
    }

    readNext()
  })
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
