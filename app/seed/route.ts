import bcrypt from 'bcrypt';
import postgres from 'postgres';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

// Supabase's pooled POSTGRES_URL (port 6543) runs in transaction mode, which
// can route each statement to a different backend connection. Named prepared
// statements don't survive that, so they must be disabled here.
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require', prepare: false });

async function seedUsers(sqlClient: typeof sql) {
  await sqlClient`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sqlClient`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return sqlClient`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );

  return insertedUsers;
}

async function seedPasswordResetTokens(sqlClient: typeof sql) {
  await sqlClient`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sqlClient`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sqlClient`
    CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx
      ON password_reset_tokens (user_id);
  `;
}

async function seedInvoices(sqlClient: typeof sql) {
  await sqlClient`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sqlClient`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL,
      UNIQUE (customer_id, date)
    );
  `;

  // Older deployments may have this table without the constraint above and
  // may already contain duplicate rows from before ON CONFLICT was keyed
  // correctly. Clean those up before adding the constraint so it's safe to
  // apply on an existing database.
  await sqlClient`
    DELETE FROM invoices a USING invoices b
    WHERE a.ctid < b.ctid
      AND a.customer_id = b.customer_id
      AND a.date = b.date;
  `;
  await sqlClient`
    DO $$ BEGIN
      ALTER TABLE invoices ADD CONSTRAINT invoices_customer_id_date_key UNIQUE (customer_id, date);
    EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
    END $$;
  `;

  const insertedInvoices = await Promise.all(
    invoices.map(
      (invoice) => sqlClient`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
        ON CONFLICT (customer_id, date) DO NOTHING;
      `,
    ),
  );

  return insertedInvoices;
}

async function seedCustomers(sqlClient: typeof sql) {
  await sqlClient`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sqlClient`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;

  const insertedCustomers = await Promise.all(
    customers.map(
      (customer) => sqlClient`
        INSERT INTO customers (id, name, email, image_url)
        VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
        ON CONFLICT (id) DO NOTHING;
      `,
    ),
  );

  return insertedCustomers;
}

async function seedRevenue(sqlClient: typeof sql) {
  await sqlClient`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;

  const insertedRevenue = await Promise.all(
    revenue.map(
      (rev) => sqlClient`
        INSERT INTO revenue (month, revenue)
        VALUES (${rev.month}, ${rev.revenue})
        ON CONFLICT (month) DO NOTHING;
      `,
    ),
  );

  return insertedRevenue;
}

export async function GET() {
  try {
    await sql.begin(async (sqlClient) => {
      await seedUsers(sqlClient);
      await seedPasswordResetTokens(sqlClient);
      await seedCustomers(sqlClient);
      await seedInvoices(sqlClient);
      await seedRevenue(sqlClient);
    });

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    const pgError = error as {
      message?: string;
      code?: string;
      severity_local?: string;
      severity?: string;
      detail?: string;
      hint?: string;
      position?: string;
      stack?: string;
    };

    console.error('Seed failed:', {
      message: pgError.message,
      code: pgError.code,
      severity_local: pgError.severity_local,
      severity: pgError.severity,
      detail: pgError.detail,
      hint: pgError.hint,
      position: pgError.position,
      stack: pgError.stack,
    });

    return Response.json(
      {
        error: pgError.message ?? 'Unknown error',
        code: pgError.code,
        detail: pgError.detail,
        hint: pgError.hint,
      },
      { status: 500 },
    );
  }
}
