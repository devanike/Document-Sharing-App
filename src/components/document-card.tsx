"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Trash2 } from "lucide-react"
import { formatFileSize, formatDate } from "@/lib/utils"
import type { Document } from "../lib/types"

interface DocumentCardProps {
  document: Document
  canDelete?: boolean
  onDelete?: (id: string) => void
  onDownload?: (document: Document) => void
}

export function DocumentCard({ document, canDelete, onDelete, onDownload }: DocumentCardProps) {

  return (
    <Card className="hover:shadow-lg transition-shadow border border-gray-200 rounded-lg p-4 bg-white flex flex-col h-full overflow-hidden">
      <CardHeader className="pb-3 border-b border-gray-100"> 
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0"> 
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <CardTitle className="text-lg font-semibold text-gray-800 break-all overflow-hidden">
              {document.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0"> 
            <Badge variant={document.uploader_role === "admin" ? "default" : "secondary"}>
              {document.uploader_role}
            </Badge>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon" 
                onClick={() => onDelete?.(document.id)}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-grow p-0 px-6">
        {document.description && (
          <p className="text-sm text-gray-700 line-clamp-2 overflow-hidden mb-3"> 
            {document.description}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700 flex-grow"> 
          <div className="overflow-hidden">
            <span className="font-medium text-gray-800">File:</span> {document.file_name}
          </div>
          <div className="overflow-hidden">
            <span className="font-medium text-gray-800">Size:</span> {formatFileSize(document.file_size)}
          </div>
          <div className="overflow-hidden">
            <span className="font-medium text-gray-800">Type:</span> {document.file_type}
          </div>
          <div className="overflow-hidden">
            <span className="font-medium text-gray-800">Uploaded:</span> {formatDate(document.created_at)}
          </div>
          {document.course_code && (
            <div className="overflow-hidden">
              <span className="font-medium text-gray-800">Course:</span> {document.course_code}
            </div>
          )}
          {document.level && (
            <div className="overflow-hidden">
              <span className="font-medium text-gray-800">Level:</span> {document.level}
            </div>
          )}
          {document.semester && (
            <div className="overflow-hidden">
              <span className="font-medium text-gray-800">Semester:</span> {document.semester}
            </div>
          )}
          {document.document_type && (
            <div className="overflow-hidden">
              <span className="font-medium text-gray-800">Type:</span> {document.document_type}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4"> 
          <div className="text-xs text-gray-500">By: {document.uploader?.name || (document as any).profiles?.name || "Unknown"}</div>
          <Button size="lg" onClick={() => onDownload?.(document)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
