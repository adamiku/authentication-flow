import { userRoles } from "@/drizzle/schema"
import { redisClient } from "@/redis/redis"
import { z } from "zod"
// Seven days in seconds
const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 7
const COOKIE_SESSION_KEY = "session-id"

const sessionSchema = z.object({
  id: z.string(),
  role: z.enum(userRoles),
})

type UserSession = z.infer<typeof sessionSchema>

export type Cookies = {
  set: (
    key: string,
    value: string,
    options: {
      secure?: boolean
      httpOnly?: boolean
      sameSite?: "strict" | "lax"
      expires?: number
    }
  ) => void
  get: (key: string) => { name: string; value: string } | undefined
  delete: (key: string) => void
}

export function getUserFromSession(cookies: Pick<Cookies, "get">) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value
  if (sessionId == null) return null
  return getUserSessionById(sessionId)
}

async function getUserSessionById(sessionId: string) {
  const rawUser = await redisClient.get(`session:${sessionId}`)
  const { success, data: user } = sessionSchema.safeParse(rawUser)
  
  if (!success) return null
  
  return user
}

export async function createUserSession(
  user: UserSession,
  cookies: Pick<Cookies, "set">
) {
  // const sessionId = crypto.randomBytes(512).toString("hex").normalize()
  const randomBytesArray = new Uint8Array(64); // 64 bytes = 512 bits
  crypto.getRandomValues(randomBytesArray); // Uses global Web Crypto API
  const sessionId = Array.from(randomBytesArray).map(b => b.toString(16).padStart(2, '0')).join('');

  // the zod parser ensures that no other properties will be part of the session
  // redis will automatically delete the session after the expiration time
  await redisClient.set(`session:${sessionId}`, sessionSchema.parse(user), {
    ex: SESSION_EXPIRATION_SECONDS,
  })

  setCookie(sessionId, cookies)
}

export async function removeUserFromSession(cookies: Pick<Cookies, "get" | "delete">) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value
  
  if (sessionId == null) return
  
  await redisClient.del(`session:${sessionId}`)

  cookies.delete(COOKIE_SESSION_KEY)
}

export async function updateUserSessionData(
  user: UserSession,
  cookies: Pick<Cookies, "get">
) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value

  if (sessionId == null) return null

  await redisClient.set(`session:${sessionId}`, sessionSchema.parse(user), {
    ex: SESSION_EXPIRATION_SECONDS,
  })
}

export async function updateUserSessionExpiration(
  cookies: Pick<Cookies, "get" | "set">
) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value
  if (sessionId == null) return null

  const user = await getUserSessionById(sessionId)
  if (user == null) return

  await redisClient.set(`session:${sessionId}`, user, {
    ex: SESSION_EXPIRATION_SECONDS,
  })
  setCookie(sessionId, cookies)
}


function setCookie(sessionId: string, cookies: Pick<Cookies, "set">) {
  cookies.set(COOKIE_SESSION_KEY, sessionId, {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    expires: Date.now() + SESSION_EXPIRATION_SECONDS * 1000,
  })
}