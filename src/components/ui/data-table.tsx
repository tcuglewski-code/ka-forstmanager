'use client'

import { ReactNode } from 'react'
import { TableSkeleton } from './TableSkeleton'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  className?: string
  headerClassName?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  loading?: boolean
  emptyMessage?: string
  rowKey?: (row: T) => string
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  loading,
  emptyMessage = 'Keine Einträge vorhanden',
  rowKey,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-surface-container rounded-lg shadow-sm overflow-hidden">
        <TableSkeleton rows={5} cols={columns.length} />
      </div>
    )
  }

  return (
    <div className="bg-surface-container rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-container-low">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left text-sm font-medium text-on-surface-variant px-4 py-3 ${col.headerClassName || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center text-on-surface-variant py-12 px-4"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={rowKey ? rowKey(row) : i}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`
                    ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-container-lowest'}
                    ${onRowClick ? 'cursor-pointer hover:bg-surface-container-low' : ''}
                    text-on-surface transition-colors
                  `}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-sm ${col.className || ''}`}>
                      {col.render
                        ? col.render(row)
                        : (row[col.key] as ReactNode) ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
