import { ChatOllama } from '@langchain/ollama';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { SystemMessage } from '@langchain/core/messages';
import { config } from './config.js';
import { SYSTEM_PROMPT } from './prompts.js';
import { executeSelectQuery } from './tools.js';

const llm = new ChatOllama({
  model: config.ollama.model,
  baseUrl: config.ollama.baseUrl,
  temperature: 0
});

const tools = [executeSelectQuery];

export const agent = createReactAgent({
  llm,
  tools,
  messageModifier: new SystemMessage(SYSTEM_PROMPT)
});

export type AgentInput = {
  message: string;
  sessionId?: string;
};

export type AgentOutput = {
  response: string;
};
