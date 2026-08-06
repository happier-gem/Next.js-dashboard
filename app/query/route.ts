import postgres from 'postgres';

// Supabase's pooled POSTGRES_URL (port 6543) runs in transaction mode, which
// can route each statement to a different backend connection. Named prepared
// statements don't survive that, so they must be disabled here.
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require', prepare: false });

async function listInvoices() {
	const data = await sql`
    SELECT invoices.amount, customers.name
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE invoices.amount = 666;
  `;

	return data;
}

export async function GET() {
  try {
  	return Response.json(await listInvoices());
  } catch (error) {
  	return Response.json({ error }, { status: 500 });
  }
}
