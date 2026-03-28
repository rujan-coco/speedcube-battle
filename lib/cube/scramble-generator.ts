// WCA-style 3x3 scramble generator

const FACES = ['R', 'L', 'U', 'D', 'F', 'B'] as const
const MODIFIERS = ['', "'", '2'] as const

type Face = typeof FACES[number]

// Opposite faces - consecutive moves on these are allowed but 3 in a row are not
const OPPOSITE_FACES: Record<Face, Face> = {
  'R': 'L',
  'L': 'R',
  'U': 'D',
  'D': 'U',
  'F': 'B',
  'B': 'F'
}

// Same axis faces
const SAME_AXIS: Record<Face, Face> = OPPOSITE_FACES

function getRandomFace(exclude: Face[], prevFaces: Face[]): Face {
  const available = FACES.filter(f => !exclude.includes(f))
  
  // If last two moves were on same axis, exclude that axis
  if (prevFaces.length >= 2) {
    const [prev1, prev2] = prevFaces.slice(-2)
    if (prev1 === SAME_AXIS[prev2] || prev1 === prev2) {
      const axisToExclude = [prev1, SAME_AXIS[prev1]]
      const filtered = available.filter(f => !axisToExclude.includes(f))
      if (filtered.length > 0) {
        return filtered[Math.floor(Math.random() * filtered.length)]
      }
    }
  }
  
  return available[Math.floor(Math.random() * available.length)]
}

function getRandomModifier(): string {
  return MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)]
}

export function generateScramble(length: number = 20): { notation: string; moves: string[] } {
  const moves: string[] = []
  const faces: Face[] = []
  
  for (let i = 0; i < length; i++) {
    // Exclude the same face as previous move
    const exclude: Face[] = faces.length > 0 ? [faces[faces.length - 1]] : []
    
    const face = getRandomFace(exclude, faces)
    const modifier = getRandomModifier()
    
    moves.push(`${face}${modifier}`)
    faces.push(face)
  }
  
  return {
    notation: moves.join(' '),
    moves
  }
}

// Parse a move string into face and rotation
export function parseMove(move: string): { face: Face; rotation: number } {
  const face = move[0] as Face
  const modifier = move.slice(1)
  
  let rotation: number
  switch (modifier) {
    case "'":
      rotation = -90
      break
    case '2':
      rotation = 180
      break
    default:
      rotation = 90
  }
  
  return { face, rotation }
}

// Cube colors (WCA standard)
export const CUBE_COLORS = {
  U: '#FFFFFF', // White (top)
  D: '#FFFF00', // Yellow (bottom)
  F: '#00FF00', // Green (front)
  B: '#0000FF', // Blue (back)
  R: '#FF0000', // Red (right)
  L: '#FFA500', // Orange (left)
} as const

export type CubeFace = keyof typeof CUBE_COLORS
