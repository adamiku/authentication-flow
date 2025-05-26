import { env } from "@/data/env/server";
import crypto from "crypto";
import { z } from "zod";
import { Cookies } from "../session";

const STATE_COOKIE_KEY = "oAuthState"
const COOKIE_EXPIRATION_SECONDS = 60 * 10

export class OAuthClient {
    private readonly tokenSchema = z.object({
        access_token: z.string(),
        token_type: z.string(),
    })

    private readonly userSchema = z.object({
        id: z.string(),
        global_name: z.string().optional(),
        username: z.string(),
        email: z.string(),
    })

    private get redirectUrl() {
        return new URL('discord', env.OAUTH_REDIRECT_URL_BASE)
    }

    private async fetchToken(code: string) {
        const response = await fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
            },
            body: new URLSearchParams({
                code,
                redirect_uri: this.redirectUrl.toString(),
                grant_type: "authorization_code",
                client_id: env.DISCORD_CLIENT_ID,
                client_secret: env.DISCORD_CLIENT_SECRET,
            }),
        })
        const rawData = await response.json()
        const {data,success,error} = this.tokenSchema.safeParse(rawData)
        
        if (!success) throw new InvalidTokenError(error)

        return {
            accessToken: data.access_token,
            tokenType: data.token_type,
        }
    }

    async fetchUser(code: string, state: string, cookies: Pick<Cookies, "get" | "set">) {
        const isStateValid = validateState(state, cookies)
        if (!isStateValid) throw new InvalidStateError()
        
        const {accessToken, tokenType} = await this.fetchToken(code)
        
        const response = await fetch("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `${tokenType} ${accessToken}`,
            },
        })
        const rawData = await response.json()
        const {data,success,error} = this.userSchema.safeParse(rawData)
        
        if (!success) throw new InvalidUserError(error)

        return {
            id: data.id,
            email: data.email,
            name: data.global_name ?? data.username,
        }
    }

    createAuthUrl(cookies: Pick<Cookies, "set">): string {
        const state = createState(cookies)
        const url = new URL('https://discord.com/oauth2/authorize')
        url.searchParams.set('client_id', env.DISCORD_CLIENT_ID)
        url.searchParams.set('redirect_uri', this.redirectUrl.toString())
        url.searchParams.set('response_type', 'code')
        url.searchParams.set('scope', 'identify email')
        url.searchParams.set('state', state)
        return url.toString()
    }
}

export class InvalidTokenError extends Error {
    constructor(zodError: z.ZodError) {
        super('Invalid Token')
        this.cause = zodError
    }
}

export class InvalidUserError extends Error {
    constructor(zodError: z.ZodError) {
        super('Invalid User')
        this.cause = zodError
    }
}

export class InvalidStateError extends Error {
    constructor() {
        super('Invalid State')
    }
}

function createState(cookies: Pick<Cookies, "set">) {
    const state = crypto.randomBytes(64).toString("hex").normalize()
    cookies.set(STATE_COOKIE_KEY, state, {
        secure: true,
        httpOnly: true,
        sameSite: "lax",
        expires: Date.now() + COOKIE_EXPIRATION_SECONDS * 1000,
    })
    return state
}

function validateState(state: string, cookies: Pick<Cookies, "get">) {
    const storedState = cookies.get(STATE_COOKIE_KEY)?.value
    return storedState === state
}