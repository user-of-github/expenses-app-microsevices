const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env variable: ${key}`);
  }
  return value;
};

export const config = {
  port: Number(process.env['AI_SERVICE_PORT']) || 4002,
  ollama: {
    baseUrl: required('OLLAMA_BASE_URL'),
    model: required('OLLAMA_MODEL'),
    // qwen3 thinking mode leaks tool-call JSON into message content with
    // small models - agent loop breaks. Off by default; opt-in via env.
    think: process.env['OLLAMA_THINK'] === 'true'
  },
  db: {
    host: required('POSTGRES_HOST'),
    port: Number(required('POSTGRES_PORT')),
    database: required('POSTGRES_DB'),
    user: required('POSTGRES_USER'),
    password: required('POSTGRES_PASSWORD')
  }
};