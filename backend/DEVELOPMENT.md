# PublicDesk Backend - Development Notes

## Database Schema

### User Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'CITIZEN',
  status VARCHAR(50) DEFAULT 'PENDING_VERIFICATION',
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  profile_picture VARCHAR(255),
  last_login TIMESTAMP,
  last_login_ip VARCHAR(45),
  refresh_token TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
```

### OTP Table
```sql
CREATE TABLE otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  type VARCHAR(50) NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  purpose VARCHAR(255),
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_otps_user_type ON otps(user_id, type, expires_at);
```

---

## API Response Standards

### Success Response
```typescript
{
  success: true,
  message: "Operation successful",
  data: { ... }
}
```

### Error Response
```typescript
{
  statusCode: 400,
  timestamp: "2026-02-17T10:30:00.000Z",
  path: "/api/v1/...",
  method: "POST",
  message: "Error message",
  error: "ErrorType"
}
```

---

## Authentication Flow

1. **Register**: User → Email sent with OTP
2. **Verify Email**: User enters OTP → Account activated
3. **Login**: Email + Password → JWT tokens
4. **Access Protected Routes**: JWT in Authorization header
5. **Refresh Token**: When access token expires
6. **Logout**: Invalidate refresh token

---

## Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (@$!%*?&#)

---

## OTP Configuration

- Length: 6 digits
- Expiry: 5 minutes
- Max attempts: 5
- Types:
  - EMAIL_VERIFICATION
  - PHONE_VERIFICATION
  - LOGIN
  - PASSWORD_RESET

---

## Role Hierarchy

```
SUPER_ADMIN (Full system access)
    ↓
ADMIN (Office management)
    ↓
SUPERVISOR (Monitoring)
    ↓
OFFICER (Service desk)
    ↓
CITIZEN (Public user)
```

---

## Future Modules

### Office Module
- Office creation/management
- Counter management
- Staff assignment
- Operating hours

### Service Module
- Service catalog
- Service categories
- Estimated time
- Prerequisites

### Appointment Module
- Booking system
- Time slot management
- Confirmation/cancellation
- Reminders

### Token Module
- QR code generation
- Token lifecycle
- Priority handling
- Token transfer

### Queue Module
- Real-time updates
- Queue display
- Counter calling system
- Wait time estimation

### Analytics Module
- Service metrics
- Wait time analysis
- Officer performance
- Citizen satisfaction

---

## Testing Scenarios

### Unit Tests
- Service methods
- Validation logic
- Utility functions

### Integration Tests
- API endpoints
- Database operations
- Authentication flow

### E2E Tests
- Complete user journeys
- Multi-module interactions

---

## Performance Optimization

### Caching Strategy (Redis)
- User sessions
- OTP codes
- Frequently accessed data
- Rate limiting

### Database Optimization
- Proper indexing
- Query optimization
- Connection pooling
- Read replicas (future)

### Message Queue (RabbitMQ)
- Email notifications
- SMS notifications
- Background jobs
- Event-driven architecture

---

## Monitoring & Logging

### Application Logs
- Error logs: `/logs/error.log`
- Combined logs: `/logs/combined.log`
- Console output (development)

### Metrics to Monitor
- API response times
- Database query performance
- Queue message processing
- Error rates
- User activity

---

## Security Checklist

- [x] Password hashing (bcrypt)
- [x] JWT authentication
- [x] Input validation
- [x] SQL injection protection
- [x] Rate limiting
- [x] CORS configuration
- [ ] Helmet.js security headers (recommended)
- [ ] SSL/TLS in production
- [ ] API key for external services
- [ ] Regular security audits

---

## Deployment Checklist

### Pre-deployment
- [ ] Run tests
- [ ] Check for security vulnerabilities
- [ ] Review environment variables
- [ ] Update documentation
- [ ] Create database backup

### Deployment
- [ ] Build application
- [ ] Run migrations
- [ ] Deploy to production
- [ ] Smoke tests
- [ ] Monitor logs

### Post-deployment
- [ ] Verify all endpoints
- [ ] Check error rates
- [ ] Monitor performance
- [ ] Set up alerts

---

## Useful Commands

```bash
# Development
npm run start:dev

# Build
npm run build

# Tests
npm test
npm run test:e2e
npm run test:cov

# Linting
npm run lint
npm run format

# Docker
docker-compose up -d
docker-compose down
docker-compose logs -f app

# Database
npm run migration:generate -- -n MigrationName
npm run migration:run
npm run migration:revert
```

---

## Common Issues & Solutions

### Issue: Port already in use
```bash
# Find process using port 3000
lsof -i :3000
# Kill process
kill -9 <PID>
```

### Issue: Docker containers won't start
```bash
# Clean up Docker
docker-compose down -v
docker system prune -a
docker-compose up -d
```

### Issue: Database connection failed
- Check PostgreSQL is running
- Verify credentials in .env
- Check network connectivity

### Issue: JWT token expired
- Use refresh token endpoint
- Check JWT_EXPIRES_IN configuration

---

## Contributing Guidelines

1. Create a feature branch
2. Follow code style (ESLint + Prettier)
3. Write tests for new features
4. Update documentation
5. Submit PR with clear description

---

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Redis Documentation](https://redis.io/docs)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)

---

**Last Updated**: 2026-02-17
