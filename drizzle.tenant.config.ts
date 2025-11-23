import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schemas/tenant.schema.ts',
  out: './drizzle/tenant',
  dialect: 'sqlite',
  driver: 'durable-sqlite',
  dbCredentials: {
    url: './data/tenant_template.db',
  },
} satisfies Config;
