"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Filter, X } from "lucide-react"
import type { DocumentFilters } from "../lib/types"

interface DocumentFiltersProps {
  filters: DocumentFilters
  onFiltersChange: (filters: DocumentFilters) => void
}

export function DocumentFilters({ filters, onFiltersChange }: DocumentFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleFilterChange = (key: keyof DocumentFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
    setShowAdvanced(false)
  }

  const hasActiveFilters = Object.values(filters).some((value) => value && value.length > 0)

  return (
    <div className="bg-white p-4 rounded-lg border border-blue-100 space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search documents..."
            value={filters.search || ""}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} className="flex items-center gap-2 text-red-600">
            <X className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <Select
            value={filters.course_code || "all"}
            onValueChange={(value) => handleFilterChange("course_code", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Course Code" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              <SelectItem value="CSC101">CSC101</SelectItem>
              <SelectItem value="CSC201">CSC201</SelectItem>
              <SelectItem value="CSC301">CSC301</SelectItem>
              <SelectItem value="CSC401">CSC401</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.level || "all"} onValueChange={(value) => handleFilterChange("level", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="100">100 Level</SelectItem>
              <SelectItem value="200">200 Level</SelectItem>
              <SelectItem value="300">300 Level</SelectItem>
              <SelectItem value="400">400 Level</SelectItem>
              <SelectItem value="500">500 Level</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.semester || "all"} onValueChange={(value) => handleFilterChange("semester", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              <SelectItem value="First">First Semester</SelectItem>
              <SelectItem value="Second">Second Semester</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.document_type || "all"}
            onValueChange={(value) => handleFilterChange("document_type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Document Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="lecture_notes">Lecture Notes</SelectItem>
              <SelectItem value="assignment">Assignment</SelectItem>
              <SelectItem value="past_question">Past Question</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
