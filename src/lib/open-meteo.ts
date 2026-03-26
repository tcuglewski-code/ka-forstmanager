// Open-Meteo API-Wrapper (kostenlos, kein API-Key nötig)

export interface HistoricalWeatherData {
  latitude: number
  longitude: number
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_sum: number[]
    snowfall_sum: number[]
  }
}

export interface CurrentWeatherData {
  latitude: number
  longitude: number
  current: {
    temperature_2m: number
    precipitation: number
    wind_speed_10m: number
    weather_code: number
    time: string
  }
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_sum: number[]
  }
}

// Historische Wetterdaten für einen Standort (ganzes Jahr)
export async function fetchHistoricalWeather(
  lat: number,
  lon: number,
  year: number
): Promise<HistoricalWeatherData> {
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum&timezone=Europe%2FBerlin`

  const res = await fetch(url, { next: { revalidate: 86400 } })
  if (!res.ok) {
    throw new Error(`Open-Meteo Archive API Fehler: ${res.status}`)
  }
  return res.json()
}

// Aktuelles Wetter + 7-Tage-Vorschau
export async function fetchCurrentWeather(
  lat: number,
  lon: number
): Promise<CurrentWeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=7&timezone=Europe%2FBerlin`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) {
    throw new Error(`Open-Meteo Forecast API Fehler: ${res.status}`)
  }
  return res.json()
}

// WMO Weather Code zu Emoji-Symbol
export function weatherCodeToSymbol(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code <= 48) return '🌫️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌦️'
  return '⛈️'
}

export interface MonatsAggregat {
  monat: number   // 1-12
  label: string   // "Januar" etc.
  tempMinAvg: number | null
  tempMaxAvg: number | null
  niederschlagSumme: number
  frosttage: number
  hitzetage: number
  regentage: number
}

export interface WetterAggregat {
  tempMinAvg: number
  tempMaxAvg: number
  niederschlagGesamt: number
  frosttage: number
  hitzetage: number
  regentage: number
  monate: MonatsAggregat[]
}

const MONATE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"
]

// Aggregation der täglichen Daten zu Jahres- und Monatswerten
export function aggregiereWetterdaten(data: HistoricalWeatherData): WetterAggregat {
  const { time, temperature_2m_max, temperature_2m_min, precipitation_sum } = data.daily

  // Monatliche Buckets vorbereiten
  const monatBuckets: {
    minSumme: number; maxSumme: number; count: number
    niederschlag: number; frosttage: number; hitzetage: number; regentage: number
  }[] = Array.from({ length: 12 }, () => ({
    minSumme: 0, maxSumme: 0, count: 0,
    niederschlag: 0, frosttage: 0, hitzetage: 0, regentage: 0
  }))

  let gesamtMinSumme = 0
  let gesamtMaxSumme = 0
  let totalTage = 0
  let gesamtNiederschlag = 0
  let gesamtFrosttage = 0
  let gesamtHitzetage = 0
  let gesamtRegentage = 0

  for (let i = 0; i < time.length; i++) {
    const monat = new Date(time[i]).getMonth() // 0-11
    const minTemp = temperature_2m_min[i]
    const maxTemp = temperature_2m_max[i]
    const niederschlag = precipitation_sum[i] ?? 0

    if (minTemp == null || maxTemp == null) continue

    monatBuckets[monat].minSumme += minTemp
    monatBuckets[monat].maxSumme += maxTemp
    monatBuckets[monat].count++
    monatBuckets[monat].niederschlag += niederschlag

    if (minTemp < 0) monatBuckets[monat].frosttage++
    if (maxTemp > 30) monatBuckets[monat].hitzetage++
    if (niederschlag > 1) monatBuckets[monat].regentage++

    gesamtMinSumme += minTemp
    gesamtMaxSumme += maxTemp
    totalTage++
    gesamtNiederschlag += niederschlag
    if (minTemp < 0) gesamtFrosttage++
    if (maxTemp > 30) gesamtHitzetage++
    if (niederschlag > 1) gesamtRegentage++
  }

  const monate: MonatsAggregat[] = monatBuckets.map((b, idx) => ({
    monat: idx + 1,
    label: MONATE[idx],
    tempMinAvg: b.count > 0 ? Math.round((b.minSumme / b.count) * 10) / 10 : null,
    tempMaxAvg: b.count > 0 ? Math.round((b.maxSumme / b.count) * 10) / 10 : null,
    niederschlagSumme: Math.round(b.niederschlag * 10) / 10,
    frosttage: b.frosttage,
    hitzetage: b.hitzetage,
    regentage: b.regentage,
  }))

  return {
    tempMinAvg: totalTage > 0 ? Math.round((gesamtMinSumme / totalTage) * 10) / 10 : 0,
    tempMaxAvg: totalTage > 0 ? Math.round((gesamtMaxSumme / totalTage) * 10) / 10 : 0,
    niederschlagGesamt: Math.round(gesamtNiederschlag * 10) / 10,
    frosttage: gesamtFrosttage,
    hitzetage: gesamtHitzetage,
    regentage: gesamtRegentage,
    monate,
  }
}
