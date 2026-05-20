"use client"

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

const FOREST = "#012d1d"
const LIME = "#A3E635"

interface KapazitaetChartProps {
  data: { monat: string; anzahl: number }[]
}

export function KapazitaetChart({ data }: KapazitaetChartProps) {
  return (
    <div className="rounded-2xl p-5 border" style={{
      backgroundColor: "var(--color-surface-container, #ffffff)",
      borderColor: "var(--color-outline-variant, #e5e7eb)",
    }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: FOREST }}>Unterkunft-Buchungen Trend</h3>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="cap" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={LIME} stopOpacity={0.8} />
                <stop offset="95%" stopColor={LIME} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="monat" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="anzahl" stroke={FOREST} fillOpacity={1} fill="url(#cap)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
