# Workforce Management System

A scalable workforce management system built with Node.js, Express, TypeORM, MySQL, and RabbitMQ. Designed to handle 100 to 10,000+ employees with proper scalability patterns.

## 🏗️ Architecture

### Design Patterns Used

- **Repository Pattern**: Data access abstraction with BaseRepository
- **Service Layer Pattern**: Business logic isolation from controllers
- **Strategy Pattern**: Retry policies (Immediate, Linear, Exponential backoff)
- **Factory Pattern**: RetryPolicyFactory for creating retry strategies
- **Singleton Pattern**: RabbitMQService for connection management

### Tech Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: TypeORM
- **Database**: MySQL 8.0
- **Message Queue**: RabbitMQ with Dead Letter Queue
- **Cache**: Redis (for employee lookups)
- **Testing**: Jest + Supertest

## 📋 Features

### Core Features

- ✅ Department management with unique names
- ✅ Employee management with pagination
- ✅ Leave request system with auto-approval logic
- ✅ Message queue processing with retry mechanism
- ✅ Idempotent message handling
- ✅ Request validation with Joi
- ✅ Rate limiting (100 req/15min)
- ✅ Health check endpoints

### Scalability Features

- **Database**: Indexed queries, connection pooling (10 connections), pagination (max 100/page)
- **Queue**: Multiple consumers support, Dead Letter Queue, exponential backoff retry
- **API**: Rate limiting, request validation, Redis response caching
- **Caching**: Redis caching for employee lookups (5min TTL)

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 16+
- npm or yarn

### 1. Clone and Install

```bash
git clone <your-repo>
cd workforce
npm install
```

### 2. Start Services

```bash
# Start MySQL, RabbitMQ, Redis with Docker Compose
docker-compose up -d

# Wait for services to be healthy
docker-compose ps
```

### 3. Run Migrations

```bash
npm run migration:run
```

### 4. Start Application

```bash
npm run dev
```

API will be available at http://localhost:3000

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📚 API Documentation

### Base URL

`http://localhost:3000/api`

### Endpoints

#### Departments

- `POST /api/departments` - Create department
- `GET /api/departments/:id/employees?page=1&limit=10` - List employees

#### Employees

- `POST /api/employees` - Create employee
- `GET /api/employees/:id` - Get employee with leave history (cached)

#### Leave Requests

- `POST /api/leave-requests` - Create leave request

### Example Requests

#### Create Department

```bash
curl -X POST http://localhost:3000/api/departments \
  -H "Content-Type: application/json" \
  -d '{"name": "Engineering"}'
```

#### Create Employee

```bash
curl -X POST http://localhost:3000/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "departmentId": 1
  }'
```

#### Create Leave Request

```bash
curl -X POST http://localhost:3000/api/leave-requests \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": 1,
    "startDate": "2024-06-01",
    "endDate": "2024-06-02",
    "leaveType": "VACATION"
  }'
```

## 🔍 Health Checks

- `GET /health` - Application health
- `GET /queue-health` - RabbitMQ health
- `GET /db-health` - MySQL connection health
- `GET /redis-health` - Redis cache health

## 🎯 Business Rules

### Leave Approval Logic

- **Leaves ≤ 2 days**: Auto-approved immediately
- **Leaves > 2 days**: Marked as PENDING for manual approval

### Retry Policy

- **Max retries**: 3 attempts
- **Strategy**: Exponential backoff with jitter
- **Base delay**: 1000ms
- **Max delay**: 60000ms (1 minute)
- **Failed messages**: Routed to Dead Letter Queue after max retries

## 📊 Database Schema

### Tables

- `departments` - Department information with unique names
- `employees` - Employee records with unique emails
- `leave_requests` - Leave request records with status tracking
- `queue_processing_log` - Queue message tracking for idempotency

### Key Indexes

- `employees.department_id` - Fast department lookups
- `leave_requests.employee_id + status` - Efficient leave queries
- `leave_requests.employee_id + startDate + endDate` - Date range queries
- `queue_processing_log.message_id` - Idempotency checks (unique)

## 🏗️ Project Structure

```
src/
├── config/              # Configuration management
├── controllers/         # HTTP request handlers
├── entities/            # TypeORM entities
├── repositories/        # Data access layer (Repository pattern)
├── services/            # Business logic layer
├── middleware/          # Express middleware (rate limiting, validation)
├── validation/          # Request validation schemas (Joi)
├── utils/               # Utility functions (RetryPolicy)
├── migration/           # Database migrations
└── __tests__/           # Test files
    ├── unit/            # Unit tests (business logic)
    └── integration/     # Integration tests (API)
```

## 🔧 Configuration

All configuration in `src/config/index.ts`. Override via environment variables:

**Database:**

- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`

**Redis:**

- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

**RabbitMQ:**

- `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USERNAME`, `RABBITMQ_PASSWORD`, `RABBITMQ_VHOST`, `RABBITMQ_URI`

**Application:**

- `NODE_ENV`, `PORT`, `API_VERSION`

**Rate Limiting:**

- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`

**Queue:**

- `QUEUE_RETRY_ATTEMPTS`, `QUEUE_RETRY_DELAY`

## 🐳 Docker Services

```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f mysql
docker-compose logs -f rabbitmq

# Stop services
docker-compose down

# Reset everything
docker-compose down -v
npm run migration:run
```

## 📈 Performance Considerations

- **Connection Pooling**: 10 database connections
- **Database Indexes**: On foreign keys and frequently queried fields
- **Pagination**: Max 100 items per page
- **Rate Limiting**: 100 requests per 15 minutes
- **Redis Caching**: 5-minute TTL for employee lookups
- **Queue Processing**: Prefetch 1 message at a time
- **Exponential Backoff**: Prevents thundering herd on retries

## 🚨 Monitoring

### RabbitMQ Management UI

http://localhost:15672

- Username: `workforce`
- Password: `workforce123`

Monitor:

- Queue depth
- Message processing rate
- Dead letter queue messages
- Consumer status

### Database

Check connection status:

```bash
curl http://localhost:3000/db-health
```

### Cache

Check Redis status:

```bash
curl http://localhost:3000/redis-health
```

## 🔄 Message Queue Flow

1. **Create Leave Request** → API receives request
2. **Save to Database** → Status: PENDING
3. **Publish to Queue** → `leave.requested` queue
4. **Consumer Processes** → Applies business rules
5. **Auto-Approval** → If ≤ 2 days, status: APPROVED
6. **Idempotency Check** → Uses `QueueProcessingLog`
7. **Retry on Failure** → Exponential backoff (max 3 retries)
8. **Dead Letter Queue** → After max retries exceeded

## 📝 License

MIT

---

**Built with attention to scalability, maintainability, and production-readiness.**
