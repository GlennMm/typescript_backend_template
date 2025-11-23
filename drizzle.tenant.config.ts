import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schemas/tenant.schema.ts',
  out: './drizzle/tenant',
  driver: 'better-sqlite',
  dbCredentials: {
    url: './data/tenant_template.db',
  },
} satisfies Config;
