import type * as Party from "partykit/server"
import type { 
  Player, 
  GameState, 
  ClientMessage, 
  ServerMessage, 
  RoundResult,
  Penalty 
} from "../lib/game/types"

// WCA-style scramble generator (inline to avoid import issues in Partykit)
const FACES = ['R', 'L', 'U', 'D', 'F', 'B'] as const
const MODIFIERS = ['', "'", '2'] as const
type Face = typeof FACES[number]

const SAME_AXIS: Record<Face, Face> = {
  'R': 'L', 'L': 'R', 'U': 'D', 'D': 'U', 'F': 'B', 'B': 'F'
}

function generateScramble(length: number = 20): { notation: string; moves: string[] } {
  const moves: string[] = []
  const faces: Face[] = []
  
  for (let i = 0; i < length; i++) {
    const exclude: Face[] = faces.length > 0 ? [faces[faces.length - 1]] : []
    let available = FACES.filter(f => !exclude.includes(f))
    
    if (faces.length >= 2) {
      const [prev1, prev2] = faces.slice(-2)
      if (prev1 === SAME_AXIS[prev2] || prev1 === prev2) {
        const axisToExclude = [prev1, SAME_AXIS[prev1]]
        const filtered = available.filter(f => !axisToExclude.includes(f))
        if (filtered.length > 0) available = filtered
      }
    }
    
    const face = available[Math.floor(Math.random() * available.length)]
    const modifier = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)]
    
    moves.push(`${face}${modifier}`)
    faces.push(face)
  }
  
  return { notation: moves.join(' '), moves }
}

function getFinalTime(time: number | null, penalty: Penalty): number | null {
  if (time === null || penalty === 'DNF') return null
  return penalty === '+2' ? time + 2000 : time
}

function calculatePoints(
  p1Time: number | null, p1Penalty: Penalty,
  p2Time: number | null, p2Penalty: Penalty
): { player1Points: number; player2Points: number; winnerId: 1 | 2 | null } {
  const p1Final = getFinalTime(p1Time, p1Penalty)
  const p2Final = getFinalTime(p2Time, p2Penalty)
  
  if (p1Final === null && p2Final === null) {
    return { player1Points: 1, player2Points: 1, winnerId: null }
  }
  if (p1Final === null) return { player1Points: 0, player2Points: 2, winnerId: 2 }
  if (p2Final === null) return { player1Points: 2, player2Points: 0, winnerId: 1 }
  
  const diff = Math.abs(p1Final - p2Final)
  if (diff <= 10) return { player1Points: 1, player2Points: 1, winnerId: null }
  
  if (p1Final < p2Final) {
    return { player1Points: 2, player2Points: 0, winnerId: 1 }
  } else {
    return { player1Points: 0, player2Points: 2, winnerId: 2 }
  }
}

const ROUND_RESULTS_DELAY_MS = 5000

export default class SpeedcubeServer implements Party.Server {
  state: GameState
  nextRoundTimeout: ReturnType<typeof setTimeout> | null = null
  
  constructor(readonly room: Party.Room) {
    const scramble = generateScramble()
    this.state = {
      roomCode: room.id,
      players: [],
      currentScramble: scramble.notation,
      scrambleMoves: scramble.moves,
      roundNumber: 1,
      roundStatus: 'waiting',
      sessionEnded: false,
      nextRoundAt: null,
      roundHistory: []
    }
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Send current state to new connection
    this.send(conn, { type: 'game-state', state: this.state })
  }

