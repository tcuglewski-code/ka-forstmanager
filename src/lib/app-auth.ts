import { verifyAppToken } from "./app-jwt"

export async function getAppUser(req: Request) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  try {
    const payload = await verifyAppToken(auth.slice(7))
    return payload
  } catch {
    return null
  }
}
