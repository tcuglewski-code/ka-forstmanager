import { Map } from "lucide-react"

export default function PlanungPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">Flächenplanung</h1>
      </div>
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-16 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#2C3A1C] flex items-center justify-center mb-4">
          <Map className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">In Entwicklung</h2>
        <p className="text-zinc-500 max-w-md">
          Die Flächenplanung wird in einem zukünftigen Sprint implementiert.
          Hier können Erntemengen, Zeitpläne und Ressourcen für einzelne Flächen geplant werden.
        </p>
      </div>
    </div>
  )
}
