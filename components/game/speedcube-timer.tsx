"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { formatTime, type Penalty } from "@/lib/game/types"
import { Kbd } from "@/components/ui/kbd"

export type TimerState = 'idle' | 'ready' | 'inspection' | 'solving' | 'done'

interface SpeedcubeTimerProps {
  state: TimerState
  onStateChange: (state: TimerState) => void
  onFinish: (time: number, penalty: Penalty) => void
  disabled?: boolean
  className?: string
}

const INSPECTION_TIME = 15000 // 15 seconds
const PENALTY_TIME = 17000 // 17 seconds (DNF after this)

export function SpeedcubeTimer({
  state,
  onStateChange,
  onFinish,
  disabled = false,
  className
}: SpeedcubeTimerProps) {
  const [inspectionTime, setInspectionTime] = useState(0)
  const [solveTime, setSolveTime] = useState(0)
  const [penalty, setPenalty] = useState<Penalty>('none')
  const [spaceHeld, setSpaceHeld] = useState(false)
  
  const solveStartRef = useRef<number>(0)
  const inspectionStartRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)
  const onStateChangeRef = useRef(onStateChange)
  const onFinishRef = useRef(onFinish)

  useEffect(() => {
    onStateChangeRef.current = onStateChange
    onFinishRef.current = onFinish
  }, [onStateChange, onFinish])

  // Update inspection timer
  useEffect(() => {
    if (state !== 'inspection') return

    const updateInspection = () => {
      const elapsed = Date.now() - inspectionStartRef.current
      setInspectionTime(elapsed)

      // Check for penalties
      if (elapsed >= PENALTY_TIME) {
        setPenalty('DNF')
        onStateChangeRef.current('done')
        onFinishRef.current(0, 'DNF')
        return
      }

      rafRef.current = requestAnimationFrame(updateInspection)
    }

    inspectionStartRef.current = Date.now()
    rafRef.current = requestAnimationFrame(updateInspection)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [state])

  // Update solve timer
  useEffect(() => {
    if (state !== 'solving') return

    const updateSolve = () => {
      const elapsed = Date.now() - solveStartRef.current
      setSolveTime(elapsed)
      rafRef.current = requestAnimationFrame(updateSolve)
    }

    solveStartRef.current = Date.now()
    rafRef.current = requestAnimationFrame(updateSolve)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [state])

  const handleAction = useCallback(() => {
    if (disabled) return

    switch (state) {
      case 'ready':
        // Start inspection
        setInspectionTime(0)
        setPenalty('none')
        onStateChangeRef.current('inspection')
        break
      
      case 'inspection':
        // Start solving - check for +2 penalty
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        
        const inspectionElapsed = Date.now() - inspectionStartRef.current
        let newPenalty: Penalty = 'none'
        
        if (inspectionElapsed >= INSPECTION_TIME && inspectionElapsed < PENALTY_TIME) {
          newPenalty = '+2'
        }
        
        setPenalty(newPenalty)
        setSolveTime(0)
        onStateChangeRef.current('solving')
        break
      
      case 'solving':
        // Finish solve
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        
        const finalTime = Date.now() - solveStartRef.current
        setSolveTime(finalTime)
        onStateChangeRef.current('done')
        onFinishRef.current(finalTime, penalty)
        break
    }
  }, [disabled, state, penalty])

  // Handle keyboard events
  useEffect(() => {
    if (disabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return
      e.preventDefault()
      setSpaceHeld(true)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      e.preventDefault()
      setSpaceHeld(false)
      handleAction()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [disabled, handleAction])

  // Get display content
  const getDisplayText = () => {
    switch (state) {
      case 'idle':
        return '--:--.--'
      case 'ready':
        return '0.00'
      case 'inspection':
        const remaining = Math.max(0, Math.ceil((INSPECTION_TIME - inspectionTime) / 1000))
        return inspectionTime >= INSPECTION_TIME ? '+2' : remaining.toString()
      case 'solving':
        return formatTime(solveTime)
      case 'done':
        return formatTime(solveTime, penalty)
    }
  }

  const timerColorClass = 
    state === 'inspection' 
      ? inspectionTime >= INSPECTION_TIME 
        ? 'text-[var(--timer-dnf)]' 
        : 'text-[var(--timer-inspection)]'
      : state === 'solving' 
        ? 'text-[var(--timer-running)]'
        : state === 'done'
          ? penalty === 'DNF' 
            ? 'text-[var(--timer-dnf)]' 
            : penalty === '+2' 
              ? 'text-[var(--timer-penalty)]' 
              : 'text-[var(--timer-running)]'
          : state === 'ready'
            ? 'text-foreground'
            : 'text-muted-foreground'

  const actionHint =
    state === 'ready'
      ? 'start inspection'
      : state === 'inspection'
        ? 'start timer'
        : state === 'solving'
          ? 'stop timer'
          : null

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center select-none",
        !disabled && "cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleAction}
      onTouchEnd={(e) => {
        e.preventDefault()
        handleAction()
      }}
    >
      <div 
        className={cn(
          "text-7xl sm:text-8xl md:text-9xl font-mono font-bold tracking-tight transition-all",
          timerColorClass,
          state === 'solving' && "animate-timer-pulse",
          spaceHeld && "scale-95 opacity-80"
        )}
      >
        {getDisplayText()}
      </div>

      {actionHint && !disabled && (
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-4 py-2 text-sm text-muted-foreground shadow-sm">
          <span>{spaceHeld ? "Release" : "Press"}</span>
          <Kbd className={cn(
            "h-6 min-w-8 rounded-md px-2 text-[11px] uppercase tracking-wide",
            spaceHeld && "bg-primary text-primary-foreground"
          )}>
            Space
          </Kbd>
          <span>or tap to {actionHint}</span>
        </div>
      )}
      
      {/* Subtle state indicator */}
      {state === 'inspection' && (
        <div className="mt-4 text-sm text-[var(--timer-inspection)] uppercase tracking-wider">
          Inspection
        </div>
      )}
      
      {state === 'done' && penalty !== 'none' && (
        <div className={cn(
          "mt-4 text-sm uppercase tracking-wider",
          penalty === 'DNF' ? "text-[var(--timer-dnf)]" : "text-[var(--timer-penalty)]"
        )}>
          {penalty === 'DNF' ? 'Did Not Finish' : '+2 Penalty'}
        </div>
      )}
    </div>
  )
}
