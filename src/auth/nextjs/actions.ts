"use server"

import { db } from "@/drizzle/db"
import { OAuthProvider, UserTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"
import {
  comparePasswords,
  generateSalt,
  hashPassword
} from "../core/passwordHasher"
import { createUserSession, removeUserFromSession } from "../core/session"
import { signInSchema, signUpSchema } from "./schemas"
import { getOAuthClient } from "../core/oauth/base"

export async function signIn(unsafeData: z.infer<typeof signInSchema>) {
  const { success, data } = signInSchema.safeParse(unsafeData)

  if (!success) return "Unable to sign in"
  
  const user = await db.query.UserTable.findFirst({
    columns: {password: true, salt: true, id: true, email: true, role: true},
    where: eq(UserTable.email, data.email),
  })

  if (user == null || user.password == null || user.salt == null) return "Unable to sign in"
  
  const isPasswordValid = await comparePasswords({
    hashedPassword: user.password,
    salt: user.salt,
    password: data.password
  })

  if (!isPasswordValid) return "Unable to sign in"

  await createUserSession(user, await cookies())

  redirect("/")
}

export async function signUp(unsafeData: z.infer<typeof signUpSchema>) {
  const { success, data } = signUpSchema.safeParse(unsafeData)

  if (!success) return "Unable to create account"

  const existingUser = await db.query.UserTable.findFirst({
    where: eq(UserTable.email, data.email),
  })

  if (existingUser != null) return "Account already exists for this email"

  try {
    const salt = generateSalt()
    const hashedPassword = await hashPassword(data.password, salt)

    const [user] = await db
      .insert(UserTable)
      .values({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        salt,
      })
      .returning({ id: UserTable.id, role: UserTable.role })

    if (user == null) return "Unable to create account"
    await createUserSession(user, await cookies())
  } catch {
    return "Unable to create account"
  }

  redirect("/")
}

export async function logOut() {
  await removeUserFromSession(await cookies())
  redirect("/")
}

export async function oAuthSignIn(provider: OAuthProvider) {
  const oAuthClient = getOAuthClient(provider)
  const url = oAuthClient.createAuthUrl(await cookies())
  redirect(url)
}
 