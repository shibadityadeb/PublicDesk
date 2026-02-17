# PublicDesk - Digital Queue & Appointment Management System

## 🎯 Project Overview

A comprehensive GovTech platform for managing digital queues, appointments, and citizen services at government offices. Built with modern, scalable technologies following clean architecture principles.

---

## 📂 Repository Structure

```
PublicDesk/
├── backend/                    # ✅ COMPLETED - NestJS Backend API
│   ├── src/                   # Source code
│   ├── docker/                # Docker configurations
│   ├── test/                  # Test files
│   ├── README.md              # Backend documentation
│   ├── QUICKSTART.md          # Quick start guide
│   ├── API_GUIDE.md           # API usage guide
│   ├── DEVELOPMENT.md         # Developer notes
│   ├── ARCHITECTURE.md        # System architecture
│   ├── PROJECT_SUMMARY.md     # Completion summary
│   └── setup.sh               # Automated setup script
├── docs/                      # Design documents
│   ├── classDiagram.md
│   ├── ERDiagram.md
│   ├── sequenceDiagram.md
│   ├── useCaseDiagram.md
│   └── idea.md
└── README.md                  # This file
```

---

## ✅ Completed: Backend API (Phase 1)

The backend is **fully functional and production-ready**!

### What's Included
- ✅ **Authentication System** - JWT + OTP verification
- ✅ **User Management** - Registration, login, roles, profiles
- ✅ **Authorization** - Role-based access control (5 roles)
- ✅ **Security** - Password hashing, rate limiting, input validation
- ✅ **Database** - PostgreSQL with TypeORM
- ✅ **Caching** - Redis integration
- ✅ **Messaging** - RabbitMQ for async tasks
- ✅ **Documentation** - Swagger API docs
- ✅ **Docker** - Complete containerization
- ✅ **Testing** - Unit & E2E test structure

### Quick Start

```bash
# Navigate to backend
cd backend

# Start with Docker (includes PostgreSQL, Redis, RabbitMQ)
docker-compose up -d

# Access Swagger API documentation
open http://localhost:3000/api/v1/docs
```

**For detailed instructions, see [backend/QUICKSTART.md](backend/QUICKSTART.md)**

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Git

### Setup Backend

```bash
# Clone and navigate
cd PublicDesk/backend

# Quick setup with Docker
cp .env.example .env
docker-compose up -d

# Or use automated setup script
./setup.sh
```

### Access Points
- **API**: http://localhost:3000/api/v1
- **Swagger Docs**: http://localhost:3000/api/v1/docs
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)

---

## 📚 Documentation

### Backend Documentation
1. **[backend/README.md](backend/README.md)** - Complete backend documentation
2. **[backend/QUICKSTART.md](backend/QUICKSTART.md)** - Quick start guide
3. **[backend/API_GUIDE.md](backend/API_GUIDE.md)** - API usage examples
4. **[backend/DEVELOPMENT.md](backend/DEVELOPMENT.md)** - Developer notes
5. **[backend/ARCHITECTURE.md](backend/ARCHITECTURE.md)** - System architecture
6. **[backend/PROJECT_SUMMARY.md](backend/PROJECT_SUMMARY.md)** - Completion summary

### Design Documents
- [Class Diagram](classDiagram.md)
- [ER Diagram](ERDiagram.md)
- [Sequence Diagram](sequenceDiagram.md)
- [Use Case Diagram](useCaseDiagram.md)
- [Project Idea](idea.md)

---

## 🎯 Features

### Current (Phase 1) ✅
- [x] User authentication (JWT + OTP)
- [x] User management & profiles
- [x] Role-based access control
- [x] Email/Phone verification
- [x] Password management
- [x] Admin user management
- [x] Comprehensive API documentation

### Upcoming (Phase 2)
- [ ] Office management
- [ ] Service catalog
- [ ] Appointment booking
- [ ] Token generation (QR codes)
- [ ] Queue management
- [ ] Real-time updates

### Future (Phase 3)
- [ ] SLA monitoring
- [ ] Escalation system
- [ ] Notification system
- [ ] Analytics & reporting
- [ ] Admin dashboard

---

## 🛠 Technology Stack

