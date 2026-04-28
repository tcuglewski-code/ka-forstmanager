import { SignJWT, jwtVerify } from "jose"

// JWT-Secret muss mit Login-Route übereinstimmen (die NEXTAUTH_SECRET nutzt)
const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || process.env.APP_JWT_SECRET || "forstmanager-app-secret-2026"
)

export async function signAppToken(payload: object) {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret)
}

export async function verifyAppToken(token: string) {
  const { payload } = await jwtVerify(token, secret)
  return payload
}
