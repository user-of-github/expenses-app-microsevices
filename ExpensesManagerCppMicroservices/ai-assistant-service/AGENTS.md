# AGENTS.md — ai-assistant-service

AI-powered expense consultant using LangChain + Ollama + PostgreSQL.

## Purpose

Provides intelligent consultation about personal expenses through natural language queries. Uses read-only access to the expense database to analyze spending patterns, categories, shops, and payment methods.

## Tech stack

- **TypeScript** (ESM, `module: NodeNext`)
- **Fastify 5** HTTP server
- **LangChain 1.x** (`@langchain/core`, `@langchain/langgraph`, `@langchain/ollama`)
- **Ollama** LLM runtime (default model `qwen3:1.7b`)
- **`pg`** PostgreSQL client
- **`zod`** tool input schemas
- **PostgreSQL 17** (read-only access, shared with receipt-service)
- **ESLint 9** flat config + **perfectionist** import sorting

## Architecture

- **Agent**: LangGraph ReAct agent (`createReactAgent`) driven by `ChatOllama`
- **LLM**: Ollama, `temperature: 0`, `think: true` (qwen3 reasoning kept out of final `content`)
- **Database**: PostgreSQL 17, read-only

## Directory structure

```
ai-assistant-service/
  package.json               # Scripts + deps (dev/build/typecheck/lint/start)
  tsconfig.json              # Strict TS config (ESM, NodeNext, noUncheckedIndexedAccess)
  eslint.config.js           # Flat ESLint config: style + import sorting
  Dockerfile                 # Multi-stage build (node:22-alpine → dist → node dist/index.js)

  src/
    index.ts                 # Entry point: Fastify server, routes, graceful shutdown
    config.ts                # Reads and validates env vars (fails fast if missing)
    agent.ts                 # LangGraph ReAct agent + ChatOllama wiring
    prompts.ts               # SYSTEM_PROMPT: DB schema + rules + response format
    tools.ts                 # execute_select_query tool + pg Pool + SQL validation
```

## Key Components

### System Prompt (`src/prompts.ts`)
- Contains full database schema
- Enforces SELECT-only queries (no DDL/DML)
- Restricts conversation to expense-related topics only
- Provides example use cases
- Forces a final answer that contains only the result, never reasoning or SQL

### Tools (`src/tools.ts`)
- `execute_select_query` — executes validated SELECT queries
- **Safety features**:
  - Regex validation blocks INSERT/UPDATE/DELETE/DDL (`BEGIN READ ONLY` too)
  - Query wrapped as `SELECT * FROM (<sql>) AS _t LIMIT 100`
  - Transaction explicitly started `BEGIN READ ONLY`
  - `SET LOCAL statement_timeout = '10s'`
  - Result limit 100 rows; always `ROLLBACK` (read-only)
  - Pooled `pg.Pool` (`max: 5`, idle 30s, connect 5s)

### Agent (`src/agent.ts`)
- LangGraph `createReactAgent` with `ChatOllama` LLM
- Uses the `execute_select_query` tool
- Temperature 0 for deterministic responses

### API (`src/index.ts`)
- `GET /` — status message → `{ message }`
- `GET /health` — liveness/readiness probe (Kubernetes) → `{ status: 'ok' }`
- `POST /chat` — chat endpoint
  - Request: `{ message: string }`
  - Response: `{ response: string }`
  - `400` when `message` is missing, `500` on empty agent response
- Graceful shutdown on `SIGTERM` / `SIGINT` (closes Fastify, ends pg pool)

## Code style & conventions

Enforced by `eslint.config.js` (warnings) and `tsconfig.json` (errors).

| Element | Rule |
|---------|------|
| Indent | 2 spaces (switch case 1) |
| Quotes | single |
| Semicolons | always |
| Trailing commas | never |
| Max line length | 135 |
| Imports | `perfectionist/sort-imports`: natural asc, case-insensitive, groups builtin → external → internal → parent/sibling/index → side-effect → unknown, 1 blank line between groups |
| Type imports | `@typescript-eslint/consistent-type-imports` — use separate `import type { ... }` lines |
| Files | `lowerCamelCase.ts` |
| Types / interfaces | `PascalCase` |
| Values / functions | `lowerCamelCase` |

