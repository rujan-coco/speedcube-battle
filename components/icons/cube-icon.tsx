import { cn } from "@/lib/utils"

interface CubeIconProps {
  className?: string
}

export function CubeIcon({ className }: CubeIconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 3D Rubik's cube icon */}
      <g transform="translate(10, 10)">
        {/* Top face - lighter */}
        <polygon
          points="40,0 80,20 40,40 0,20"
          fill="currentColor"
          opacity="0.9"
        />
        {/* Left face - medium */}
        <polygon
          points="0,20 40,40 40,80 0,60"
          fill="currentColor"
          opacity="0.6"
        />
        {/* Right face - darker */}
        <polygon
          points="40,40 80,20 80,60 40,80"
          fill="currentColor"
          opacity="0.3"
        />
        {/* Grid lines */}
        <g stroke="currentColor" strokeWidth="1" opacity="0.5">
          {/* Top face grid */}
          <line x1="13.3" y1="6.7" x2="53.3" y2="26.7" />
          <line x1="26.7" y1="13.3" x2="66.7" y2="33.3" />
          <line x1="13.3" y1="26.7" x2="53.3" y2="6.7" />
          <line x1="26.7" y1="33.3" x2="66.7" y2="13.3" />
          {/* Left face grid */}
          <line x1="0" y1="33.3" x2="40" y2="53.3" />
          <line x1="0" y1="46.7" x2="40" y2="66.7" />
          <line x1="13.3" y1="26.7" x2="13.3" y2="66.7" />
          <line x1="26.7" y1="33.3" x2="26.7" y2="73.3" />
          {/* Right face grid */}
          <line x1="40" y1="53.3" x2="80" y2="33.3" />
          <line x1="40" y1="66.7" x2="80" y2="46.7" />
          <line x1="53.3" y1="26.7" x2="53.3" y2="66.7" />
          <line x1="66.7" y1="33.3" x2="66.7" y2="73.3" />
        </g>
      </g>
    </svg>
  )
}