### Backend
- **Framework**: NestJS 10.x (TypeScript)
- **Database**: PostgreSQL 16
- **ORM**: TypeORM
- **Cache**: Redis 7
- **Queue**: RabbitMQ 3
- **Auth**: JWT + Passport
- **Docs**: Swagger/OpenAPI
- **Container**: Docker

### Frontend (Planned)
- React/Next.js or Angular
- TypeScript
- Tailwind CSS
- State management

---

## 👥 User Roles

| Role | Description |
|------|-------------|
| **SUPER_ADMIN** | Full system access |
| **ADMIN** | Office administration |
| **SUPERVISOR** | Queue monitoring |
| **OFFICER** | Service desk operations |
| **CITIZEN** | Public user |

---

## 🔐 Security Features

- ✅ JWT authentication with refresh tokens
- ✅ Password hashing (bcrypt, 10 rounds)
- ✅ OTP verification (email/SMS)
- ✅ Rate limiting (10 req/min)
- ✅ Input validation
- ✅ SQL injection protection
- ✅ Role-based authorization
- ✅ CORS configuration

---

## 📊 API Endpoints Summary

### Authentication (8 endpoints)
- Register, Login, Verify Email, Resend OTP
- Refresh Token, Logout, Get Profile

### User Management (10 endpoints)
- List Users, Get Profile, Update Profile
- Change Password, Manage Roles/Status
- User Statistics, Delete User

**Total: 18 working endpoints**

See [API_GUIDE.md](backend/API_GUIDE.md) for details.

---

## 🧪 Testing

```bash
cd backend

# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## 📦 Deployment

### Development
```bash
cd backend
docker-compose up -d
```

### Production
```bash
cd backend
docker-compose -f docker-compose.prod.yml up -d
```

See [backend/README.md](backend/README.md) for deployment checklist.

---

## 🗺 Project Roadmap

### ✅ Phase 1 (Completed)
- Project setup & architecture
- Authentication & authorization
- User management
- Docker deployment
- API documentation

### 🚧 Phase 2 (Next)
- Office module
- Service module
- Appointment booking
- Token/Queue system

### 📋 Phase 3 (Planned)
- Real-time updates (WebSocket)
- SLA monitoring
- Notifications
- Analytics dashboard

### 🔮 Phase 4 (Future)
- Mobile apps
- Kiosk displays
- Multi-language support
- Advanced analytics

---

## 💡 Quick Commands

```bash
# Backend development
cd backend
npm run start:dev

# Docker services
docker-compose up -d          # Start all
docker-compose down           # Stop all
docker-compose logs -f app    # View logs

# Database access
docker exec -it publicdesk-postgres psql -U publicdesk -d publicdesk_db
```

---

## 📈 Project Status

| Module | Status | Progress |
|--------|--------|----------|
| **Backend API** | ✅ Completed | 100% |
| **Authentication** | ✅ Completed | 100% |
| **User Management** | ✅ Completed | 100% |
| **Office Module** | 📋 Planned | 0% |
| **Service Module** | 📋 Planned | 0% |
| **Appointment Module** | 📋 Planned | 0% |
| **Queue Module** | 📋 Planned | 0% |
| **Frontend** | 📋 Planned | 0% |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Update documentation
6. Submit a pull request

---

## 📄 License

UNLICENSED - Private project

---

## 📞 Support

For issues or questions:
1. Check the documentation in [backend/](backend/)
2. Review [backend/DEVELOPMENT.md](backend/DEVELOPMENT.md)
3. Open an issue on GitHub

---

## 🎉 Acknowledgments

Built with modern technologies and best practices:
- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [TypeORM](https://typeorm.io/) - ORM for TypeScript
- [PostgreSQL](https://www.postgresql.org/) - Robust database
- [Redis](https://redis.io/) - In-memory data store
- [RabbitMQ](https://www.rabbitmq.com/) - Message broker
- [Docker](https://www.docker.com/) - Containerization

---

## 🚀 Get Started Now!

```bash
# Clone the repository
git clone <your-repo-url>
cd PublicDesk/backend

# Run automated setup
./setup.sh

# Or manual setup with Docker
cp .env.example .env
docker-compose up -d

# Access Swagger documentation
open http://localhost:3000/api/v1/docs
```

**The backend is ready to use! Start building the next features! 🎊**

---

**Last Updated**: 2026-02-17  
**Version**: 1.0.0  
**Status**: Backend MVP Complete ✅
