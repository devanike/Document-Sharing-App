import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { BookOpen, Users, Award, Download, Upload, Shield, Search } from "lucide-react"

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Welcome to CS DocShare</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Your gateway to academic excellence. Access, share, and collaborate on Computer Science documents with ease
            and security.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/documents">
                <Search className="w-5 h-5 mr-2" />
                Browse Documents
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-blue-600 bg-transparent"
              asChild
            >
              <Link href="/signup">
                <Upload className="w-5 h-5 mr-2" />
                Join Community
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Department Image */}
      <section className="container mx-auto px-4">
        <div className="relative h-64 md:h-96 rounded-xl overflow-hidden">
          <Image
            src="/placeholder.svg?height=400&width=800"
            alt="Computer Science Department"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-blue-900/20 flex items-center justify-center">
            <div className="text-center text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Computer Science Department</h2>
              <p className="text-lg">Excellence in Technology Education</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose CS DocShare?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Built with security, accessibility, and collaboration in mind
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-blue-100 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-blue-900">Easy Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Download documents instantly without registration. Quick access to all academic materials.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-100 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-blue-900">Secure Platform</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Advanced security with OTP verification, file integrity checks, and session management.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-100 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-blue-900">Smart Search</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Advanced filtering by course, level, semester, and document type for quick discovery.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-100 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-blue-900">Easy Sharing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Students and faculty can upload and share documents with flexible privacy controls.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-100 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-blue-900">Community Driven</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Built by students, for students. Collaborative learning environment for all levels.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-100 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-blue-900">Rich Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Lecture notes, assignments, past questions, projects, and more from all academic levels.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-blue-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">About CS DocShare</h2>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              CS DocShare is the official document sharing platform for our Computer Science Department. We provide a
              secure, user-friendly environment where students and faculty can access, share, and collaborate on
              academic materials. Our platform emphasizes security, accessibility, and ease of use while maintaining the
              highest standards of academic integrity.
            </p>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
                <div className="text-gray-600">Documents Shared</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">200+</div>
                <div className="text-gray-600">Active Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
                <div className="text-gray-600">Faculty Members</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Department History */}
      <section className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">Department History</h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-6">
              The Computer Science Department was established in 1985 with a vision to become a leading center for
              computing education and research. Over the decades, we have grown from a small department with just 20
              students to a thriving academic community of over 1,000 students and 50 faculty members.
            </p>
            <p className="text-gray-700 mb-6">
              Our department has been at the forefront of technological advancement, consistently updating our
              curriculum to meet industry demands and preparing students for successful careers in technology. We have
              produced thousands of graduates who now work in leading tech companies worldwide.
            </p>
            <div className="grid md:grid-cols-2 gap-8 mt-8">
              <Card className="border-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Award className="w-5 h-5" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-700">
                    <li>• First department to introduce AI curriculum (2018)</li>
                    <li>• Winner of National Programming Contest (2020)</li>
                    <li>• Excellence in Teaching Award (2021)</li>
                    <li>• Research Innovation Grant (2022)</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <BookOpen className="w-5 h-5" />
                    Programs Offered
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-700">
                    <li>• B.Sc. Computer Science</li>
                    <li>• M.Sc. Computer Science</li>
                    <li>• Ph.D. Computer Science</li>
                    <li>• Professional Certifications</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join our community of learners and educators. Start sharing and accessing academic resources today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup">Create Account</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-blue-600 bg-transparent"
              asChild
            >
              <Link href="/documents">Browse Documents</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
