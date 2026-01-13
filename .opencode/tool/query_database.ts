import { tool } from "@opencode-ai/plugin"
import pg from "pg"
const { Pool } = pg

export default tool({
  name: "query_database",
  description: "Execute a SQL query against the project database. Use for SELECT, INSERT, UPDATE, DELETE operations. Returns rows and row count.",
  parameters: {
    sql: tool.schema.string().describe("SQL query to execute")
  },
  execute: async ({ sql }) => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    try {
      const result = await pool.query(sql)
      return JSON.stringify({
        success: true,
        rows: result.rows,
        rowCount: result.rowCount ?? 0
      }, null, 2)
    } catch (error) {
      return JSON.stringify({
        success: false,
        rows: [],
        rowCount: 0,
        error: error.message
      }, null, 2)
    } finally {
      await pool.end()
    }
  }
})

