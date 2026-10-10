# _AI Assistant Microservice_  
___  
## _Tech stack:_  
- _[Fastify](https://fastify.dev/)_  
- _[TypeScript](https://www.typescriptlang.org/)_  
- _[LangChain.js (ReAct agent)](https://js.langchain.com/)_  
- _[Ollama (qwen3:1.7b)](https://ollama.com/)_  
- _[PostgreSQL (read-only access to postgres-service)](https://www.postgresql.org/)_  
___  
## _Flow_
- User sends natural-language question to `/chat`  
- LangChain ReAct agent plans the answer via Ollama LLM  
- Agent generates SELECT query and calls `execute_select_query` tool  
- Tool validates query, executes it in READ ONLY transaction, returns rows  
- Agent composes human-readable answer  

## _TEST:_  
After launching via Docker-compose:    
```bash
curl -X POST http://localhost:4002/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How much did I spend on groceries last month?"}'
```  

## _Advantage_
Ask your expense database in plain English - no SQL knowledge needed.  
LLM has no direct DB access - every query goes through tool validation:  
- Only SELECT queries (regex check, no DDL/DML)  
- READ ONLY transaction  
- 10s statement timeout  
- 100 rows result limit  
___  
