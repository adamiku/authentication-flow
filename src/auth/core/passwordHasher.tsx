import crypto from "crypto"

export function hashPassword(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password.normalize(), salt, 64, (error, hash) => {
      if (error) reject(error)

      resolve(hash.toString("hex").normalize())
    })
  })
}

export function generateSalt() {
  return crypto.randomBytes(16).toString("hex").normalize()
}

export async function comparePasswords({
  hashedPassword,
  salt,
  password
}: {
  hashedPassword: string
  salt: string
  password: string
}): Promise<boolean> {
  const inputHashedPassword = await hashPassword(password, salt)

  // timing safe version, take the same amount of time to prevent timing attack
  return crypto.timingSafeEqual(Buffer.from(hashedPassword), Buffer.from(inputHashedPassword))
}