# PublicDesk Backend - System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  (Web App, Mobile App, Admin Dashboard, Kiosk Display)          │
└────────────────┬────────────────────────────────────────────────┘
                 │ HTTPS/REST API
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY / LOAD BALANCER                 │
│                      (Nginx, AWS ALB, etc.)                      │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                     NESTJS APPLICATION                           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              PRESENTATION LAYER                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │  │
│  │  │   Auth   │  │   User   │  │  Future  │  ...more    │  │
│  │  │Controller│  │Controller│  │Controllers│             │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘             │  │
│  └───────┼─────────────┼─────────────┼────────────────────┘  │
│          │             │             │                         │
│  ┌───────┼─────────────┼─────────────┼────────────────────┐  │
│  │       │   BUSINESS LOGIC LAYER    │                     │  │
│  │  ┌────▼─────┐  ┌────▼─────┐  ┌──▼───────┐            │  │
│  │  │   Auth   │  │   User   │  │  Future  │  ...more   │  │
│  │  │ Service  │  │ Service  │  │ Services │            │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘            │  │
│  └───────┼─────────────┼─────────────┼────────────────────┘  │
│          │             │             │                         │
│  ┌───────┼─────────────┼─────────────┼────────────────────┐  │
│  │       │    DATA ACCESS LAYER       │                     │  │
│  │  ┌────▼─────┐  ┌────▼─────┐  ┌──▼───────┐            │  │
│  │  │   User   │  │   OTP    │  │  Future  │  ...more   │  │
│  │  │Repository│  │Repository│  │Repository│            │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘            │  │
│  └───────┼─────────────┼─────────────┼────────────────────┘  │
│          │             │             │                         │
│  ┌───────┼─────────────┼─────────────┼────────────────────┐  │
│  │  CROSSCUTTING CONCERNS (Guards, Filters, Interceptors)  │  │
│  │  • JWT Guard  • Roles Guard  • Exception Filters       │  │
│  │  • Logging  • Validation  • Rate Limiting               │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────┬──────────────────┬──────────────┬────────────┘
                 │                  │              │
        ┌────────┴────────┐ ┌──────┴──────┐ ┌────┴────────┐
        │                 │ │             │ │             │
        ↓                 ↓ ↓             ↓ ↓             ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    Redis     │  │   RabbitMQ   │
│   Database   │  │    Cache     │  │Message Queue │
│              │  │              │  │              │
│  • Users     │  │ • Sessions   │  │• Email Queue │
│  • OTPs      │  │ • OTP Cache  │  │• SMS Queue   │
│  • Offices   │  │ • Rate Limit │  │• Events      │
│  • Services  │  │ • Queue Data │  │• Background  │
│  • Tokens    │  │              │  │  Jobs        │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Module Architecture

### Auth Module
```
AuthModule
├── AuthController
│   ├── POST /register
│   ├── POST /login
│   ├── POST /verify-email
│   ├── POST /resend-email-otp
│   ├── POST /refresh
│   ├── POST /logout
│   └── GET  /me
├── AuthService
│   ├── register()
│   ├── login()
│   ├── verifyEmail()
│   ├── refreshToken()
│   └── logout()
├── OtpService
│   ├── createOtp()
│   ├── verifyOtp()
│   ├── sendOtpEmail()
│   └── sendOtpSms()
└── JwtStrategy
    └── validate()
```

### User Module
```
UserModule
├── UserController
│   ├── GET  /users
│   ├── GET  /users/me
│   ├── GET  /users/statistics
│   ├── GET  /users/:id
│   ├── PUT  /users/me
│   ├── PUT  /users/me/password
│   ├── PUT  /users/:id/role
│   ├── PUT  /users/:id/status
│   └── DELETE /users/:id
├── UserService
│   ├── findById()
│   ├── findAll()
│   ├── updateProfile()
│   ├── changePassword()
│   ├── updateRole()
│   └── updateStatus()
└── Entities
    ├── User
    └── Otp
```

---

## Data Flow - User Registration

