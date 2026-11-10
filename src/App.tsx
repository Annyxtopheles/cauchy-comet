import React from 'react'
import { Flame } from 'lucide-react'

export function App() {
  return (
    <div className="min-h-screen bg-space-950 text-white flex items-center justify-center">
      <div className="flex items-center gap-3">
        <Flame className="w-8 h-8 text-amber-fire" />
        <h1 className="text-2xl font-bold tracking-tight">Cauchy's Comet: The Burning Activity Calendar</h1>
      </div>
    </div>
  )
}

export default App
