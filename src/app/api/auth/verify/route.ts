import { NextResponse } from 'next/server';
import { getAuthState } from '../_utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authenticated = await getAuthState();
    return NextResponse.json({ authenticated });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
