import { GraduationCap } from "lucide-react"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

export function Logo({ size = "md", showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  }

  return (
    <div className="flex items-center gap-2">
      <div className="bg-blue-600 text-white p-2 rounded-lg">
        <GraduationCap className={sizeClasses[size]} />
      </div>
      {showText && <span className={`font-bold text-blue-900 ${textSizeClasses[size]}`}>CS DocShare</span>}
    </div>
  )
}