```
1. Client
   │
   └─→ POST /api/v1/auth/register
       │
2. AuthController
   │ • Receives RegisterDto
   │ • Validates input (class-validator)
   │
   └─→ AuthService.register()
       │
3. AuthService
   │ • Check if user exists
   │ • Hash password (bcrypt)
   │ • Create user entity
   │ • Save to database
   │
   ├─→ UserRepository.save()
   │   │
   │   └─→ PostgreSQL
   │       │ INSERT INTO users
   │       └─→ Return user
   │
   ├─→ OtpService.createOtp()
   │   │ • Generate 6-digit code
   │   │ • Save to database
   │   │
   │   └─→ OtpService.sendOtpEmail()
   │       │
   │       └─→ RabbitMQ (Email Queue)
   │           │
   │           └─→ Email Service Worker
   │
   └─→ Generate JWT tokens
       │ • Access token (1 day)
       │ • Refresh token (7 days)
       │
       └─→ Return to Client
           { user, accessToken, refreshToken }
```

---

## Data Flow - Protected Route Access

```
1. Client
   │ Authorization: Bearer <JWT>
   │
   └─→ GET /api/v1/users/me
       │
2. JwtAuthGuard (Global)
   │ • Extract JWT from header
   │ • Verify signature
   │ • Check expiration
   │
   └─→ JwtStrategy.validate()
       │ • Decode payload
       │ • Fetch user from DB
       │
       └─→ RolesGuard (if @Roles() used)
           │ • Check user role
           │ • Match against required roles
           │
           └─→ UserController.getMyProfile()
               │ • Access @CurrentUser()
               │ • Return user data
               │
               └─→ Client receives response
```

---

## Security Layers

```
┌─────────────────────────────────────────────┐
│         1. NETWORK LAYER                    │
│  • HTTPS/TLS encryption                     │
│  • Firewall rules                           │
│  • DDoS protection                          │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         2. APPLICATION LAYER                │
│  • Rate limiting (Throttler)                │
│  • CORS configuration                       │
│  • Helmet security headers                  │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         3. AUTHENTICATION LAYER             │
│  • JWT token validation                     │
│  • Token expiration                         │
│  • Refresh token mechanism                  │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         4. AUTHORIZATION LAYER              │
│  • Role-based access control (RBAC)         │
│  • Resource ownership checks                │
│  • Permission validation                    │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         5. INPUT VALIDATION LAYER           │
│  • DTO validation (class-validator)         │
│  • Type checking (TypeScript)               │
│  • Sanitization                             │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         6. DATA LAYER                       │
│  • SQL injection protection (TypeORM)       │
│  • Parameterized queries                    │
│  • Password hashing (bcrypt)                │
└─────────────────────────────────────────────┘
```

---

## Database Schema (Current)

```sql
┌─────────────────────────────────────────┐
│               USERS                     │
├─────────────────────────────────────────┤
│ id (UUID, PK)                          │
│ first_name (VARCHAR)                    │
│ last_name (VARCHAR)                     │
│ email (VARCHAR, UNIQUE)                 │
│ phone (VARCHAR, UNIQUE)                 │
│ password (VARCHAR, HASHED)              │
│ role (ENUM: CITIZEN, OFFICER, ...)     │
│ status (ENUM: ACTIVE, INACTIVE, ...)   │
│ email_verified (BOOLEAN)                │
│ phone_verified (BOOLEAN)                │
│ profile_picture (VARCHAR)               │
│ last_login (TIMESTAMP)                  │
│ last_login_ip (VARCHAR)                 │
│ refresh_token (TEXT, HASHED)            │
│ metadata (JSONB)                        │
│ created_at (TIMESTAMP)                  │
│ updated_at (TIMESTAMP)                  │
│ deleted_at (TIMESTAMP, NULLABLE)        │
└──────────────┬──────────────────────────┘
               │ 1:N
               │
┌──────────────▼──────────────────────────┐
│               OTPS                      │
├─────────────────────────────────────────┤
│ id (UUID, PK)                          │
│ user_id (UUID, FK → users.id)          │
│ code (VARCHAR)                          │
│ type (VARCHAR: EMAIL_VERIFICATION, ...) │
│ verified (BOOLEAN)                      │
│ expires_at (TIMESTAMP)                  │
│ purpose (VARCHAR)                       │
│ attempts (INT)                          │
│ created_at (TIMESTAMP)                  │
│ updated_at (TIMESTAMP)                  │
│ deleted_at (TIMESTAMP, NULLABLE)        │
└─────────────────────────────────────────┘
```

