/**
 * Re-export the OpenAPI spec from swagger.ts
 * This module exists for backward-compatibility with the /api/docs route
 * which imports from '@/lib/openapi-spec'.
 */
export { openApiSpec } from "./swagger";
