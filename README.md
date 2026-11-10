# Product Catalog Backend

Backend API for a product catalog and e-commerce application. The service is built with Node.js, Express, MongoDB, Redis, Socket.IO, Stripe, Cloudinary, and Swagger.

## Features

- User, seller, and admin authentication with access and refresh tokens
- Product catalog and seller product management
- Cart and order management
- Cash-on-delivery and Stripe payments
- Seller order and sales dashboards
- Real-time customer chat with Socket.IO
- Email/OTP workflows through SMTP
- Image uploads and processing with Cloudinary and Sharp
- Request validation, rate limiting, structured logging, and centralized error handling
- Interactive API documentation with Swagger UI

## Requirements

- Node.js 18 or newer
- MongoDB
- Redis
- SMTP credentials for email features
- Cloudinary credentials for image uploads
- Stripe credentials for online payments

## Installation

```bash
git clone https://github.com/WebWrite/product-catalog-backend.git
cd product-catalog-backend
npm install
```

Create a local environment file from the provided template:

```bash
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Update `.env` with real values before starting the server. Do not commit `.env` or any credentials.

## Environment variables

| Variable | Description |
| --- | --- |
| `NODE_ENV` | Runtime environment, such as `development` or `production` |
| `PORT` | Port used by the HTTP server |
| `CLIENT_URL` | Frontend origin allowed by CORS |
| `DATABASE_URL` | MongoDB connection string |
| `REDIS_URL` | Redis connection URL |
| `ACCESS_TOKEN_SECRET_KEY` | Secret used to sign access tokens |
| `REFRESH_TOKEN_SECRET_KEY` | Secret used to sign refresh tokens |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password or app password |
| `MAIL_FROM` | Verified sender email address |
| `ADMIN_NAME` | Seed admin display name |
| `ADMIN_EMAIL` | Seed admin email address |
| `ADMIN_PASSWORD` | Seed admin password |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

## Running the project

Start the production-style server:

```bash
npm start
```

Start the server with automatic reloads during development:

```bash
npm run dev
```

Create the initial admin account using `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`:

```bash
npm run seed-admin
```

## API documentation

When the server is running, open [http://localhost:5000/api-docs](http://localhost:5000/api-docs) to browse the Swagger documentation. If `PORT` is different, replace `5000` with the configured port.

The API uses the `/api/v1` base path. Main route groups include:

- `/api/v1/auth` - authentication, email verification, and token management
- `/api/v1/user` - customer profile operations
- `/api/v1` - public product catalog and seller product operations
- `/api/v1/cart` - shopping cart operations
- `/api/v1/orders` - customer orders and payments
- `/api/v1/admin` - administration operations
- `/api/v1/chat` - conversations and messages
- `/api/v1/seller` - seller dashboard and sales operations

Stripe webhooks are handled under the `/api/v1` base path.

## Project structure

```text
src/
├── Controllers/   Request handlers
├── Routes/        Express route definitions
├── config/        Database, Redis, mailer, Stripe, and Swagger configuration
├── middlewares/   Authentication, validation, uploads, logging, and errors
├── models/        Mongoose models
├── repositories/  Data access layer
├── managers/      Application and business logic
├── sockets/       Socket.IO setup and chat handlers
├── validations/   Joi request schemas
└── utils/         Shared utilities
```

## Code quality

Run ESLint:

```bash
npm run lint
```

Apply ESLint fixes:

```bash
npm run lint:fix
```

Format the project:

```bash
npm run format
```

