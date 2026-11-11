type SignupRecord = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  city?: string;
  verification_status?: string;
};

function jsonResponse(body: Record<string, string>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function matchesSecret(received: string, expected: string): boolean {
  if (received.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < received.length; index += 1) {
    difference |= received.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const expectedSecret = Deno.env.get('SUPABASE_DB_WEBHOOK_SECRET');
  const receivedSecret = request.headers.get('x-webhook-secret') ?? '';
  if (!expectedSecret || !matchesSecret(receivedSecret, expectedSecret)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let payload: {
    type?: string;
    table?: string;
    schema?: string;
    record?: SignupRecord;
  };
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid payload' }, 400);
  }

  const record = payload.record;
  if (payload.type !== 'INSERT' || payload.table !== 'profiles' || payload.schema !== 'public') {
    return jsonResponse({ status: 'ignored' }, 200);
  }
  if (!record || record.verification_status !== 'pending' || !['buyer', 'seller'].includes(record.role ?? '')) {
    return jsonResponse({ status: 'ignored' }, 200);
  }

  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('RESEND_FROM_EMAIL');
  const to = Deno.env.get('ADMIN_NOTIFICATION_EMAIL') ?? 'carmenamoussouga@gmail.com';
  if (!apiKey || !from) {
    console.error('Admin signup notification is missing Resend configuration.');
    return jsonResponse({ error: 'Email notification is not configured' }, 500);
  }

  const roleLabel = record.role === 'seller' ? 'Producteur' : 'Acheteur';
  const text = [
    'Nouvelle inscription sur CuniMarket',
    '',
    `Compte : ${roleLabel}`,
    `Nom : ${record.name || 'Non renseigné'}`,
    `Email : ${record.email || 'Non renseigné'}`,
    `Ville : ${record.city || 'Non renseignée'}`,
    '',
    'Ce compte est en attente. Connectez-vous à l’espace administrateur pour l’approuver ou le refuser.',
    'Ouvrez la section « Comptes & accès » dans le panneau admin.',
  ].join('\n');

  let response: Response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `cunimarket-signup-${record.id ?? record.email ?? crypto.randomUUID()}`,
      },
      body: JSON.stringify({ from, to: [to], subject: `Inscription à valider — ${roleLabel}`, text }),
    });
  } catch (error) {
    console.error('Resend request failed:', error);
    return jsonResponse({ error: 'Email notification delivery failed' }, 502);
  }

  if (!response.ok) {
    console.error('Resend rejected the admin notification:', response.status, await response.text());
    return jsonResponse({ error: 'Email notification delivery failed' }, 502);
  }

  return jsonResponse({ status: 'sent' }, 200);
});
