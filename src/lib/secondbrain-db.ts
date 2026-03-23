import { Pool } from "pg"

const globalForSB = globalThis as any

const pool: Pool =
  globalForSB._sbPool ||
  new Pool({
    connectionString: process.env.SECOND_BRAIN_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
  })

if (process.env.NODE_ENV !== "production") {
  globalForSB._sbPool = pool
}

export async function querySecondBrain(sql: string, params?: any[]): Promise<any[]> {
  const client = await pool.connect()
  try {
    const result = await client.query(sql, params)
    return result.rows
  } finally {
    client.release()
  }
}
