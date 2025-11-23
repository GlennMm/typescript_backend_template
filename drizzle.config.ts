import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schemas/main.schema.ts',
  out: './drizzle/main',
  driver: 'better-sqlite',
  dbCredentials: {
    url: './data/main.db',
  },
} satisfies Config;
