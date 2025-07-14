"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { User, LogOut, Upload, Menu, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { User as UserType } from "@/lib/types"

export function Header() {
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    getUser()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        await getUser()
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function getUser() {
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
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/")
    setIsMobileMenuOpen(false)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="bg-white border-b border-blue-100 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-6">
          <Link href="/" onClick={closeMobileMenu}>
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4 font-md">
            <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
              Home
            </Link>
            <Link href="/documents" className="text-gray-600 hover:text-blue-600 transition-colors">
              Documents
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-blue-600 transition-colors">
              About
            </Link>
          </nav>

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center">
            {loading ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : user ? (
              <div className="flex items-center">
                <span className="text-sm text-gray-600 w-auto">Welcome, {user.name}</span>
                <div className="flex items-center">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard">
                      <User className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/upload">
                      <Upload className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="outline" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="p-2 text-black"
            >
              {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-blue-100">
            <nav className="flex flex-col space-y-3">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-blue-600 transition-colors py-2"
                onClick={closeMobileMenu}
              >
                Home
              </Link>
              <Link 
                href="/documents" 
                className="text-gray-600 hover:text-blue-600 transition-colors py-2"
                onClick={closeMobileMenu}
              >
                Documents
              </Link>
              <Link 
                href="/about" 
                className="text-gray-600 hover:text-blue-600 transition-colors py-2"
                onClick={closeMobileMenu}
              >
                About
              </Link>
              
              {/* Mobile User Actions */}
              <div className="pt-4 border-t border-blue-100">
                {loading ? (
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                ) : user ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 py-2">
                      Welcome, {user.name}
                    </div>
                    <Link 
                      href="/dashboard"
                      className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors py-2"
                      onClick={closeMobileMenu}
                    >
                      <User className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link 
                      href="/upload"
                      className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors py-2"
                      onClick={closeMobileMenu}
                    >
                      <Upload className="w-4 h-4" />
                      Upload
                    </Link>
                    <button 
                      onClick={handleSignOut}
                      className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors py-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/login" onClick={closeMobileMenu}>Login</Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href="/signup" onClick={closeMobileMenu}>Sign Up</Link>
                    </Button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}