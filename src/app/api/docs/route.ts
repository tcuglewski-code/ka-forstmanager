import { NextResponse } from 'next/server';
import { openApiSpec } from '@/lib/openapi-spec';

/**
 * GET /api/docs
 * Returns OpenAPI 3.0 specification as JSON
 */
export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
