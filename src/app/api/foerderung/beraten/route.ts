import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * DEPRECATED: Dieser Endpunkt ist veraltet.
 * Bitte /api/betriebs-assistent/beraten verwenden.
 * 
 * Redirect zu neuem Endpunkt für Abwärtskompatibilität.
 */

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Redirect: Forward Request an neuen Endpunkt
  const newUrl = new URL('/api/betriebs-assistent/beraten', req.url);
  
  const body = await req.text();
  
  const response = await fetch(newUrl.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Forward relevante Header
      ...Object.fromEntries(
        Array.from(req.headers.entries()).filter(([key]) => 
          ['authorization', 'x-forwarded-for', 'cookie'].includes(key.toLowerCase())
        )
      ),
    },
    body,
  });

  const data = await response.json();
  
  return NextResponse.json(data, { 
    status: response.status,
    headers: {
      'X-Deprecated': 'true',
      'X-Redirect-To': '/api/betriebs-assistent/beraten',
    }
  });
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const newUrl = new URL('/api/betriebs-assistent/beraten', req.url);
  
  const response = await fetch(newUrl.toString(), {
    method: 'GET',
    headers: Object.fromEntries(req.headers.entries()),
  });

  const data = await response.json();
  
  return NextResponse.json(data, { 
    status: response.status,
    headers: {
      'X-Deprecated': 'true',
      'X-Redirect-To': '/api/betriebs-assistent/beraten',
    }
  });
}
