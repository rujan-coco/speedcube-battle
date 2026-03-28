// Game state types for multiplayer speedcubing

export interface Player {
  id: string
  name: string
  status: PlayerStatus
  currentTime: number | null
  penalty: Penalty
  totalPoints: number
  roundsWon: number
  roundsDraw: number
  inspectionStartTime: number | null
}

export type PlayerStatus = 'waiting' | 'ready' | 'inspecting' | 'solving' | 'done'
export type Penalty = 'none' | '+2' | 'DNF'
export type RoundStatus = 'waiting' | 'ready' | 'solving' | 'complete'

export interface RoundResult {
  roundNumber: number
  player1: {
    id: string
    name: string
    time: number | null
    penalty: Penalty
    finalTime: number | null
    points: number
  }
  player2: {
    id: string
    name: string
    time: number | null
    penalty: Penalty
    finalTime: number | null
    points: number
  }
  winnerId: string | null // null means draw
}

export interface GameState {
  roomCode: string
  players: Player[]
  currentScramble: string
  scrambleMoves: string[]
  roundNumber: number
  roundStatus: RoundStatus
  sessionEnded: boolean
  nextRoundAt: number | null
  roundHistory: RoundResult[]
}

// WebSocket message types
export type ClientMessage =
  | { type: 'join'; name: string }
  | { type: 'ready' }
  | { type: 'start-inspection' }
  | { type: 'start-solve' }
  | { type: 'finish-solve'; time: number; penalty: Penalty }
  | { type: 'end-session' }
  | { type: 'request-new-round' }

export type ServerMessage =
  | { type: 'game-state'; state: GameState }
  | { type: 'player-joined'; player: Player }
  | { type: 'player-left'; playerId: string }
  | { type: 'player-update'; player: Player }
  | { type: 'new-round'; scramble: string; scrambleMoves: string[]; roundNumber: number; roundStatus: RoundStatus }
  | { type: 'round-complete'; result: RoundResult; nextRoundAt: number | null }
  | { type: 'error'; message: string }

// Timer display formatting
export function formatTime(ms: number | null, penalty: Penalty = 'none'): string {
  if (ms === null) return '--:--.--'
  if (penalty === 'DNF') return 'DNF'
  
  const totalMs = penalty === '+2' ? ms + 2000 : ms
  const minutes = Math.floor(totalMs / 60000)
  const seconds = Math.floor((totalMs % 60000) / 1000)
  const centiseconds = Math.floor((totalMs % 1000) / 10)
  
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`
  }
  return `${seconds}.${centiseconds.toString().padStart(2, '0')}`
}

export function getFinalTime(time: number | null, penalty: Penalty): number | null {
  if (time === null || penalty === 'DNF') return null
  return penalty === '+2' ? time + 2000 : time
}

export function calculatePoints(
  player1Time: number | null,
  player1Penalty: Penalty,
  player2Time: number | null,
  player2Penalty: Penalty
): { player1Points: number; player2Points: number; winnerId: 1 | 2 | null } {
  const p1Final = getFinalTime(player1Time, player1Penalty)
  const p2Final = getFinalTime(player2Time, player2Penalty)
  
  // Both DNF = draw
  if (p1Final === null && p2Final === null) {
    return { player1Points: 1, player2Points: 1, winnerId: null }
  }
  
  // One DNF, other wins
  if (p1Final === null) {
    return { player1Points: 0, player2Points: 2, winnerId: 2 }
  }
  if (p2Final === null) {
    return { player1Points: 2, player2Points: 0, winnerId: 1 }
  }
  
  // Both have times - check for draw (within 10ms)
  const diff = Math.abs(p1Final - p2Final)
  if (diff <= 10) {
    return { player1Points: 1, player2Points: 1, winnerId: null }
  }
  
  // Clear winner
  if (p1Final < p2Final) {
    return { player1Points: 2, player2Points: 0, winnerId: 1 }
  } else {
    return { player1Points: 0, player2Points: 2, winnerId: 2 }
  }
}
