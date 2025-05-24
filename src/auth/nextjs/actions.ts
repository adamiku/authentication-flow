"use server"

import { db } from "@/drizzle/db"
import { UserTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { z } from "zod"
import {
  generateSalt,
  hashPassword
} from "../core/passwordHasher"
import { signUpSchema } from "./schemas"

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
  } catch {
    return "Unable to create account"
  }

  redirect("/")
}
