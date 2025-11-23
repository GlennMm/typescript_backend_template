# SaaS Backend - Production-Ready Multi-Tenant API

A production-ready SaaS backend built with Bun.js, Express, and SQLite featuring multi-tenancy, role-based authentication, subscription management, and comprehensive security features.

## Features

### Core Functionality
- **Multi-Tenancy**: Each tenant gets their own isolated SQLite database
- **User Management**: Complete CRUD operations with user activation workflow
- **Role-Based Access Control (RBAC)**: Three-tier role system (SuperAdmin, TenantAdmin, TenantUser)
- **Authentication**: JWT-based auth with access and refresh tokens
- **Subscription Management**: Tiered plans (Free, Pro, Enterprise) with grace period support

### Security
- **Rate Limiting**: Configurable request throttling
- **Secure Headers**: Helmet.js integration
- **Input Validation**: Zod schema validation
- **Password Hashing**: bcrypt with configurable rounds
- **CORS**: Configurable cross-origin resource sharing
- **Graceful Shutdown**: Proper SIGTERM/SIGINT handling

### Production Ready
- **TypeScript**: Full type safety
- **Testing**: Unit, integration, and E2E tests with Supertest
- **Docker Support**: Multi-stage Dockerfile and docker-compose setup
- **Logging**: Winston logger with different levels
- **Database Migrations**: Drizzle ORM with migration support
- **Environment Configuration**: Validated environment variables

## Technology Stack

- **Runtime**: Bun.js
- **Framework**: Express.js
- **Database**: SQLite with Drizzle ORM
- **Validation**: Zod
- **Authentication**: jsonwebtoken
- **Testing**: Bun test + Supertest
- **Logging**: Winston
- **Security**: Helmet, CORS, express-rate-limit

## Project Structure

```
src/
├── config/               # Configuration files
│   └── env.ts           # Environment validation
├── db/                  # Database layer
│   ├── schemas/         # Drizzle schemas (main & tenant)
│   ├── connection.ts    # Database connection manager
│   ├── migrate.ts       # Migration runner
│   └── seed.ts          # Database seeding
├── features/            # Feature modules (vertical slices)
│   ├── auth/           # Authentication & authorization
│   ├── users/          # User management
│   └── tenants/        # Tenant management
├── middleware/          # Express middleware
│   ├── auth.ts         # JWT authentication & RBAC
│   ├── tenant.ts       # Tenant resolution
│   ├── subscription.ts # Subscription validation
│   ├── security.ts     # Security headers, CORS, rate limiting
│   └── errorHandler.ts # Global error handling
├── utils/              # Utility functions
│   ├── jwt.ts          # JWT helpers
│   ├── password.ts     # Password hashing
│   ├── logger.ts       # Winston logger
│   └── response.ts     # API response helpers
├── types/              # TypeScript type definitions
├── __tests__/          # E2E tests
├── app.ts              # Express app configuration
└── index.ts            # Application entry point
```

## Installation

### Prerequisites
- [Bun](https://bun.sh) v1.0 or higher
- Docker (optional, for containerized deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd typescript_backend_template
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and set your secrets (especially JWT secrets)
   ```

4. **Generate database migrations**
   ```bash
   bun run db:generate
   ```

5. **Run migrations**
   ```bash
   bun run db:migrate
   ```

6. **Seed the database**
   ```bash
   bun run db:seed
   ```
   This creates:
   - 3 subscription plans (Free, Pro, Enterprise)
   - A super admin account (admin@saas.com / SuperAdmin123!)

7. **Start the development server**
   ```bash
   bun run dev
   ```

The server will start on `http://localhost:3000`

### Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Run migrations in container**
   ```bash
   docker-compose exec app bun run db:migrate
   docker-compose exec app bun run db:seed
   ```

3. **View logs**
   ```bash
   docker-compose logs -f app
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production/test) | development |
| `PORT` | Server port | 3000 |
| `HOST` | Server host | 0.0.0.0 |
| `MAIN_DB_PATH` | Main database file path | ./data/main.db |
| `TENANT_DB_DIR` | Tenant databases directory | ./data/tenants |
| `JWT_ACCESS_SECRET` | JWT access token secret (min 32 chars) | **REQUIRED** |
| `JWT_REFRESH_SECRET` | JWT refresh token secret (min 32 chars) | **REQUIRED** |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiration | 15m |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | 7d |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | 900000 (15min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |
| `BCRYPT_ROUNDS` | Password hashing rounds | 10 |
| `SUBSCRIPTION_GRACE_PERIOD_DAYS` | Grace period for unpaid subscriptions | 7 |

## API Documentation

### Authentication

All tenant-scoped endpoints require the `X-Tenant-ID` header.

#### Super Admin Login
```http
POST /api/auth/admin/login
Content-Type: application/json

{
  "email": "admin@saas.com",
  "password": "SuperAdmin123!"
}
```

#### Tenant User Login
```http
POST /api/auth/login
X-Tenant-ID: <tenant-id>
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}
```

#### Register Tenant User
```http
POST /api/auth/register
X-Tenant-ID: <tenant-id>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refresh-token>"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "refreshToken": "<refresh-token>"
}
```

### Tenant Management (SuperAdmin Only)

#### Get All Tenants
```http
GET /api/tenants
Authorization: Bearer <super-admin-token>
```

#### Create Tenant
```http
POST /api/tenants
Authorization: Bearer <super-admin-token>
Content-Type: application/json

