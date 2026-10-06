import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOllama } from '@langchain/ollama';

import { config } from './config.js';
import { SYSTEM_PROMPT } from './prompts.js';
import { executeSelectQuery } from './tools.js';

const llm = new ChatOllama({
  model: config.ollama.model,
  baseUrl: config.ollama.baseUrl,
  temperature: 0,
  // qwen3 thinking: Ollama returns it separately; @langchain/ollama 1.x maps
  // it to additional_kwargs.reasoning_content, keeping `content` a clean
  // final answer and tool calls parsed.
  think: true
});

const tools = [executeSelectQuery];

export const agent = createReactAgent({
  llm,
  tools,
  prompt: SYSTEM_PROMPT
});

export type AgentInput = {
  message: string;
  sessionId?: string;
};

export type AgentOutput = {
  response: string;
};