import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schemas/main.schema.ts',
  out: './drizzle/main',
  dialect: 'sqlite',
  driver: 'durable-sqlite',
  dbCredentials: {
    url: './data/main.db',
  },
} satisfies Config;
