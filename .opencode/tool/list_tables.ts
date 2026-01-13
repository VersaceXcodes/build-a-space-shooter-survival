import { tool } from "@opencode-ai/plugin"
import pg from "pg"
const { Pool } = pg

export default tool({
  name: "list_tables",
  description: "List all tables in the project database (public schema). Use this to understand the database structure.",
  parameters: {},
  execute: async () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    try {
      const result = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `)
      return JSON.stringify({
        tables: result.rows.map(r => r.table_name)
      }, null, 2)
    } finally {
      await pool.end()
    }
  }
})

