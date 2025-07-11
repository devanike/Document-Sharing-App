import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Users, BookOpen, Award, Target, Eye, Heart } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">About CS DocShare</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Empowering academic excellence through secure, accessible, and collaborative document sharing for the Computer
          Science community.
        </p>
      </section>

      {/* Mission & Vision */}
      <section className="bg-blue-50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <Card className="border-blue-200">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-2xl text-blue-900">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  To create a secure, user-friendly platform that facilitates seamless sharing and access to academic
                  resources, fostering collaboration and knowledge exchange within the Computer Science department while
                  maintaining the highest standards of security and academic integrity.
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-2xl text-blue-900">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  To become the leading academic resource sharing platform that transforms how students and faculty
                  collaborate, learn, and grow together, setting new standards for educational technology and
                  community-driven learning in computer science education.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">The principles that guide everything we do</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="text-center border-blue-100 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-blue-900">Security First</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                We prioritize the security and privacy of our users with advanced encryption, secure authentication, and
                robust data protection measures.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-blue-100 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-blue-900">Community Driven</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Built by the community, for the community. We believe in the power of collaborative learning and
                knowledge sharing among peers.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-blue-100 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-blue-900">Academic Excellence</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                We are committed to supporting academic success through easy access to high-quality educational
                resources and materials.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-blue-100 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-blue-900">User-Centric</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Every feature is designed with our users in mind, ensuring an intuitive, accessible, and enjoyable
                experience for all community members.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-blue-100 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-blue-900">Innovation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                We continuously evolve and improve our platform using the latest technologies and best practices in
                educational technology.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-blue-100 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-blue-900">Integrity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                We maintain the highest standards of academic integrity and ethical practices in all aspects of our
                platform and community.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Overview */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Platform Features</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools designed for modern academic collaboration
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Secure Authentication</h3>
              <p className="text-gray-600 text-sm mb-3">
                Multi-factor authentication with OTP verification and session management
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary">OTP Verification</Badge>
                <Badge variant="secondary">Session Timeout</Badge>
                <Badge variant="secondary">reCAPTCHA</Badge>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">File Integrity</h3>
              <p className="text-gray-600 text-sm mb-3">
                SHA-256 hashing ensures document authenticity and prevents tampering
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary">SHA-256</Badge>
                <Badge variant="secondary">File Verification</Badge>
                <Badge variant="secondary">Integrity Checks</Badge>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Smart Search</h3>
              <p className="text-gray-600 text-sm mb-3">
                Advanced filtering by course, level, semester, and document type
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary">Full-text Search</Badge>
                <Badge variant="secondary">Multi-filter</Badge>
                <Badge variant="secondary">Real-time Results</Badge>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Role-based Access</h3>
              <p className="text-gray-600 text-sm mb-3">
                Different permissions for students, lecturers, and administrators
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary">Student Access</Badge>
                <Badge variant="secondary">Admin Controls</Badge>
                <Badge variant="secondary">Lecturer Tools</Badge>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Privacy Controls</h3>
              <p className="text-gray-600 text-sm mb-3">
                Flexible privacy settings for public and private document sharing
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary">Public/Private</Badge>
                <Badge variant="secondary">Access Control</Badge>
                <Badge variant="secondary">Sharing Options</Badge>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Modern Interface</h3>
              <p className="text-gray-600 text-sm mb-3">
                Responsive design with intuitive navigation and accessibility features
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary">Responsive</Badge>
                <Badge variant="secondary">Accessible</Badge>
                <Badge variant="secondary">User-friendly</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Built with Modern Technology</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Leveraging cutting-edge tools and frameworks for optimal performance and security
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <h3 className="font-semibold mb-2">Next.js</h3>
              <p className="text-sm text-gray-600">React framework with App Router</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">TS</span>
              </div>
              <h3 className="font-semibold mb-2">TypeScript</h3>
              <p className="text-sm text-gray-600">Type-safe development</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <h3 className="font-semibold mb-2">Supabase</h3>
              <p className="text-sm text-gray-600">Backend as a Service</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <h3 className="font-semibold mb-2">Tailwind CSS</h3>
              <p className="text-sm text-gray-600">Utility-first styling</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Information */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Get in Touch</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Have questions, suggestions, or need support? We'd love to hear from you.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold mb-2">Email Support</h3>
              <p className="text-blue-100">support@csdocshare.edu</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Department Office</h3>
              <p className="text-blue-100">Computer Science Building, Room 201</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Office Hours</h3>
              <p className="text-blue-100">Monday - Friday, 9:00 AM - 5:00 PM</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
