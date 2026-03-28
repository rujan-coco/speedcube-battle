"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Cube3D, CubeNet } from "./cube-3d"
import { Copy, Check, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ScrambleDisplayProps {
  scramble: string
  scrambleMoves: string[]
  className?: string
  onNewScramble?: () => void
  showNewScrambleButton?: boolean
}

export function ScrambleDisplay({ 
  scramble, 
  scrambleMoves,
  className,
  onNewScramble,
  showNewScrambleButton = false
}: ScrambleDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)

  // Animate through moves on mount
  useEffect(() => {
    if (!isAnimating) {
      setCurrentMoveIndex(scrambleMoves.length)
      return
    }

    setCurrentMoveIndex(0)
    
    const interval = setInterval(() => {
      setCurrentMoveIndex(prev => {
        if (prev >= scrambleMoves.length) {
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, 100)

    return () => clearInterval(interval)
  }, [scrambleMoves, isAnimating])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(scramble)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const visibleMoves = scrambleMoves.slice(0, currentMoveIndex)

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* 3D Cube preview */}
      <div className="flex items-center justify-center">
        <Cube3D 
          scrambleMoves={visibleMoves} 
          size={140}
          animate={false}
        />
      </div>

      {/* 2D Net (optional, smaller) */}
      <CubeNet scrambleMoves={visibleMoves} stickerSize={12} />

      {/* Scramble notation */}
      <div className="flex flex-col items-center gap-2 w-full max-w-md">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">Scramble</h3>
          <Button 
            variant="ghost" 
            size="icon-sm"
            onClick={handleCopy}
            className="h-6 w-6"
          >
            {copied ? (
              <Check className="w-3 h-3 text-primary" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
        </div>
        
        <div className="flex flex-wrap justify-center gap-1 px-4 py-2 bg-secondary/50 rounded-lg font-mono text-sm">
          {scrambleMoves.map((move, index) => (
            <span
              key={index}
              className={cn(
                "px-1 py-0.5 rounded transition-all duration-200",
                index < currentMoveIndex 
                  ? "text-foreground bg-primary/20" 
                  : "text-muted-foreground/50"
              )}
            >
              {move}
            </span>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAnimating(!isAnimating)}
            className="text-xs"
          >
            {isAnimating ? "Skip Animation" : "Replay"}
          </Button>
          
          {showNewScrambleButton && onNewScramble && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNewScramble}
              className="text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              New Scramble
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
