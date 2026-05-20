"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

interface BaumartChartProps {
  data: { baumart: string; menge: number }[]
}

const FOREST = "#012d1d"
const FOREST_MID = "#1b4332"

export function BaumartChart({ data }: BaumartChartProps) {
  return (
    <div className="rounded-2xl p-5 border" style={{
      backgroundColor: "var(--color-surface-container, #ffffff)",
      borderColor: "var(--color-outline-variant, #e5e7eb)",
    }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: FOREST }}>Baumarten-Nachfrage (Stück)</h3>
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <BarChart data={data.slice(0, 8)} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="baumart" type="category" tick={{ fontSize: 11 }} width={80} />
            <Tooltip
              formatter={(value: number) => [value.toLocaleString("de-DE"), "Stück"]}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="menge" fill={FOREST_MID} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
