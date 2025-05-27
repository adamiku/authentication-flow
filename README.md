# Authentication Flow

A modern, secure authentication system built with Next.js and TypeScript, featuring both traditional password-based authentication and OAuth integration with multiple providers.

## Features

- 🔐 **Multiple Authentication Methods**

  - Email/Password authentication with secure password hashing
  - OAuth integration with Discord and GitHub
  - Role-based access control (user/admin roles)

- 🛡️ **Security-First Approach**

  - Secure session management
  - PKCE flow for OAuth
  - Protection against CSRF attacks
  - HTTP-only cookies

- 🏗️ **Modern Architecture**

  - Type-safe database operations with Drizzle ORM
  - Database schema migrations
  - Next.js App Router with server components
  - Fully TypeScript implementation

- 🎨 **UI Components**
  - Responsive design with Tailwind CSS
  - Radix UI primitives for accessible components
  - Custom form handling with React Hook Form

## Tech Stack

### Frontend

- **Next.js 15** - React framework with server components
- **React 19** - UI library
- **TypeScript** - Type safety throughout the codebase
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible UI components
- **React Hook Form** - Form validation and handling

### Backend

- **Next.js API Routes** - Server-side functionality
- **Drizzle ORM** - Type-safe database queries
- **Zod** - Schema validation for type safety
- **Supabase PostgreSQL** - Managed Postgres database service

### Authentication

- **Custom Auth System** - Built from scratch for complete control
- **OAuth 2.0 with PKCE** - For Discord and GitHub integration
- **Upstash Redis** - For session management

### Development Tools

- **ESLint** - Code linting
- **Drizzle Kit** - Database schema migrations
- **Turbopack** - Fast development builds

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase PostgreSQL database
- Upstash Redis instance
- OAuth app credentials (for Discord and GitHub)

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/authentication-flow.git
   cd authentication-flow
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env` file based on `.env.example`:

   ```
   # Redis
   REDIS_URL=your-redis-url
   REDIS_TOKEN=your-redis-token

   # Database
   DATABASE_URL=your-supabase-postgres-connection-string

   # OAuth
   OAUTH_REDIRECT_URL_BASE=http://localhost:3000/api/oauth/

   # Discord
   DISCORD_CLIENT_ID=your-discord-client-id
   DISCORD_CLIENT_SECRET=your-discord-client-secret

   # GitHub
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```

4. Run database migrations

   ```bash
   npm run db:migrate
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

## Database Schema

The application uses a PostgreSQL database with the following main tables:

- `users` - Stores user information including roles
- `user_oauth_accounts` - Links users to their OAuth provider accounts

## Authentication Flows

### Password-based Authentication

1. User registers with email, name, and password
2. Password is securely hashed and stored
3. On login, password is verified against stored hash
4. Session is created and stored in Redis

### OAuth Authentication

1. User initiates OAuth login with a provider (Discord/GitHub)
2. PKCE flow is used for added security
3. After successful authorization, provider data is retrieved
4. User is either created or linked with existing account
5. Session is created and stored in Redis

## Deployment

### Production Database

The project uses Supabase PostgreSQL for production, which offers:

- Managed PostgreSQL service
- Row-level security features
- Built-in connection pooling
- Comprehensive dashboard for database management

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure environment variables in the Vercel dashboard
3. Deploy with the following settings:
   - Framework preset: Next.js
   - Build command: `npm run build`
   - Output directory: `.next`

### Environment Variables

Ensure all required environment variables are set in your production environment.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
