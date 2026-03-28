"use client"

import { cn } from "@/lib/utils"
import { formatTime, type Player, type PlayerStatus } from "@/lib/game/types"
import { User, Clock, Trophy, CheckCircle2 } from "lucide-react"

interface PlayerPanelProps {
  player: Player | null
  isCurrentPlayer?: boolean
  className?: string
}

export function PlayerPanel({ 
  player, 
  isCurrentPlayer = false,
  className 
}: PlayerPanelProps) {
  if (!player) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-border/50 bg-card/30",
        "min-h-[200px]",
        className
      )}>
        <User className="w-12 h-12 text-muted-foreground/50 mb-2" />
        <p className="text-muted-foreground">Waiting for player...</p>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex flex-col items-center p-6 rounded-xl border bg-card",
      isCurrentPlayer && "ring-2 ring-primary",
      className
    )}>
      {/* Player name */}
      <div className="flex items-center gap-2 mb-4">
        <div className={cn(
          "w-3 h-3 rounded-full",
          getStatusColor(player.status)
        )} />
        <h3 className="text-lg font-semibold">
          {player.name}
          {isCurrentPlayer && <span className="text-xs text-muted-foreground ml-2">(You)</span>}
        </h3>
      </div>

      {/* Current time / Status */}
      <div className="flex flex-col items-center mb-4">
        <div className={cn(
          "text-4xl font-mono font-bold",
          getTimeColor(player)
        )}>
          {getDisplayTime(player)}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {getStatusText(player.status)}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-primary" />
          <span className="font-medium">{player.totalPoints}</span>
          <span className="text-muted-foreground">pts</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{player.roundsWon}</span>
          <span className="text-muted-foreground">wins</span>
        </div>
      </div>
    </div>
  )
}

function getStatusColor(status: PlayerStatus): string {
  switch (status) {
    case 'waiting': return 'bg-muted-foreground'
    case 'ready': return 'bg-primary animate-status-pulse'
    case 'inspecting': return 'bg-[var(--timer-inspection)] animate-status-pulse'
    case 'solving': return 'bg-[var(--timer-running)] animate-status-pulse'
    case 'done': return 'bg-primary'
    default: return 'bg-muted-foreground'
  }
}

function getStatusText(status: PlayerStatus): string {
  switch (status) {
    case 'waiting': return 'Waiting'
    case 'ready': return 'Ready!'
    case 'inspecting': return 'Inspecting...'
    case 'solving': return 'Solving...'
    case 'done': return 'Finished!'
    default: return ''
  }
}

function getDisplayTime(player: Player): string {
  if (player.status === 'done' && player.currentTime !== null) {
    return formatTime(player.currentTime, player.penalty)
  }
  if (player.status === 'solving') {
    return 'Solving...'
  }
  if (player.status === 'inspecting') {
    return 'Inspecting'
  }
  return '--:--.--'
}

function getTimeColor(player: Player): string {
  if (player.status === 'done') {
    if (player.penalty === 'DNF') return 'text-[var(--timer-dnf)]'
    if (player.penalty === '+2') return 'text-[var(--timer-penalty)]'
    return 'text-[var(--timer-running)]'
  }
  if (player.status === 'solving') return 'text-[var(--timer-running)]'
  if (player.status === 'inspecting') return 'text-[var(--timer-inspection)]'
  return 'text-muted-foreground'
}
