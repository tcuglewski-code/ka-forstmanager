"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

const USAGE_DATA = [
  { route: "/api/projekte", calls: 1_842 },
  { route: "/api/auftraege", calls: 1_356 },
  { route: "/api/maengel", calls: 987 },
  { route: "/api/admin/benutzer", calls: 654 },
  { route: "/api/ai/chat", calls: 423 },
]

const BAR_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ec4899", "#8b5cf6"]

export function FeatureUsageWidget() {
  return (
    <div className="bg-[var(--color-surface-container-lowest)] border border-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-1">
        API-Nutzung
      </h2>
      <p className="text-sm text-[var(--color-on-surface-variant)] mb-4">
        Top 5 Routen (letzte 24h)
      </p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={USAGE_DATA}
            layout="vertical"
            margin={{ left: 100, right: 20, top: 5, bottom: 5 }}
          >
            <XAxis
              type="number"
              tick={{ fill: "#71717a", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#2a2a2a" }}
            />
            <YAxis
              type="category"
              dataKey="route"
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value: number) => [`${value} Aufrufe`, "Nutzung"]}
            />
            <Bar dataKey="calls" radius={[0, 4, 4, 0]} barSize={20}>
              {USAGE_DATA.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={BAR_COLORS[index % BAR_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
