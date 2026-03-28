"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import PartySocket from "partysocket"
import type { GameState, ClientMessage, ServerMessage, Player, RoundResult } from "../game/types"

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999"

interface UseGameSocketOptions {
  roomCode: string
  playerName: string
  onRoundComplete?: (result: RoundResult) => void
}

interface UseGameSocketReturn {
  gameState: GameState | null
  isConnected: boolean
  error: string | null
  currentPlayer: Player | null
  opponent: Player | null
  sendReady: () => void
  sendStartInspection: () => void
  sendStartSolve: () => void
  sendFinishSolve: (time: number, penalty: 'none' | '+2' | 'DNF') => void
  endSession: () => void
  requestNewRound: () => void
}

function applyRoundResult(state: GameState, result: RoundResult, nextRoundAt: number | null): GameState {
  const existingResultIndex = state.roundHistory.findIndex(
    round => round.roundNumber === result.roundNumber
  )
  const roundHistory = existingResultIndex === -1
    ? [result, ...state.roundHistory]
    : state.roundHistory.map(round => round.roundNumber === result.roundNumber ? result : round)

  return {
    ...state,
    roundStatus: 'complete',
    nextRoundAt,
    roundHistory,
    players: state.players.map(player => {
      const playerResult =
        result.player1.id === player.id
          ? result.player1
          : result.player2.id === player.id
            ? result.player2
            : null

      if (!playerResult) return player

      return {
        ...player,
        status: 'done',
        currentTime: playerResult.time,
        penalty: playerResult.penalty,
        totalPoints: player.totalPoints + playerResult.points,
        roundsWon: player.roundsWon + (result.winnerId === player.id ? 1 : 0),
        roundsDraw: player.roundsDraw + (result.winnerId === null ? 1 : 0),
      }
    }),
  }
}

export function useGameSocket({ 
  roomCode, 
  playerName,
  onRoundComplete 
}: UseGameSocketOptions): UseGameSocketReturn {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<PartySocket | null>(null)
  const playerIdRef = useRef<string | null>(null)

  useEffect(() => {
    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: roomCode.toLowerCase(),
    })

    socketRef.current = socket

    socket.addEventListener("open", () => {
      setIsConnected(true)
      setError(null)
      playerIdRef.current = socket.id
      // Auto-join on connect
      const joinMsg: ClientMessage = { type: "join", name: playerName }
      socket.send(JSON.stringify(joinMsg))
    })

    socket.addEventListener("message", (event) => {
      const msg: ServerMessage = JSON.parse(event.data)
      
      switch (msg.type) {
        case "game-state":
          setGameState(msg.state)
          break
        case "player-joined":
          setGameState(prev => prev ? {
            ...prev,
            players: [...prev.players.filter(p => p.id !== msg.player.id), msg.player]
          } : null)
          break
        case "player-left":
          setGameState(prev => prev ? {
            ...prev,
            players: prev.players.filter(p => p.id !== msg.playerId)
          } : null)
          break
        case "player-update":
          setGameState(prev => prev ? {
            ...prev,
            players: prev.players.map(p => 
              p.id === msg.player.id ? msg.player : p
            )
          } : null)
          break
        case "new-round":
          setGameState(prev => prev ? {
            ...prev,
            currentScramble: msg.scramble,
            scrambleMoves: msg.scrambleMoves,
            roundNumber: msg.roundNumber,
            roundStatus: msg.roundStatus,
            sessionEnded: false,
            nextRoundAt: null,
            players: prev.players.map(player => ({
              ...player,
              status: prev.players.length === 2 ? 'ready' : 'waiting',
              currentTime: null,
              penalty: 'none',
              inspectionStartTime: null,
            })),
          } : null)
          break
        case "round-complete":
          setGameState(prev => prev ? applyRoundResult(prev, msg.result, msg.nextRoundAt) : null)
          onRoundComplete?.(msg.result)
          break
        case "error":
          setError(msg.message)
          break
      }
    })

    socket.addEventListener("close", () => {
      setIsConnected(false)
    })

    socket.addEventListener("error", () => {
      setError("Connection error")
      setIsConnected(false)
    })

    return () => {
      socket.close()
    }
  }, [roomCode, playerName, onRoundComplete])

  const send = useCallback((msg: ClientMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg))
    }
  }, [])

  const sendReady = useCallback(() => send({ type: "ready" }), [send])
  const sendStartInspection = useCallback(() => send({ type: "start-inspection" }), [send])
  const sendStartSolve = useCallback(() => send({ type: "start-solve" }), [send])
  const sendFinishSolve = useCallback((time: number, penalty: 'none' | '+2' | 'DNF') => 
    send({ type: "finish-solve", time, penalty }), [send])
  const endSession = useCallback(() => send({ type: "end-session" }), [send])
  const requestNewRound = useCallback(() => send({ type: "request-new-round" }), [send])

  const currentPlayer = gameState?.players.find(p => p.id === playerIdRef.current) || null
  const opponent = gameState?.players.find(p => p.id !== playerIdRef.current) || null

  return {
    gameState,
    isConnected,
    error,
    currentPlayer,
    opponent,
    sendReady,
    sendStartInspection,
    sendStartSolve,
    sendFinishSolve,
    endSession,
    requestNewRound,
  }
}
