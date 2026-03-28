"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { createScrambledCube, COLOR_MAP, type CubeState, type FaceColor } from "@/lib/cube/cube-state"

interface Cube3DProps {
  scrambleMoves?: string[]
  size?: number
  className?: string
  animate?: boolean
}

export function Cube3D({ 
  scrambleMoves = [], 
  size = 120, 
  className,
  animate = true 
}: Cube3DProps) {
  const cubeState = useMemo(() => {
    return createScrambledCube(scrambleMoves)
  }, [scrambleMoves])

  const stickerSize = size / 3.5
  const gap = size * 0.02
  const faceSize = stickerSize * 3 + gap * 2

  return (
    <div 
      className={cn("flex items-center justify-center", className)}
      style={{ perspective: size * 4 }}
    >
      <div
        className={cn(
          "relative preserve-3d",
          animate && "animate-cube-rotate"
        )}
        style={{
          width: faceSize,
          height: faceSize,
          transformStyle: "preserve-3d",
          transform: "rotateX(-25deg) rotateY(-35deg)",
        }}
      >
        {/* Up face */}
        <CubeFace
          face={cubeState.U}
          transform={`translateZ(${faceSize / 2}px) rotateX(90deg)`}
          stickerSize={stickerSize}
          gap={gap}
        />
        {/* Down face */}
        <CubeFace
          face={cubeState.D}
          transform={`translateZ(${-faceSize / 2}px) rotateX(-90deg)`}
          stickerSize={stickerSize}
          gap={gap}
        />
        {/* Front face */}
        <CubeFace
          face={cubeState.F}
          transform={`translateZ(${faceSize / 2}px)`}
          stickerSize={stickerSize}
          gap={gap}
        />
        {/* Back face */}
        <CubeFace
          face={cubeState.B}
          transform={`translateZ(${-faceSize / 2}px) rotateY(180deg)`}
          stickerSize={stickerSize}
          gap={gap}
        />
        {/* Right face */}
        <CubeFace
          face={cubeState.R}
          transform={`translateX(${faceSize / 2}px) rotateY(90deg)`}
          stickerSize={stickerSize}
          gap={gap}
        />
        {/* Left face */}
        <CubeFace
          face={cubeState.L}
          transform={`translateX(${-faceSize / 2}px) rotateY(-90deg)`}
          stickerSize={stickerSize}
          gap={gap}
        />
      </div>
    </div>
  )
}

interface CubeFaceProps {
  face: CubeState[keyof CubeState]
  transform: string
  stickerSize: number
  gap: number
}

function CubeFace({ face, transform, stickerSize, gap }: CubeFaceProps) {
  const faceSize = stickerSize * 3 + gap * 2

  return (
    <div
      className="absolute grid grid-cols-3 bg-neutral-900 rounded-sm"
      style={{
        width: faceSize,
        height: faceSize,
        padding: gap,
        gap: gap,
        transform,
        transformStyle: "preserve-3d",
        backfaceVisibility: "hidden",
      }}
    >
      {face.map((color, index) => (
        <Sticker key={index} color={color} size={stickerSize} />
      ))}
    </div>
  )
}

interface StickerProps {
  color: FaceColor
  size: number
}

function Sticker({ color, size }: StickerProps) {
  return (
    <div
      className="rounded-[2px] shadow-sm"
      style={{
        width: size,
        height: size,
        backgroundColor: COLOR_MAP[color],
        boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.2)",
      }}
    />
  )
}

// 2D Net display for scramble visualization
interface CubeNetProps {
  scrambleMoves?: string[]
  stickerSize?: number
  className?: string
}

export function CubeNet({ 
  scrambleMoves = [], 
  stickerSize = 16,
  className 
}: CubeNetProps) {
  const cubeState = useMemo(() => {
    return createScrambledCube(scrambleMoves)
  }, [scrambleMoves])

  const gap = Math.max(2, Math.round(stickerSize * 0.12))
  const faceGap = Math.max(6, Math.round(stickerSize * 0.4))
  const faceSize = stickerSize * 3 + gap * 2

  return (
    <div
      className={cn("inline-grid", className)}
      style={{
        gridTemplateColumns: `repeat(4, ${faceSize}px)`,
        gap: faceGap,
      }}
    >
      {/* Row 1: Empty, U, Empty, Empty */}
      <div />
      <NetFace face={cubeState.U} stickerSize={stickerSize} gap={gap} />
      <div />
      <div />
      
      {/* Row 2: L, F, R, B */}
      <NetFace face={cubeState.L} stickerSize={stickerSize} gap={gap} />
      <NetFace face={cubeState.F} stickerSize={stickerSize} gap={gap} />
      <NetFace face={cubeState.R} stickerSize={stickerSize} gap={gap} />
      <NetFace face={cubeState.B} stickerSize={stickerSize} gap={gap} />
      
      {/* Row 3: Empty, D, Empty, Empty */}
      <div />
      <NetFace face={cubeState.D} stickerSize={stickerSize} gap={gap} />
      <div />
      <div />
    </div>
  )
}

function NetFace({ 
  face, 
  stickerSize, 
  gap 
}: { 
  face: CubeState[keyof CubeState]
  stickerSize: number
  gap: number 
}) {
  return (
    <div
      className="grid grid-cols-3 bg-neutral-800 rounded-sm"
      style={{ padding: gap, gap }}
    >
      {face.map((color, index) => (
        <div
          key={index}
          className="rounded-[1px]"
          style={{
            width: stickerSize,
            height: stickerSize,
            backgroundColor: COLOR_MAP[color],
          }}
        />
      ))}
    </div>
  )
}
