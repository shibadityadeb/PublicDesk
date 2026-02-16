# 🏛️ PublicDesk – Digital Queue & Appointment Management System

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-blue.svg)](https://www.postgresql.org/)

**Eliminate queues. Empower citizens. Transform public service delivery.**

[Features](#-features) • [Architecture](#-system-architecture) • [Installation](#-installation--setup) • [Documentation](#-api-overview) • [Roadmap](#-roadmap)

</div>

---

## 📋 Project Overview

**PublicDesk** is a centralized digital platform designed to revolutionize public service delivery by eliminating manual queues and enabling real-time appointment and token management. It serves as a comprehensive solution for government offices, banks, municipal corporations, RTOs, passport offices, and other public service providers.

The platform empowers citizens to book appointments online, receive digital tokens with QR codes, track their position in the queue in real-time, and receive timely notifications—all while ensuring transparency, reducing corruption, and improving operational efficiency.

---

## 🎯 Problem Statement

Public service delivery in government offices and institutions faces critical challenges:

- **Long Wait Times**: Citizens spend hours waiting in physical queues without visibility into their position or expected service time.
- **Lack of Transparency**: No real-time updates or accountability for service delivery timelines.
- **Corruption & Favoritism**: Manual queue management enables queue jumping and unauthorized prioritization.
- **Inefficient Resource Utilization**: Poor staff and counter allocation leads to bottlenecks and idle resources.
- **Poor User Experience**: No appointment system, leading to overcrowding and dissatisfaction.
- **Data Gaps**: Absence of analytics to identify pain points and optimize operations.

---

## ✅ Solution

PublicDesk addresses these challenges through:

✨ **Digital-First Approach**: Online appointment booking and digital token generation eliminate physical queues.

📊 **Real-Time Visibility**: Citizens can track their queue position and estimated wait time from anywhere.

🔒 **Fraud Prevention**: QR-based token verification and audit trails prevent unauthorized access and queue manipulation.

⚡ **Operational Efficiency**: Counter and staff management tools optimize resource allocation and reduce idle time.

📈 **Data-Driven Insights**: Comprehensive analytics dashboard helps administrators identify bottlenecks and improve service delivery.

🔔 **Proactive Communication**: Automated notifications keep users informed at every stage of their service journey.

---

## 🚀 Features

### For Citizens
- **Online Appointment Booking**: Schedule visits in advance with preferred time slots.
- **Digital Token Generation**: Receive QR-coded tokens via SMS/email.
- **Real-Time Queue Tracking**: Monitor queue position and estimated wait time.
- **Multi-Channel Access**: Web, mobile app, and kiosk support.
- **Service Status Updates**: Push notifications and SMS alerts.
- **Appointment History**: View past and upcoming appointments.

### For Service Providers
- **Counter Management**: Dynamic counter allocation based on service type.
- **Staff Dashboard**: Call next token, manage service time, and update status.
- **Queue Control**: Pause/resume queues, handle priority cases.
- **SLA Monitoring**: Track service delivery times against defined SLAs.
- **Escalation System**: Auto-escalate cases exceeding SLA thresholds.

### For Administrators
- **Analytics Dashboard**: Real-time and historical service metrics.
- **Performance Reports**: Counter efficiency, staff productivity, service trends.
- **Fraud Detection**: Audit logs and anomaly detection.
- **Configuration Management**: Service types, time slots, holidays.
- **Multi-Location Support**: Manage multiple offices/branches from a single platform.

### Technical Features
- **Progressive Web App (PWA)**: Offline-capable mobile experience.
- **High Availability**: Fault-tolerant microservices architecture.
- **Horizontal Scalability**: Handle peak loads with auto-scaling.
- **Security**: JWT authentication, OTP verification, role-based access control.
- **Real-Time Updates**: WebSocket-based live queue status.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
├─────────────┬─────────────┬─────────────┬──────────────────────┤
│  Web App    │  Mobile PWA │   Kiosk     │  Admin Dashboard     │
│  (React)    │   (React)   │  (React)    │     (React)          │
└─────────────┴─────────────┴─────────────┴──────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API GATEWAY                               │
│              (Load Balancer + Nginx + Rate Limiting)            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MICROSERVICES LAYER                         │
├──────────┬──────────┬──────────┬──────────┬──────────┬─────────┤
│  Auth    │  Queue   │  Token   │Appointment│ Notify   │Analytics│
│ Service  │ Service  │ Service  │  Service  │ Service  │ Service │
└──────────┴──────────┴──────────┴──────────┴──────────┴─────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   PostgreSQL    │ │      Redis      │ │   RabbitMQ      │
│   (Primary DB)  │ │     (Cache)     │ │ (Message Queue) │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Architecture Principles

- **Microservices**: Independent, loosely-coupled services for scalability and maintainability.
- **Event-Driven**: Asynchronous communication via message queues for decoupling.
- **CQRS Pattern**: Separate read and write operations for optimal performance.
- **Caching Layer**: Redis for session management and frequently accessed data.
- **Database Replication**: Master-slave PostgreSQL setup for high availability.
- **Horizontal Scaling**: Container orchestration with Docker Swarm/Kubernetes.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18.x | UI components and state management |
| | PWA | Offline support and mobile experience |
| | TypeScript | Type safety and developer productivity |
| | TailwindCSS | Utility-first styling |
| **Backend** | Node.js 18.x | Runtime environment |
| | NestJS / Express | RESTful API framework |
| | TypeScript | Type-safe backend code |
| **Database** | PostgreSQL 15.x | Primary relational database |
| | Redis 7.x | Caching and session store |
| **Messaging** | RabbitMQ | Asynchronous task processing |
| **Authentication** | JWT | Stateless authentication |
| | OTP (Twilio/AWS SNS) | Phone verification |
| **DevOps** | Docker | Containerization |
| | Docker Compose | Local development orchestration |
| | Nginx | Reverse proxy and load balancing |
| | PM2 | Process management |
| **Monitoring** | Winston | Application logging |
| | Prometheus | Metrics collection |
| | Grafana | Visualization and dashboards |

---

## 📦 Installation & Setup

### Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 15.x
- Redis >= 7.x
- RabbitMQ >= 3.x
- Docker & Docker Compose (optional)

### Local Development Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/shibadityadeb/PublicDesk.git
   cd PublicDesk
   ```

2. **Install Dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Configure Environment Variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

4. **Setup Database**
   ```bash
   # Create database
   psql -U postgres
   CREATE DATABASE publicdesk;
   
   # Run migrations
   cd backend
   npm run migration:run
   ```

5. **Start Redis and RabbitMQ**
   ```bash
   # Using Homebrew (macOS)
   brew services start redis
   brew services start rabbitmq
   
   # Or using Docker
   docker run -d -p 6379:6379 redis:7-alpine
   docker run -d -p 5672:5672 -p 15672:15672 rabbitmq:3-management
   ```

6. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run start:dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

7. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - RabbitMQ Management: http://localhost:15672

---

## 🔐 Environment Variables

### Backend (.env)

```bash
# Application
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=publicdesk

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_EXPIRES_IN=7d

# OTP Service
OTP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Security
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_WS_URL=ws://localhost:5000

# Application
REACT_APP_NAME=PublicDesk
REACT_APP_VERSION=1.0.0

# Features
REACT_APP_ENABLE_PWA=true
REACT_APP_ENABLE_ANALYTICS=true

# Google Maps (optional)
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

---

## 🐳 Running with Docker

### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up -d --build
```

### Docker Compose Services

```yaml
services:
  - frontend (React PWA)
  - backend (NestJS API)
  - postgres (Database)
  - redis (Cache)
  - rabbitmq (Message Queue)
  - nginx (Reverse Proxy)
```

### Manual Docker Build

```bash
# Build backend image
docker build -t publicdesk-backend ./backend

# Build frontend image
docker build -t publicdesk-frontend ./frontend

# Run containers
docker run -d -p 5000:5000 --name backend publicdesk-backend
docker run -d -p 3000:80 --name frontend publicdesk-frontend
```

---

## 📡 API Overview

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login with credentials |
| POST | `/auth/verify-otp` | Verify OTP |
| POST | `/auth/refresh-token` | Refresh access token |
| POST | `/auth/logout` | Logout user |

### Appointment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/appointments` | List user appointments |
| POST | `/appointments` | Create new appointment |
| GET | `/appointments/:id` | Get appointment details |
| PATCH | `/appointments/:id` | Update appointment |
| DELETE | `/appointments/:id` | Cancel appointment |

### Token Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/tokens/generate` | Generate digital token |
| GET | `/tokens/:id` | Get token details |
| PATCH | `/tokens/:id/status` | Update token status |
| GET | `/tokens/verify-qr` | Verify QR code |

### Queue Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/queues/active` | Get active queues |
| GET | `/queues/:id/status` | Get queue status |
| GET | `/queues/:id/position` | Get user position |
| POST | `/queues/:id/call-next` | Call next token (staff) |

### Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/dashboard` | Dashboard metrics |
| GET | `/analytics/reports` | Generate reports |
| GET | `/analytics/service-stats` | Service statistics |
| GET | `/analytics/staff-performance` | Staff metrics |

### WebSocket Events

```javascript
// Connect
ws://localhost:5000?token=<jwt_token>

// Subscribe to queue updates
socket.emit('subscribe:queue', { queueId: 123 });

// Listen for queue position updates
socket.on('queue:position-update', (data) => {
  console.log('New position:', data.position);
});

// Listen for token call
socket.on('token:called', (data) => {
  console.log('Token called:', data.tokenNumber);
});
```

---

## 📁 Folder Structure

```
PublicDesk/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── appointments/
│   │   │   ├── tokens/
│   │   │   ├── queues/
│   │   │   ├── notifications/
│   │   │   ├── analytics/
│   │   │   └── users/
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   ├── filters/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   └── pipes/
│   │   ├── config/
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   └── main.ts
│   ├── test/
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── appointments/
│   │   │   ├── queue/
│   │   │   ├── tokens/
│   │   │   └── dashboard/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── utils/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── .gitignore
├── LICENSE
└── README.md
```

---

## 📸 Screenshots

> **Note**: Add screenshots here showcasing key features:

- [ ] Citizen Dashboard
- [ ] Appointment Booking Flow
- [ ] Digital Token with QR Code
- [ ] Real-Time Queue Tracking
- [ ] Staff Counter Management
- [ ] Admin Analytics Dashboard
- [ ] Mobile PWA Experience
- [ ] Kiosk Interface

---

## 🗺️ Roadmap

### Phase 1: MVP (Completed)
- [x] User authentication with OTP
- [x] Appointment booking system
- [x] Digital token generation
- [x] Basic queue management
- [x] Counter management for staff
- [x] Real-time notifications

### Phase 2: Enhancement (In Progress)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support (i18n)
- [ ] Mobile app (React Native)
- [ ] Kiosk mode interface
- [ ] Payment gateway integration
- [ ] Document upload for appointments

### Phase 3: Scale & Optimize
- [ ] AI-based queue prediction
- [ ] Voice assistant integration
- [ ] Biometric verification
- [ ] Blockchain-based audit trail
- [ ] Advanced fraud detection
- [ ] Multi-tenant architecture

### Phase 4: Ecosystem
- [ ] Third-party integrations (DigiLocker, Aadhaar)
- [ ] Public API for partner organizations
- [ ] White-label solution
- [ ] Citizen feedback system
- [ ] Compliance certifications (ISO 27001)

---

## 🔮 Future Scope

- **AI/ML Integration**: Predictive analytics for queue management and resource optimization.
- **IoT Integration**: Hardware token dispensers and digital signage.
- **Blockchain**: Immutable audit logs for transparency and compliance.
- **Multi-Tenancy**: SaaS model for multiple organizations.
- **Video KYC**: Remote verification for sensitive services.
- **Chatbot Support**: AI-powered citizen assistance.
- **Geolocation Services**: Nearest service center recommendations.
- **Citizen Feedback Loop**: Rating system and grievance redressal.

---

## 🤝 Contribution Guidelines

We welcome contributions from the community! Please follow these guidelines:

### How to Contribute

1. **Fork the Repository**
   ```bash
   git clone https://github.com/shibadityadeb/PublicDesk.git
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Follow existing code style and conventions
   - Write meaningful commit messages
   - Add tests for new features
   - Update documentation as needed

4. **Test Your Changes**
   ```bash
   npm run test
   npm run lint
   ```

5. **Submit a Pull Request**
   - Provide a clear description of changes
   - Reference related issues
   - Ensure all CI checks pass

### Code Style

- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write unit tests for business logic
- Document complex functions with JSDoc comments

### Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- Provide detailed reproduction steps
- Include environment details (OS, Node version, etc.)

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 Shibaditya Deb

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👤 Author

**Shibaditya Deb**

- GitHub: [@shibadityadeb](https://github.com/shibadityadeb)
- LinkedIn: [Connect on LinkedIn](https://linkedin.com/in/shibadityadeb)
- Email: contact@shibadityadeb.dev

---

## 🙏 Acknowledgments

- Inspired by the need to modernize public service delivery
- Built with open-source technologies and community support
- Special thanks to all contributors and early adopters

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

**Made with ❤️ for a better citizen experience**

</div>
