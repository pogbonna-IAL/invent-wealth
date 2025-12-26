# InventWealth - Fractional Property Ownership Platform

A production-grade, open-source web application for fractional property ownership investment that distributes shortlet rental income to fractional owners.

**Status**: ✅ Fully functional with comprehensive seed data. Ready for local development, testing, and deployment.

📖 **Deployment Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for Railway and VPS deployment instructions.

## Features

- **Fractional Ownership**: Invest in premium properties by purchasing shares
- **Income Distribution**: Receive monthly distributions from shortlet rental income proportional to your share ownership
- **Investor Dashboard**: Track your portfolio, investments, income, and property performance
- **Property Management**: Browse available properties, view income statements, and access documents
- **Authentication**: Secure email magic link authentication via NextAuth

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js (Auth.js) with email magic links
- **Validation**: Zod + React Hook Form
- **Charts**: Recharts
- **Testing**: Playwright
- **Containerization**: Docker + docker-compose

## Prerequisites

- Node.js 20+ and npm
- PostgreSQL 17+ (or use Docker)
- SMTP server for email (for authentication)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd invent-wealth
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Copy `.env.example` to `.env` and fill in your configuration:

```bash
cp .env.example .env
```

**Required environment variables:**
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Your application URL (e.g., `http://localhost:3000`)
- `NEXTAUTH_SECRET`: Secret key for NextAuth (generate with `openssl rand -base64 32`)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`: SMTP configuration for email

**Optional environment variables:**
- `SMTP_FROM`: From email address (defaults to `noreply@inventwealth.com`)
- `NEXT_PUBLIC_APP_URL`: Public URL for email links (defaults to `NEXTAUTH_URL`)
- `UNDER_WRITER_EMAIL`: System user email for unsold shares (defaults to `under_writer@system.inventwealth.com`)
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`: Push notification configuration (see [Push Notifications](#push-notifications))
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: Public VAPID key exposed to client (should match `VAPID_PUBLIC_KEY`)

For a complete list of all environment variables, see the `.env.example` file.

### Push Notifications (Optional)

The application supports push notifications for real-time updates. To enable push notifications:

1. **Generate VAPID keys:**
   ```bash
   npm install -g web-push
   web-push generate-vapid-keys
   ```

2. **Add the keys to your `.env` file:**
   ```bash
   VAPID_PUBLIC_KEY=<your-public-key>
   VAPID_PRIVATE_KEY=<your-private-key>
   VAPID_SUBJECT=mailto:admin@inventwealth.com
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=<same-as-VAPID_PUBLIC_KEY>
   ```

3. **Enable notifications in user settings:**
   - Users can enable push notifications from Settings → Notifications
   - Notifications are automatically sent for:
     - New distribution declarations
     - Payout status updates (when marked as PAID)

**Note:** Push notifications are optional. The application will work without them, but users won't receive real-time updates.

### Development Login Credentials

In development mode (`NODE_ENV=development`), you can use the following credentials to log in:

**Admin Login:**
- **Email/Username:** `admin`
- **Password:** `admin123`
- **Role:** ADMIN (full access to admin panel)
- **Email:** `pogbonna@gmail.com`

**Regular User Login:**
- Any email/password combination will work in dev mode
- Creates a new INVESTOR user if the email doesn't exist
- Example: `test@example.com` / `password123`

The dev login tab will automatically appear on the sign-in page when running in development mode. The admin user is automatically created on first login with admin/admin123 credentials.

### 4. Setup database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database with sample data
# This will create test users, properties, and the admin user (pogbonna@gmail.com)
npx prisma db seed
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Docker Setup

### Prerequisites

- Docker and Docker Compose installed
- `.env` file configured (copy from `.env.example`)

### Using Docker Compose (Production)

1. Copy `.env.example` to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: Will be set automatically from docker-compose
- `NEXTAUTH_URL`: Your application URL (e.g., `http://localhost:3000`)
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `SMTP_*`: SMTP configuration for email authentication

2. Build and start containers:

```bash
docker-compose up -d
```

3. Run database migrations and generate Prisma Client:

```bash
# Generate Prisma Client
docker-compose exec app npx prisma generate

# Run migrations
docker-compose exec app npx prisma migrate deploy

# (Optional) Seed database with sample data
docker-compose exec app npx prisma db seed
```

4. Check application health:

```bash
curl http://localhost:3000/api/health
```

5. Access the application at [http://localhost:3000](http://localhost:3000)

### Using Docker Compose (Development)

For local development with hot reload:

```bash
# Use development compose file
docker-compose -f docker-compose.dev.yml up

# Or run in background
docker-compose -f docker-compose.dev.yml up -d
```

The development setup will:
- Automatically install dependencies
- Generate Prisma Client
- Run migrations
- Start the dev server with hot reload

### Docker Commands

```bash
# Start services (production)
docker-compose up -d

# Start services (development)
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f app

# View database logs
docker-compose logs -f postgres

# Stop services
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v

# Rebuild containers
docker-compose build --no-cache

# Execute commands in app container
docker-compose exec app <command>

# Example: Open Prisma Studio
docker-compose exec app npx prisma studio

# Example: Run migrations
docker-compose exec app npx prisma migrate deploy

# Example: Seed database
docker-compose exec app npx prisma db seed
```

### Database Migrations

Migrations are **not** automatically run on container startup. You need to run them manually:

```bash
# Generate Prisma Client (required after schema changes)
docker-compose exec app npx prisma generate

# Run pending migrations
docker-compose exec app npx prisma migrate deploy

# Create a new migration (development)
docker-compose exec app npx prisma migrate dev --name migration-name

# Reset database (⚠️ deletes all data, development only)
docker-compose exec app npx prisma migrate reset
```

### Seeding Database

To seed the database with sample data (includes admin user and test data):

```bash
docker-compose exec app npx prisma db seed
```

Or set `SEED_DATABASE=true` in your `.env` file (if using entrypoint script).

**Note:** The seed script creates an admin user with email `pogbonna@gmail.com`. You can log in using the dev credentials (`admin`/`admin123`) after seeding.

### Health Check

The application includes a health check endpoint at `/api/health`:

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

## Architecture Overview

InventWealth is built using Next.js 16 with the App Router, following a modern full-stack architecture pattern:

### Frontend Architecture

- **Next.js App Router**: File-based routing with Server Components by default
- **React Server Components**: Most pages are server-rendered for optimal performance
- **Client Components**: Used only when interactivity is needed (forms, charts, modals)
- **TypeScript**: Full type safety across the application
- **Tailwind CSS + shadcn/ui**: Utility-first styling with accessible component library

### Backend Architecture

- **Server Actions**: Next.js Server Actions for form submissions and mutations (`app/actions/`)
- **API Routes**: RESTful API endpoints for client-side interactions (`app/api/`)
- **Service Layer**: Business logic separated into service classes (`server/services/`)
- **Database Layer**: Prisma ORM for type-safe database access (`server/db/`)

### Authentication & Authorization

- **NextAuth.js (Auth.js)**: Email magic link authentication
- **Edge-Compatible Auth**: Separate auth config for Edge runtime (`server/auth/edge.ts`)
- **Role-Based Access Control**: User roles (INVESTOR, ADMIN) enforced via middleware
- **Session Management**: JWT-based sessions with database persistence

### Data Flow

1. **User Request** → Next.js Route Handler or Server Component
2. **Authentication Check** → `proxy.ts` middleware validates session
3. **Authorization** → Service layer checks user permissions
4. **Business Logic** → Service classes handle domain logic
5. **Database Access** → Prisma Client executes queries
6. **Response** → Server Component renders or API returns JSON

### Key Design Patterns

- **Service Layer Pattern**: Business logic encapsulated in service classes
- **Repository Pattern**: Prisma abstracts database access
- **Content Management**: Marketing content loaded from JSON files (`content/`)
- **Type Safety**: End-to-end TypeScript with Prisma-generated types

### Security

- **CSRF Protection**: Built into Next.js Server Actions
- **SQL Injection Prevention**: Prisma parameterized queries
- **XSS Protection**: React's built-in escaping
- **Authentication**: Secure session management via NextAuth
- **Authorization**: Role-based access control at route and service level

## Project Structure

```
invent-wealth/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (REST endpoints)
│   ├── actions/           # Server Actions (form mutations)
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Investor dashboard
│   ├── admin/             # Admin portal (role-protected)
│   ├── properties/        # Property listing and details
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── auth/             # Authentication components
│   ├── investment/       # Investment-related components
│   └── layout/           # Layout components
├── server/               # Server-side code
│   ├── auth/            # NextAuth configuration
│   │   ├── config.ts    # Main auth config (Node.js runtime)
│   │   └── edge.ts      # Edge-compatible auth (for proxy.ts)
│   ├── db/              # Database client (Prisma)
│   └── services/        # Business logic services
├── prisma/              # Prisma schema and migrations
│   ├── schema.prisma    # Database schema definition
│   └── seed.ts          # Database seeding script
├── content/             # Editable marketing content (JSON)
│   ├── home.json        # Homepage content
│   ├── about.json       # About page content
│   └── faq.json         # FAQ content
├── lib/                 # Shared utilities
│   ├── content.ts       # Content loader utility
│   └── utils.ts         # General utilities
├── public/              # Static assets
└── types/              # TypeScript type definitions
```

## Content Management

Marketing content is stored in JSON files in the `content/` directory, making it easy to edit without code changes:

- `content/home.json` - Homepage hero, features, and CTA content
- `content/about.json` - About page content (mission, values, etc.)
- `content/faq.json` - FAQ questions and answers

To edit content:
1. Open the relevant JSON file in `content/`
2. Edit the content structure (maintain JSON format)
3. Save the file - changes will be reflected on the next page load

The content loader (`lib/content.ts`) caches content for performance. In development, restart the server to see changes.

## Database Schema

The application uses the following main models:

- **User**: User accounts (integrated with NextAuth)
- **Property**: Properties available for fractional ownership
- **Share**: User share ownership in properties
- **Investment**: Investment transactions
- **IncomeStatement**: Monthly income statements for properties
- **Distribution**: Income distributions to investors
- **Document**: Property and user documents

## Key Features Implementation

### Fractional Ownership

- Each property has a fixed number of shares (e.g., 100,000)
- Users purchase shares at a set price per share
- Minimum investment requirements per property
- Funding progress tracking and status (OPEN, FUNDED, CLOSED)

### Income Distribution

- Properties generate monthly income from shortlet rentals
- Income statements track gross revenue, operating costs, and management fees
- Net income is distributed pro-rata based on share ownership
- Distribution history and status tracking

### Investor Dashboard

- Portfolio overview (total invested, income earned, current value)
- Holdings per property with share details
- Distribution history
- Transaction history
- Property documents and statements

## API Routes

- `POST /api/investments`: Purchase shares in a property
- `GET /api/auth/[...nextauth]`: NextAuth authentication endpoints

## Running the Application End-to-End

### Quick Start (Local Development)

1. **Setup Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Database**
   ```bash
   # Generate Prisma Client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate dev
   
   # Seed database with sample data
   npx prisma db seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Sign in with email (magic link) or use dev credentials if enabled
   - Browse properties, make investments, view dashboard

### Seed Data Includes

The seed script (`prisma/seed.ts`) creates a complete dataset:

- **5 test users** (investors) with completed profiles and onboarding
- **1 admin user** (pogbonna@gmail.com)
- **12 properties** across 6 Nigerian cities with varying statuses
- **3 investments** linking users to properties
- **6 months of rental statements** for 5 properties with realistic data
- **Distributions and payouts** for invested properties
- **Transactions** for investments and payouts
- **Documents** (global, property-specific, and user-specific)
- **Referral codes** for test users
- **Audit logs** for system initialization

### Testing the Application

1. **Sign In**: Use email magic link or dev credentials (if enabled)
2. **Browse Properties**: Visit `/properties` to see available investments
3. **View Property Details**: Click any property to see details, transparency metrics, and rental statements
4. **Make Investment**: Complete onboarding, then invest in a property
5. **View Dashboard**: Check portfolio value, income earned, and holdings
6. **View Income**: See monthly distributions and income timeline
7. **Admin Portal**: Sign in as admin to manage properties, statements, and distributions

## Development

### Code Quality

- ESLint for linting
- Prettier for code formatting
- TypeScript for type safety

### Running Tests

```bash
# Run Playwright tests
npm run test:e2e
```

### Database Management

```bash
# Open Prisma Studio
npx prisma studio

# Create a new migration
npx prisma migrate dev --name migration-name

# Reset database (development only)
npx prisma migrate reset
```

## Production Deployment

1. Set up a PostgreSQL database
2. Configure environment variables
3. Run database migrations: `npx prisma migrate deploy`
4. Build the application: `npm run build`
5. Start the production server: `npm start`

Or use Docker:

```bash
DOCKER_BUILD=true docker-compose up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open-source and available under the MIT License.

## Support

For issues and questions, please open an issue on GitHub or contact support@inventwealth.com.