---

## Technology Stack Details

### Backend Framework
```
NestJS (v10.x)
├── TypeScript (v5.x)
├── Express.js (underlying)
├── Decorators & Metadata
└── Dependency Injection
```

### Database
```
PostgreSQL (v16)
├── TypeORM (ORM)
├── Connection Pooling
├── Migration Support
└── Full ACID Compliance
```

### Caching & Sessions
```
Redis (v7)
├── Session Storage
├── OTP Caching
├── Rate Limit Counters
└── Queue Data
```

### Message Queue
```
RabbitMQ (v3)
├── Email Notifications
├── SMS Notifications
├── Background Jobs
└── Event-Driven Architecture
```

### Authentication
```
JWT (JSON Web Tokens)
├── Access Token (1 day)
├── Refresh Token (7 days)
├── Passport.js Integration
└── bcrypt Password Hashing
```

---

## Deployment Architecture (Production)

```
┌──────────────────────────────────────────────────────────┐
│                     CLOUDFLARE / CDN                      │
│                  (DDoS Protection, SSL)                   │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│                  LOAD BALANCER                            │
│              (Nginx, AWS ALB, etc.)                       │
└────────┬──────────────────────────────┬──────────────────┘
         │                              │
    ┌────▼──────┐              ┌────────▼──────┐
    │  NestJS   │              │    NestJS     │
    │  App #1   │              │    App #2     │
    └────┬──────┘              └────────┬──────┘
         │                              │
         └──────────────┬───────────────┘
                        │
         ┌──────────────┼───────────────┐
         │              │               │
    ┌────▼─────┐  ┌────▼─────┐  ┌─────▼─────┐
    │PostgreSQL│  │  Redis   │  │ RabbitMQ  │
    │ Primary  │  │  Cluster │  │  Cluster  │
    └────┬─────┘  └──────────┘  └───────────┘
         │
    ┌────▼─────┐
    │PostgreSQL│
    │ Replica  │
    │(Read-Only│
    └──────────┘
```

---

## Error Handling Flow

```
Exception Occurs
    │
    ├─→ HTTP Exception?
    │   │
    │   └─→ HttpExceptionFilter
    │       │ • Log error
    │       │ • Format response
    │       └─→ Return JSON error
    │
    └─→ Other Exception
        │
        └─→ AllExceptionsFilter
            │ • Log error with stack trace
            │ • Format generic error
            └─→ Return JSON error


Error Response Format:
{
  "statusCode": 400,
  "timestamp": "2026-02-17T...",
  "path": "/api/v1/...",
  "method": "POST",
  "message": "Error message",
  "error": "ExceptionType"
}
```

---

## Logging Strategy

```
Application Logs
    │
    ├─→ Console (Development)
    │   └─→ Colorized output
    │
    ├─→ File (All Environments)
    │   ├─→ logs/error.log (Errors only)
    │   └─→ logs/combined.log (All levels)
    │
    └─→ External Service (Production)
        └─→ CloudWatch, Datadog, LogDNA, etc.


Log Levels:
• ERROR: Errors and exceptions
• WARN: Warning messages
• INFO: General info
• DEBUG: Debugging info
• VERBOSE: Detailed logs
```

---

## Future Architecture Enhancements

### Phase 2
```
• Office Module
• Service Module
• Appointment Module
• Token/Queue Module
```

### Phase 3
```
• WebSocket for real-time updates
• GraphQL API
• Elasticsearch for search
• Notification workers
```

### Phase 4
```
• Microservices split
• Event sourcing
• CQRS pattern
• Analytics engine
```

---

**Architecture Design Date**: 2026-02-17  
**Version**: 1.0.0 (MVP)
