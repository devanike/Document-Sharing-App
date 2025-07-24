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

// Mobile-optimized file hash calculation
export async function calculateFileHash(file: File): Promise<string> {
  try {
    // Always use lightweight metadata-based hash for mobile reliability
    // This avoids memory issues and main thread blocking
    const isMobile =
      typeof window !== "undefined" &&
      (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        // Additional mobile detection
        window.innerWidth <= 768 ||
        // Check for touch capability
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0)

    // Use lightweight hash for mobile devices or files > 1MB
    if (isMobile || file.size > 1024 * 1024) {
      console.log("Using lightweight hash for mobile/large file")
      return generateLightweightHash(file)
    }

    // For desktop with small files, try Web Crypto API with timeout
    const hasCrypto = typeof window !== "undefined" && window.crypto && window.crypto.subtle

    if (hasCrypto && file.size <= 1024 * 1024) {
      // Only for files <= 1MB
      try {
        console.log("Attempting Web Crypto hash for small desktop file")

        // Add timeout to prevent hanging
        const hashPromise = computeWebCryptoHash(file)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Hash timeout")), 3000)
        })

        const hash = (await Promise.race([hashPromise, timeoutPromise])) as string
        console.log("Web Crypto hash successful")
        return hash
      } catch (error) {
        console.warn("Web Crypto hash failed, falling back to lightweight:", error)
        return generateLightweightHash(file)
      }
    }

    // Default to lightweight hash
    return generateLightweightHash(file)
  } catch (error) {
    console.warn("Hash calculation failed, using emergency fallback:", error)
    return generateEmergencyHash(file)
  }
}

// Lightweight metadata-based hash (no file reading required)
function generateLightweightHash(file: File): string {
  const hashString = `${file.name}-${file.size}-${file.lastModified}-${file.type}-${Date.now()}`
  let hash = 0

  for (let i = 0; i < hashString.length; i++) {
    const char = hashString.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(16).padStart(8, "0")
}

// Web Crypto API hash (for small desktop files only)
async function computeWebCryptoHash(file: File): Promise<string> {
  // Read file in chunks to avoid memory issues
  const chunkSize = 64 * 1024 // 64KB chunks
  const chunks: ArrayBuffer[] = []

  for (let start = 0; start < file.size; start += chunkSize) {
    const end = Math.min(start + chunkSize, file.size)
    const chunk = file.slice(start, end)
    const arrayBuffer = await chunk.arrayBuffer()
    chunks.push(arrayBuffer)
  }

  // Combine chunks
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
  const combined = new Uint8Array(totalSize)
  let offset = 0

  for (const chunk of chunks) {
    combined.set(new Uint8Array(chunk), offset)
    offset += chunk.byteLength
  }

  // Hash the combined data
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", combined)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

// Emergency fallback hash
function generateEmergencyHash(file: File): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2)
  const fileInfo = `${file.name.length}-${file.size}-${timestamp}`
  return `${fileInfo}-${random}`.replace(/[^a-zA-Z0-9]/g, "").substring(0, 16)
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
