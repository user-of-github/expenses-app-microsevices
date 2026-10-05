import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import pg from 'pg';
import type { Pool } from 'pg';
import { config } from './config.js';

const pool: Pool = new pg.Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

const FORBIDDEN_PATTERN =
  /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|EXECUTE|DO|COPY)\b/i;
const SELECT_PATTERN = /^\s*SELECT\b/i;

const MAX_ROWS = 100;

const validateQuery = (sql: string): void => {
  const trimmed = sql.trim().replace(/;$/, '');
  if (FORBIDDEN_PATTERN.test(trimmed)) {
    throw new Error(
      'Forbidden: only SELECT queries are allowed. '
      + 'INSERT/UPDATE/DELETE/DDL are blocked.'
    );
  }
  if (!SELECT_PATTERN.test(trimmed)) {
    throw new Error('Only SELECT queries are allowed.');
  }
};

export const executeSelectQuery = tool(
  async ({ sql }: { sql: string }) => {
    const trimmed = sql.trim().replace(/;$/, '');
    validateQuery(trimmed);

    const client = await pool.connect();
    try {
      await client.query('SET TRANSACTION READ ONLY');
      await client.query('SET statement_timeout = \'10s\'');
      const wrapped = `SELECT * FROM (${trimmed}) AS _t LIMIT ${MAX_ROWS}`;
      const result = await client.query(wrapped);
      if (result.rows.length === 0) {
        return 'Query returned no results.';
      }
      return JSON.stringify(result.rows, null, 2);
    }
    catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return `Query failed: ${message}`;
    }
    finally {
      client.release();
    }
  },
  {
    name: 'execute_select_query',
    description:
      'Execute a read-only SELECT SQL query against the expenses PostgreSQL database. '
      + 'Use this tool to retrieve expense data, receipts, categories, shops, payment methods, '
      + 'and any analytical queries. You may also call stored procedures like '
      + 'get_monthly_category_report() using SELECT * FROM get_monthly_category_report(). '
      + 'Only SELECT statements are allowed. Results are limited to 100 rows.',
    schema: z.object({
      sql: z
        .string()
        .describe('The SELECT SQL query to execute')
    })
  }
);

export { pool };
