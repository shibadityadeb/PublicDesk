# PublicDesk API Guide

## Authentication Flow

### 1. User Registration
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+919876543210",
  "password": "Password@123",
  "role": "CITIZEN"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "CITIZEN",
      "status": "PENDING_VERIFICATION"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 2. Verify Email with OTP
```http
POST /api/v1/auth/verify-email
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "code": "123456",
  "type": "EMAIL_VERIFICATION"
}
```

### 3. User Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "Password@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "CITIZEN"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 4. Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

### 5. Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

---

## User Management

### Get All Users (Admin Only)
```http
GET /api/v1/users?page=1&limit=10
Authorization: Bearer <admin_access_token>
```

### Get User Profile
```http
GET /api/v1/users/me
Authorization: Bearer <access_token>
```

### Update Profile
```http
PUT /api/v1/users/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+919876543210"
}
```

### Change Password
```http
PUT /api/v1/users/me/password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentPassword": "OldPassword@123",
  "newPassword": "NewPassword@456"
}
```

### Update User Role (Admin Only)
```http
PUT /api/v1/users/:userId/role
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "role": "OFFICER"
}
```

### Update User Status (Admin Only)
```http
PUT /api/v1/users/:userId/status
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "status": "ACTIVE"
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "statusCode": 400,
  "timestamp": "2026-02-17T10:30:00.000Z",
  "path": "/api/v1/auth/login",
  "method": "POST",
  "message": "Invalid credentials",
  "error": "UnauthorizedException"
}
```

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Rate Limiting

- Default: 10 requests per 60 seconds per IP
- Can be configured via environment variables
- Returns 429 when limit exceeded

---

## Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)

**Response Format:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "data": [...],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+919876543210",
    "password": "Password@123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password@123"
  }'
```

### Get Profile
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Postman Collection

Import the Swagger JSON to Postman:
1. Open Postman
2. Import → Link
3. Enter: `http://localhost:3000/api/v1/docs-json`

---

## Security Headers

The API returns these security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

---

## CORS Configuration

Default allowed origins:
- `http://localhost:3000`
- `http://localhost:4200`

Configure via `CORS_ORIGINS` environment variable.
