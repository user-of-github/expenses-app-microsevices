# AGENTS.md — ai-assistant-service

AI-powered expense consultant using LangChain + Ollama + PostgreSQL.

## Purpose

Provides intelligent consultation about personal expenses through natural language queries. Uses read-only access to the expense database to analyze spending patterns, categories, shops, and payment methods.

## Architecture

- **Framework**: Fastify (TypeScript)
- **LLM**: Ollama (qwen3:1.7b)
- **Agent**: LangChain with ReAct pattern
- **Database**: PostgreSQL 17 (read-only access)

## Key Components

### System Prompt (`src/prompts.ts`)
- Contains full database schema
- Enforces SELECT-only queries (no DDL/DML)
- Restricts conversation to expense-related topics only
- Provides example use cases

### Tools (`src/tools.ts`)
- `execute_select_query` - Executes validated SELECT queries
- **Safety features**:
  - Regex validation blocks INSERT/UPDATE/DELETE/DDL
  - Transaction set to READ ONLY
  - Statement timeout (10s)
  - Result limit (100 rows)

### Agent (`src/agent.ts`)
- LangChain ReAct agent with Ollama LLM
- Uses `execute_select_query` tool
- Temperature 0 for deterministic responses

### API (`src/index.ts`)
- `GET /` - Health check
- `POST /chat` - Chat endpoint
  - Request: `{ message: string }`
  - Response: `{ response: string }`

## Environment Variables

All variables are defined in the **root `.env`** file (same as other services):

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

## Docker Setup

- **Ollama service**: Separate container running Ollama
- **Model**: qwen3:1.7b (lightweight, supports tool calling, 2025 release)
- **Auto-pull**: `ollama-init` service pulls model on first start
- **Networks**: Connected to both `receipts_network` (DB access) and `ai_network` (Ollama)

## Security

1. **SQL Injection Prevention**: Only SELECT queries allowed via regex validation
2. **Read-Only Mode**: Transaction explicitly set to READ ONLY
3. **Query Timeout**: 10-second limit prevents long-running queries
4. **Result Limit**: Maximum 100 rows returned
5. **Topic Restriction**: Agent declines non-expense-related questions

## Example Queries

```bash
# Health check
curl http://localhost:4002/

# Chat
curl -X POST http://localhost:4002/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How much did I spend on groceries last month?"}'
```

## Development

```bash
# Install dependencies
npm install

# Copy env
cp .env.example .env

# Run in dev mode
npm run dev

# Build
npm run build

# Start production
npm start
```

## Database Schema Access

The AI has read-only access to:
- `categories` - Expense categories
- `payment_methods` - Payment methods (cash, card, etc.)
- `retail_chains` - Retail chain names
- `concrete_shops` - Individual shop locations
- `cheques` - Receipt headers with totals
- `cheque_items` - Individual items in receipts
- `reports_procedures_names` - Available report functions

Stored functions:
- `get_monthly_category_report()` - Monthly spending by category
