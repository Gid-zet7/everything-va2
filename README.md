# EverythingVA - AI-Powered Email Client

A modern, full-stack AI-powered email client built with Next.js 14, featuring advanced email management, AI assistance, and subscription-based premium features.

## 🚀 Features

- **AI-Powered Email Management**: Intelligent email processing and responses
- **Modern UI/UX**: Beautiful interface built with Radix UI and Tailwind CSS
- **Authentication**: Secure user authentication with Kinde Auth
- **Database**: PostgreSQL with Prisma ORM for data management
- **Real-time Features**: Live email synchronization and updates
- **Subscription System**: Stripe integration for premium features
- **Responsive Design**: Works seamlessly across all devices
- **Type Safety**: Full TypeScript implementation
- **Performance**: Optimized with Next.js 14 and React 18

## 🛠️ Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **React 18** - UI library with latest features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Smooth animations
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend & Database

- **Prisma ORM** - Database toolkit and ORM
- **PostgreSQL** - Primary database
- **tRPC** - End-to-end typesafe APIs
- **NextAuth.js** - Authentication (via Kinde)
- **Stripe** - Payment processing

### AI & External Services

- **OpenAI API** - AI-powered features
- **Nylas** - Email integration
- **Pinecone** - Vector database for AI
- **AWS SDK** - Cloud services integration

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Turbo** - Fast builds and development

## 📦 Installation

### Prerequisites

- **Node.js** 18.0 or later
- **npm** or **yarn** package manager
- **PostgreSQL** database
- **Git** for version control

### Setup Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/Gid-zet7/everything-va2
   cd everything-va2
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**

   Create a `.env` file in the root directory:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/EverythingVA"

   # Authentication (Kinde)
   KINDE_CLIENT_ID="your_kinde_client_id"
   KINDE_CLIENT_SECRET="your_kinde_client_secret"
   KINDE_ISSUER_URL="https://your-domain.kinde.com"
   KINDE_SITE_URL="http://localhost:3001"
   KINDE_POST_LOGOUT_REDIRECT_URL="http://localhost:3001"
   KINDE_POST_LOGIN_REDIRECT_URL="http://localhost:3001"

   # OpenAI
   OPENAI_API_KEY="your_openai_api_key"

   # Stripe
   STRIPE_SECRET_KEY="your_stripe_secret_key"
   STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key"

   # Nylas (Email Integration)
   NYLAS_API_KEY="your_nylas_api_key"

   # Pinecone (Vector Database)
   PINECONE_API_KEY="your_pinecone_api_key"
   PINECONE_ENVIRONMENT="your_pinecone_environment"
   PINECONE_INDEX_NAME="your_pinecone_index"
   ```

4. **Database Setup**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate dev

   # (Optional) Open Prisma Studio
   npx prisma studio
   ```

5. **Start Development Server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

   The application will be available at [http://localhost:3001](http://localhost:3001)

## 🗄️ Database Management

```bash
# Generate new migration
npm run db:generate

# Deploy migrations to production
npm run db:migrate

# Push schema changes directly
npm run db:push

# Open Prisma Studio
npm run db:studio
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
EverythingVA/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Utility functions and configurations
│   ├── server/              # Server-side API routes
│   └── types/               # TypeScript type definitions
├── prisma/                  # Database schema and migrations
├── public/                  # Static assets
├── components.json          # UI component configuration
├── tailwind.config.ts       # Tailwind CSS configuration
└── package.json             # Dependencies and scripts
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes
- `npm run db:studio` - Open Prisma Studio

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For detailed setup instructions, see [KINDE_SETUP.md](KINDE_SETUP.md)

For issues and questions:

- Create an issue on GitHub
- Check the documentation
- Review the setup guide

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.