## TypeScript config notes

- `"type": "module"` in `package.json` + `module`/`moduleResolution: NodeNext`.
- **Relative imports must use the `.js` extension** (e.g. `import { config } from './config.js';`).
- Strict flags on: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `verbatimModuleSyntax`, `isolatedModules`, `noEmitOnError`.
- `src/**/*` is the only compiled input (`rootDir: ./src`), output to `dist/`.

## Environment Variables

All variables are defined in the **root `.env`** file (shared with the other services):

```bash
AI_SERVICE_PORT=4002
OLLAMA_BASE_URL=http://ollama:11434    # overridden by docker-compose
OLLAMA_MODEL=qwen3:1.7b
POSTGRES_HOST=postgres                  # overridden by docker-compose
POSTGRES_PORT=5432                      # overridden by docker-compose
POSTGRES_DB=expense_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<password>
```

`src/config.ts` reads these at startup and throws if any required var is missing.

## Docker Setup

- **Ollama service**: separate container (`ollama_service`) running Ollama
- **Model**: qwen3:1.7b (lightweight, supports tool calling, 2025 release)
- **Auto-pull**: `ollama-init` service runs `ollama pull` on first start
- **Networks**: connected to both `receipts_network` (DB access) and `ai_network` (Ollama)
- **Depends on**: healthy `postgres`, completed `migration-job`, healthy `ollama`, completed `ollama-init`

## Security

1. **SQL Injection / write prevention**: only SELECT queries allowed via regex validation
2. **Read-Only Mode**: transaction explicitly started `BEGIN READ ONLY`
3. **Query Timeout**: 10-second limit prevents long-running queries
4. **Result Limit**: maximum 100 rows returned
5. **Topic Restriction**: agent declines non-expense-related questions

## Example Queries

```bash
# Health check
curl http://localhost:4002/

# Chat
curl -X POST http://localhost:4002/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How much did I spend on groceries last month?"}'
```

## Build & run

### Docker (recommended)

```bash
cd ..
docker compose --env-file .env up --build ai-assistant-service
```

### Locally

```bash
# Requires root .env loaded into the environment (no .env.example in this service)
npm install
set -a; source ../.env; set +a

npm run dev        # tsx watch src/index.ts
npm run build      # tsc → dist/
npm start          # node dist/index.js
```

### Checks

```bash
npm run typecheck  # tsc --noEmit
npm run lint       # eslint src
npm run lint:fix   # eslint src --fix
```

## Database Schema Access

The AI has read-only access to:
- `categories` — Expense categories
- `payment_methods` — Payment methods (cash, card, etc.)
- `retail_chains` — Retail chain names
- `concrete_shops` — Individual shop locations
- `cheques` — Receipt headers with totals
- `cheque_items` — Individual items in receipts
- `reports_procedures_names` — Available report functions

Stored functions:
- `get_monthly_category_report()` — Monthly spending by category

## Critical rules

1. **Use `.js` extensions on relative imports** — NodeNext ESM requires it.
2. **Use separate `import type { ... }` lines** for type-only imports — enforced by ESLint.
3. **Keep import order** as configured by `perfectionist/sort-imports`, or run `npm run lint:fix`.
4. **Env vars are read only from the root `.env`** — do not add a service-local `.env.example`.
5. **`tsconfig.json` is strict** — all `noUncheckedIndexedAccess` / `noUnused*` violations must be fixed before committing.
6. **Never allow writes to the DB** — the SELECT-only validation, `BEGIN READ ONLY`, timeout and row limit are mandatory safety invariants.
7. **Do not commit `node_modules/`, `dist/`, or `.env`** (see `.gitignore`).