"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

const FOREST = "#012d1d"
const LIME = "#A3E635"

interface BundeslandChartProps {
  data: { bundesland: string; anzahl: number }[]
}

export function BundeslandChart({ data }: BundeslandChartProps) {
  return (
    <div className="rounded-2xl p-5 border" style={{
      backgroundColor: "var(--color-surface-container, #ffffff)",
      borderColor: "var(--color-outline-variant, #e5e7eb)",
    }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: FOREST }}>Aufträge nach Bundesland</h3>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={data.slice(0, 10)} margin={{ top: 5, right: 10, left: -10, bottom: 35 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="bundesland" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="anzahl" fill={LIME} stroke={FOREST} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
