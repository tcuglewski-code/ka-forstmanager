"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"

const COLORS = ["#012d1d", "#1b4332", "#2d6a4f", "#40916c", "#52b788", "#74c69d", "#A3E635", "#d8f3dc"]

interface StatusDonutProps {
  data: { status: string; anzahl: number }[]
  title?: string
}

const FOREST = "#012d1d"

export function StatusDonut({ data, title = "Status-Verteilung" }: StatusDonutProps) {
  return (
    <div className="rounded-2xl p-5 border" style={{
      backgroundColor: "var(--color-surface-container, #ffffff)",
      borderColor: "var(--color-outline-variant, #e5e7eb)",
    }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: FOREST }}>{title}</h3>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="anzahl"
              nameKey="status"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
