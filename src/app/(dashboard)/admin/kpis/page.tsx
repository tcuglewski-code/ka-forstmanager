"use client"

import { useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, Users, FolderOpen, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

type Period = "7d" | "30d" | "90d"

// Dummy time-series data generators
function generateData(period: Period) {
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90
  const now = new Date()
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - (days - 1 - i))
    const label = date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
    })
    return {
      date: label,
      mrr: 2000 + Math.floor(Math.random() * 900 + i * 5),
      mau: 8 + Math.floor(Math.random() * 8),
      projects: 5 + Math.floor(Math.random() * 6),
    }
  })
}

function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  color,
}: {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  trend?: string
  color: string
}) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: color + "20" }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend && (
          <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <p className="text-sm text-zinc-500 mb-1">{title}</p>
      <p className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>{value}</p>
    </div>
  )
}

export default function KpiDashboardPage() {
  const [period, setPeriod] = useState<Period>("30d")
  const data = generateData(period)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2C3A1C] flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>KPI Dashboard</h1>
            <p className="text-sm text-zinc-500">Business Metriken</p>
          </div>
        </div>
        {/* Period Selector */}
        <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1">
          {(["7d", "30d", "90d"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                period === p
                  ? "bg-emerald-600 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-[#2a2a2a]"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="MRR"
          value={"\u20AC2.450"}
          icon={TrendingUp}
          trend="+12%"
          color="#10b981"
        />
        <KpiCard
          title="MAU (Monthly Active Users)"
          value="12"
          icon={Users}
          trend="+3"
          color="#6366f1"
        />
        <KpiCard
          title="Aktive Projekte"
          value="8"
          icon={FolderOpen}
          color="#f59e0b"
        />
      </div>

      {/* MRR Chart */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          MRR Verlauf
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#71717a", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#2a2a2a" }}
              />
              <YAxis
                tick={{ fill: "#71717a", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#2a2a2a" }}
                tickFormatter={(v: number) => `\u20AC${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="mrr"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#10b981" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MAU Chart */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Aktive Nutzer
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#71717a", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#2a2a2a" }}
              />
              <YAxis
                tick={{ fill: "#71717a", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#2a2a2a" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="mau"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#6366f1" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