{
  "name": "ACME Corporation",
  "slug": "acme-corp",
  "subscriptionPlanId": "<plan-id>",
  "adminEmail": "admin@acme.com",
  "adminPassword": "SecurePass123!",
  "adminName": "ACME Admin"
}
```

#### Update Subscription
```http
PATCH /api/tenants/:id/subscription
Authorization: Bearer <super-admin-token>
Content-Type: application/json

{
  "subscriptionPlanId": "<new-plan-id>",
  "subscriptionStatus": "active"
}
```

#### Suspend/Activate Tenant
```http
PATCH /api/tenants/:id/suspend
Authorization: Bearer <super-admin-token>

PATCH /api/tenants/:id/activate
Authorization: Bearer <super-admin-token>
```

#### Get Subscription Plans
```http
GET /api/tenants/plans
Authorization: Bearer <super-admin-token>
```

### User Management (TenantAdmin Only)

#### Get All Users
```http
GET /api/users
X-Tenant-ID: <tenant-id>
Authorization: Bearer <tenant-admin-token>
```

#### Create User
```http
POST /api/users
X-Tenant-ID: <tenant-id>
Authorization: Bearer <tenant-admin-token>
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "Jane Doe",
  "role": "TenantUser"
}
```

#### Activate User
```http
PATCH /api/users/:id/activate
X-Tenant-ID: <tenant-id>
Authorization: Bearer <tenant-admin-token>
Content-Type: application/json

{
  "isActive": true
}
```

#### Get Current User Profile
```http
GET /api/users/me
X-Tenant-ID: <tenant-id>
Authorization: Bearer <token>
```

### Response Format

All responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

## Testing

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage
```

The test suite includes:
- **Unit tests**: Password hashing, JWT generation/verification
- **Integration tests**: Auth endpoints, tenant management
- **E2E tests**: Complete user flows with database

## Multi-Tenancy Architecture

### Database Strategy
- **Main Database**: Stores tenant metadata, subscriptions, and super admin accounts
- **Tenant Databases**: Each tenant has a separate SQLite database containing their users and data
- **Isolation**: Complete data isolation between tenants at the database level

### Tenant Identification
- Tenants are identified via the `X-Tenant-ID` HTTP header
- The middleware resolves the tenant and validates subscription status
- Tenant context is attached to requests for downstream handlers

### Subscription Management
- **Active**: Full access to all features
- **Grace Period**: Access allowed with warning header
- **Inactive/Suspended**: Access blocked with 403 error

## Security Best Practices

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### JWT Tokens
- Short-lived access tokens (15 minutes default)
- Long-lived refresh tokens (7 days default)
- Tokens are validated on every request

### Rate Limiting
- Default: 100 requests per 15 minutes
- Configurable via environment variables
- Returns 429 Too Many Requests when exceeded

### Graceful Shutdown
The application handles SIGTERM and SIGINT signals to:
- Stop accepting new connections
- Complete existing requests
- Clean up resources
- Exit cleanly

## Subscription Plans

### Free Plan
- Up to 5 users
- Basic support
- Basic analytics

### Pro Plan
- Up to 50 users
- Priority support
- Advanced analytics
- API access

### Enterprise Plan
- Unlimited users
- 24/7 support
- Advanced analytics
- API access
- Custom integrations
- SLA

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server with watch mode |
| `bun run start` | Start production server |
| `bun run db:generate` | Generate migrations for both databases |
| `bun run db:migrate` | Run pending migrations |
| `bun run db:seed` | Seed database with initial data |
| `bun test` | Run all tests |
| `bun test:watch` | Run tests in watch mode |
| `bun test:coverage` | Run tests with coverage |

## Troubleshooting

### Database Issues
- Delete `./data` folder and re-run migrations if you encounter schema conflicts
- Ensure proper write permissions for the data directory

### JWT Errors
- Verify JWT secrets are at least 32 characters
- Check token expiration times
- Ensure tokens are being sent with `Bearer ` prefix

### Multi-Tenancy Issues
- Always include `X-Tenant-ID` header for tenant-scoped requests
- Verify tenant exists and is active
- Check subscription status

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request