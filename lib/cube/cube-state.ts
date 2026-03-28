// Cube state management for 3D visualization

export type FaceColor = 'W' | 'Y' | 'R' | 'O' | 'B' | 'G'

export const COLOR_MAP: Record<FaceColor, string> = {
  W: 'var(--cube-white)',
  Y: 'var(--cube-yellow)',
  R: 'var(--cube-red)',
  O: 'var(--cube-orange)',
  B: 'var(--cube-blue)',
  G: 'var(--cube-green)',
}

// Each face has 9 stickers, indexed 0-8:
// 0 1 2
// 3 4 5
// 6 7 8
export type Face = [FaceColor, FaceColor, FaceColor, FaceColor, FaceColor, FaceColor, FaceColor, FaceColor, FaceColor]

export interface CubeState {
  U: Face // Up (white)
  D: Face // Down (yellow)
  F: Face // Front (green)
  B: Face // Back (blue)
  R: Face // Right (red)
  L: Face // Left (orange)
}

// Create a solved cube state
export function createSolvedCube(): CubeState {
  return {
    U: ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'],
    D: ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
    F: ['G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G'],
    B: ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B'],
    R: ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
    L: ['O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O'],
  }
}

// Rotate a face clockwise
function rotateFaceCW(face: Face): Face {
  return [
    face[6], face[3], face[0],
    face[7], face[4], face[1],
    face[8], face[5], face[2]
  ]
}

// Rotate a face counter-clockwise
function rotateFaceCCW(face: Face): Face {
  return [
    face[2], face[5], face[8],
    face[1], face[4], face[7],
    face[0], face[3], face[6]
  ]
}

// Apply a move to the cube state
export function applyMove(cube: CubeState, move: string): CubeState {
  const newCube = JSON.parse(JSON.stringify(cube)) as CubeState
  const face = move[0] as 'R' | 'L' | 'U' | 'D' | 'F' | 'B'
  const modifier = move.slice(1)
  
  let times = 1
  if (modifier === "'") times = 3
  else if (modifier === "2") times = 2
  
  for (let i = 0; i < times; i++) {
    applyClockwiseMove(newCube, face)
  }
  
  return newCube
}

function applyClockwiseMove(cube: CubeState, face: 'R' | 'L' | 'U' | 'D' | 'F' | 'B') {
  switch (face) {
    case 'R':
      cube.R = rotateFaceCW(cube.R)
      {
        const temp = [cube.F[2], cube.F[5], cube.F[8]]
        cube.F[2] = cube.D[2]; cube.F[5] = cube.D[5]; cube.F[8] = cube.D[8]
        cube.D[2] = cube.B[6]; cube.D[5] = cube.B[3]; cube.D[8] = cube.B[0]
        cube.B[0] = cube.U[8]; cube.B[3] = cube.U[5]; cube.B[6] = cube.U[2]
        cube.U[2] = temp[0]; cube.U[5] = temp[1]; cube.U[8] = temp[2]
      }
      break
    case 'L':
      cube.L = rotateFaceCW(cube.L)
      {
        const temp = [cube.F[0], cube.F[3], cube.F[6]]
        cube.F[0] = cube.U[0]; cube.F[3] = cube.U[3]; cube.F[6] = cube.U[6]
        cube.U[0] = cube.B[8]; cube.U[3] = cube.B[5]; cube.U[6] = cube.B[2]
        cube.B[2] = cube.D[6]; cube.B[5] = cube.D[3]; cube.B[8] = cube.D[0]
        cube.D[0] = temp[0]; cube.D[3] = temp[1]; cube.D[6] = temp[2]
      }
      break
    case 'U':
      cube.U = rotateFaceCW(cube.U)
      {
        const temp = [cube.F[0], cube.F[1], cube.F[2]]
        cube.F[0] = cube.R[0]; cube.F[1] = cube.R[1]; cube.F[2] = cube.R[2]
        cube.R[0] = cube.B[0]; cube.R[1] = cube.B[1]; cube.R[2] = cube.B[2]
        cube.B[0] = cube.L[0]; cube.B[1] = cube.L[1]; cube.B[2] = cube.L[2]
        cube.L[0] = temp[0]; cube.L[1] = temp[1]; cube.L[2] = temp[2]
      }
      break
    case 'D':
      cube.D = rotateFaceCW(cube.D)
      {
        const temp = [cube.F[6], cube.F[7], cube.F[8]]
        cube.F[6] = cube.L[6]; cube.F[7] = cube.L[7]; cube.F[8] = cube.L[8]
        cube.L[6] = cube.B[6]; cube.L[7] = cube.B[7]; cube.L[8] = cube.B[8]
        cube.B[6] = cube.R[6]; cube.B[7] = cube.R[7]; cube.B[8] = cube.R[8]
        cube.R[6] = temp[0]; cube.R[7] = temp[1]; cube.R[8] = temp[2]
      }
      break
    case 'F':
      cube.F = rotateFaceCW(cube.F)
      {
        const temp = [cube.U[6], cube.U[7], cube.U[8]]
        cube.U[6] = cube.L[8]; cube.U[7] = cube.L[5]; cube.U[8] = cube.L[2]
        cube.L[2] = cube.D[0]; cube.L[5] = cube.D[1]; cube.L[8] = cube.D[2]
        cube.D[0] = cube.R[6]; cube.D[1] = cube.R[3]; cube.D[2] = cube.R[0]
        cube.R[0] = temp[0]; cube.R[3] = temp[1]; cube.R[6] = temp[2]
      }
      break
    case 'B':
      cube.B = rotateFaceCW(cube.B)
      {
        const temp = [cube.U[0], cube.U[1], cube.U[2]]
        cube.U[0] = cube.R[2]; cube.U[1] = cube.R[5]; cube.U[2] = cube.R[8]
        cube.R[2] = cube.D[8]; cube.R[5] = cube.D[7]; cube.R[8] = cube.D[6]
        cube.D[6] = cube.L[0]; cube.D[7] = cube.L[3]; cube.D[8] = cube.L[6]
        cube.L[0] = temp[2]; cube.L[3] = temp[1]; cube.L[6] = temp[0]
      }
      break
  }
}

// Apply a sequence of moves
export function applyMoves(cube: CubeState, moves: string[]): CubeState {
  return moves.reduce((state, move) => applyMove(state, move), cube)
}

// Create a scrambled cube from moves
export function createScrambledCube(moves: string[]): CubeState {
  return applyMoves(createSolvedCube(), moves)
}
