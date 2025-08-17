# Kinde Auth Setup Guide

This project has been migrated from Clerk to Kinde Auth. Follow these steps to set up Kinde Auth:

## 1. Create a Kinde Account

1. Go to [Kinde](https://kinde.com) and create an account
2. Create a new application
3. Configure your application settings

## 2. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Kinde Auth Configuration
KINDE_CLIENT_ID="your-kinde-client-id"
KINDE_CLIENT_SECRET="your-kinde-client-secret"
KINDE_ISSUER_URL="https://your-domain.kinde.com"
KINDE_SITE_URL="http://localhost:3001"
KINDE_POST_LOGOUT_REDIRECT_URL="http://localhost:3001"
KINDE_POST_LOGIN_REDIRECT_URL="http://localhost:3001/mail"

# Client-side Kinde Auth (these should match the server-side values)
NEXT_PUBLIC_KINDE_CLIENT_ID="your-kinde-client-id"
NEXT_PUBLIC_KINDE_ISSUER_URL="https://your-domain.kinde.com"
NEXT_PUBLIC_KINDE_SITE_URL="http://localhost:3001"
```

## 3. Install Webhook Dependencies

Install the required dependencies for JWT verification:

```bash
npm install jwks-rsa jsonwebtoken @types/jsonwebtoken --legacy-peer-deps
```

## 4. Kinde Application Configuration

In your Kinde dashboard:

1. Set the **Allowed callback URLs** to: `http://localhost:3001/api/auth/kinde_callback`
2. Set the **Allowed logout redirect URLs** to: `http://localhost:3001`
3. Set the **Allowed origins** to: `http://localhost:3001`
4. Set up **Webhooks** (optional):
   - Webhook URL: `http://localhost:3001/api/webhooks/kinde`
   - Events to listen for: `user.created`, `user.updated`, `user.deleted`
   - Note: Kinde sends webhook data as JWT tokens, not JSON

## 5. Database Schema

Make sure your database schema includes a `User` table that can store Kinde user information. The user ID from Kinde will be stored in the `id` field.

## 6. Testing

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3001/sign-in` or `http://localhost:3001/sign-up`
3. Test the authentication flow

## 7. Production Deployment

For production, update the URLs in your environment variables to use your production domain instead of `localhost:3001`.

## Key Changes Made

- Replaced Clerk with Kinde Auth throughout the application
- Updated authentication middleware
- Modified API routes to use Kinde session management
- Updated tRPC context to use Kinde user data
- Replaced Clerk components with custom Kinde Auth components

## Troubleshooting

- Make sure all environment variables are properly set
- Check that your Kinde application URLs match your local development setup
- Verify that the database schema supports the user ID format from Kinde
- Check the browser console and server logs for any authentication errors