  onClose(conn: Party.Connection) {
    const playerIndex = this.state.players.findIndex(p => p.id === conn.id)
    if (playerIndex !== -1) {
      const player = this.state.players[playerIndex]
      this.state.players.splice(playerIndex, 1)
      this.broadcast({ type: 'player-left', playerId: player.id })
      
      // Reset round if player leaves mid-game
      if (this.state.roundStatus !== 'waiting' && !this.state.sessionEnded) {
        this.clearNextRoundTimeout()
        this.state.roundStatus = 'waiting'
        this.state.nextRoundAt = null
        this.state.players.forEach(p => {
          p.status = 'waiting'
          p.currentTime = null
          p.penalty = 'none'
          p.inspectionStartTime = null
        })
        this.broadcast({ type: 'game-state', state: this.state })
      }
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    const msg: ClientMessage = JSON.parse(message)
    
    switch (msg.type) {
      case 'join':
        this.handleJoin(sender, msg.name)
        break
      case 'ready':
        this.handleReady(sender)
        break
      case 'start-inspection':
        this.handleStartInspection(sender)
        break
      case 'start-solve':
        this.handleStartSolve(sender)
        break
      case 'finish-solve':
        this.handleFinishSolve(sender, msg.time, msg.penalty)
        break
      case 'end-session':
        this.handleEndSession()
        break
      case 'request-new-round':
        this.handleNewRound()
        break
    }
  }

  handleJoin(conn: Party.Connection, name: string) {
    if (this.state.players.length >= 2) {
      this.send(conn, { type: 'error', message: 'Room is full' })
      return
    }

    if (this.state.players.find(p => p.id === conn.id)) {
      return // Already joined
    }

    const player: Player = {
      id: conn.id,
      name: name || `Player ${this.state.players.length + 1}`,
      status: 'waiting',
      currentTime: null,
      penalty: 'none',
      totalPoints: 0,
      roundsWon: 0,
      roundsDraw: 0,
      inspectionStartTime: null
    }

    this.state.players.push(player)

    if (this.state.players.length === 2 && !this.state.sessionEnded) {
      this.state.roundStatus = 'ready'
      this.state.players.forEach(currentPlayer => {
        currentPlayer.status = 'ready'
        currentPlayer.currentTime = null
        currentPlayer.penalty = 'none'
        currentPlayer.inspectionStartTime = null
      })
    }

    this.broadcast({ type: 'player-joined', player })
    this.broadcast({ type: 'game-state', state: this.state })
  }

  handleReady(conn: Party.Connection) {
    const player = this.state.players.find(p => p.id === conn.id)
    if (!player) return

    player.status = 'ready'
    this.broadcast({ type: 'player-update', player })

    // Check if both players are ready
    if (this.state.players.length === 2 && 
        this.state.players.every(p => p.status === 'ready')) {
      this.state.roundStatus = 'ready'
      this.broadcast({ type: 'game-state', state: this.state })
    }
  }

  handleStartInspection(conn: Party.Connection) {
    const player = this.state.players.find(p => p.id === conn.id)
    // Allow starting inspection from 'waiting' or 'ready' status (removed ready-up requirement)
    if (
      !player ||
      this.state.players.length < 2 ||
      (player.status !== 'ready' && player.status !== 'waiting')
    ) return

    player.status = 'inspecting'
    player.inspectionStartTime = Date.now()
    this.broadcast({ type: 'player-update', player })

    // Update round status if at least one player is inspecting/solving
    if (this.state.roundStatus !== 'solving') {
      this.state.roundStatus = 'solving'
      this.broadcast({ type: 'game-state', state: this.state })
    }
  }

  handleStartSolve(conn: Party.Connection) {
    const player = this.state.players.find(p => p.id === conn.id)
    if (!player || player.status !== 'inspecting') return

    player.status = 'solving'
    this.broadcast({ type: 'player-update', player })
  }

  handleFinishSolve(conn: Party.Connection, time: number, penalty: Penalty) {
    const player = this.state.players.find(p => p.id === conn.id)
    if (!player || player.status !== 'solving') return

    player.status = 'done'
    player.currentTime = time
    player.penalty = penalty
    this.broadcast({ type: 'player-update', player })

    // Check if both players are done
    if (this.state.players.length === 2 && 
        this.state.players.every(p => p.status === 'done')) {
      this.completeRound()
    }
  }

  completeRound() {
    const [p1, p2] = this.state.players
    const { player1Points, player2Points, winnerId } = calculatePoints(
      p1.currentTime, p1.penalty,
      p2.currentTime, p2.penalty
    )

    p1.totalPoints += player1Points
    p2.totalPoints += player2Points

    if (winnerId === 1) p1.roundsWon++
    else if (winnerId === 2) p2.roundsWon++
    else {
      p1.roundsDraw++
      p2.roundsDraw++
    }

    const result: RoundResult = {
      roundNumber: this.state.roundNumber,
      player1: {
        id: p1.id,
        name: p1.name,
        time: p1.currentTime,
        penalty: p1.penalty,
        finalTime: getFinalTime(p1.currentTime, p1.penalty),
        points: player1Points
      },
      player2: {
        id: p2.id,
        name: p2.name,
        time: p2.currentTime,
        penalty: p2.penalty,
        finalTime: getFinalTime(p2.currentTime, p2.penalty),
        points: player2Points
      },
      winnerId: winnerId === 1 ? p1.id : winnerId === 2 ? p2.id : null
    }

    this.state.roundHistory.unshift(result)
    this.state.roundStatus = 'complete'
    
    this.clearNextRoundTimeout()

    if (this.state.sessionEnded) {
      this.state.nextRoundAt = null
    } else {
      this.state.nextRoundAt = Date.now() + ROUND_RESULTS_DELAY_MS
      this.nextRoundTimeout = setTimeout(() => {
        this.handleNewRound()
      }, ROUND_RESULTS_DELAY_MS)
    }

    this.broadcast({ type: 'round-complete', result, nextRoundAt: this.state.nextRoundAt })
    this.broadcast({ type: 'game-state', state: this.state })
  }

  handleEndSession() {
    if (this.state.sessionEnded) return

    this.clearNextRoundTimeout()
    this.state.sessionEnded = true
    this.state.nextRoundAt = null
    this.broadcast({ type: 'game-state', state: this.state })
  }

  handleNewRound() {
    if (this.state.sessionEnded) {
      return
    }

    if (this.state.roundStatus !== 'complete' && this.state.roundStatus !== 'waiting') {
      return
    }

    this.clearNextRoundTimeout()

    // Generate new scramble
    const scramble = generateScramble()
    this.state.currentScramble = scramble.notation
    this.state.scrambleMoves = scramble.moves
    this.state.roundNumber++
    this.state.sessionEnded = false
    // Set to 'ready' status since we removed the ready-up feature
    this.state.roundStatus = this.state.players.length === 2 ? 'ready' : 'waiting'
    this.state.nextRoundAt = null

    // Reset players - set to 'ready' if both players present (no ready-up needed)
    this.state.players.forEach(p => {
      p.status = this.state.players.length === 2 ? 'ready' : 'waiting'
      p.currentTime = null
      p.penalty = 'none'
      p.inspectionStartTime = null
    })

    this.broadcast({ 
      type: 'new-round', 
      scramble: scramble.notation, 
      scrambleMoves: scramble.moves,
      roundNumber: this.state.roundNumber,
      roundStatus: this.state.roundStatus
    })
    this.broadcast({ type: 'game-state', state: this.state })
  }

  clearNextRoundTimeout() {
    if (this.nextRoundTimeout !== null) {
      clearTimeout(this.nextRoundTimeout)
      this.nextRoundTimeout = null
    }
  }

  send(conn: Party.Connection, msg: ServerMessage) {
    conn.send(JSON.stringify(msg))
  }

  broadcast(msg: ServerMessage) {
    this.room.broadcast(JSON.stringify(msg))
  }
}

SpeedcubeServer satisfies Party.Worker
