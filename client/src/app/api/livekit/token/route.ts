import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    const body = await request.json().catch(() => null) as { batchId?: string } | null;
    const batchId = body?.batchId;
    if (!authorization || !batchId || !/^[0-9a-fA-F]{24}$/.test(batchId)) {
      return NextResponse.json({ error: 'Authentication and a valid classroom are required.' }, { status: 401 });
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) return NextResponse.json({ error: 'Server API is not configured.' }, { status: 500 });

    const authorizationResponse = await fetch(`${apiBaseUrl}/live-classes/classroom-authorize`, {
      method: 'POST',
      headers: { Authorization: authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchId }),
      cache: 'no-store',
    });
    const authorizationData = await authorizationResponse.json().catch(() => null);
    if (!authorizationResponse.ok || !authorizationData?.success) {
      return NextResponse.json({ error: authorizationData?.message || 'You do not have access to this classroom.' }, { status: authorizationResponse.status || 403 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json(
        { error: 'Server misconfigured. LiveKit keys missing.' },
        { status: 500 }
      );
    }

    const room = `gravacademy-Batch-${batchId}`;
    const name = String(authorizationData.data?.name || 'Participant').slice(0, 100);
    const at = new AccessToken(apiKey, apiSecret, {
      identity: `${batchId}-${crypto.randomUUID()}`,
      name,
    });

    at.addGrant({
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({ token, wsUrl });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
