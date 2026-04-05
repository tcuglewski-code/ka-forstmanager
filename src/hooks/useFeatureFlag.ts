"use client"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useFeatureFlag(key: string) {
  const { data, error, isLoading } = useSWR(
    `/api/admin/feature-flags?key=${key}`,
    fetcher,
    { refreshInterval: 60000 }
  )
  return {
    enabled: data?.enabled ?? false,
    loading: isLoading,
    error,
  }
}
