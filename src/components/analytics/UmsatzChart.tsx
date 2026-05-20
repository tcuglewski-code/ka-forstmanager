"use client"

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

interface UmsatzChartProps {
  data: { monat: string; umsatz: number }[]
}

const FOREST = "#012d1d"
const LIME = "#A3E635"

export function UmsatzChart({ data }: UmsatzChartProps) {
  return (
    <div className="rounded-2xl p-5 border" style={{
      backgroundColor: "var(--color-surface-container, #ffffff)",
      borderColor: "var(--color-outline-variant, #e5e7eb)",
    }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: FOREST }}>Umsatz-Trend</h3>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="monat" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value: number) => [`${value.toLocaleString("de-DE")} €`, "Umsatz"]}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="umsatz"
              stroke={FOREST}
              strokeWidth={2.5}
              dot={{ fill: LIME, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
