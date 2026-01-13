import { tool } from "@opencode-ai/plugin"
import pg from "pg"
const { Pool } = pg

export default tool({
  name: "describe_table",
  description: "Get column information for a database table including column names, types, nullability, and defaults.",
  parameters: {
    table_name: tool.schema.string().describe("Name of the table to describe")
  },
  execute: async ({ table_name }) => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    try {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [table_name])
      return JSON.stringify({
        columns: result.rows.map(r => ({
          name: r.column_name,
          type: r.data_type,
          nullable: r.is_nullable === 'YES',
          default: r.column_default || null
        }))
      }, null, 2)
    } finally {
      await pool.end()
    }
  }
})

