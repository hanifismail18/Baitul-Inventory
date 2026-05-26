const JSONBLOB_ID = '019e666f-530a-7b9b-9b00-6944b33d1805';
const JSONBLOB_URL = `https://jsonblob.com/api/jsonBlob/${JSONBLOB_ID}`;

export async function GET() {
  try {
    const res = await fetch(JSONBLOB_URL);
    if (!res.ok) return Response.json({ error: 'sync fetch failed' }, { status: 502 });
    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ error: 'sync unavailable' }, { status: 502 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const res = await fetch(JSONBLOB_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return Response.json({ error: 'sync write failed' }, { status: 502 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'sync unavailable' }, { status: 502 });
  }
}
