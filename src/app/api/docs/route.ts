import { NextResponse } from 'next/server';
import { openApiSpec } from '@/lib/openapi-spec';
import { withErrorHandler } from "@/lib/api-handler"


/**
 * GET /api/docs
 * Returns OpenAPI 3.0 specification as JSON
 */
export const GET = withErrorHandler(async () => {
  return NextResponse.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
})
