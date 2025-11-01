
# SFEP Evidence Tracking System

**Secure Forensic Evidence Platform** - A comprehensive chain of custody management system for law enforcement agencies.

[![CI Pipeline](https://github.com/your-org/sfep/workflows/CI%20Pipeline/badge.svg)](https://github.com/your-org/sfep/actions)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run with Docker
docker-compose up -d
```

Visit `http://localhost:8080` after starting the dev server.

---

## 📋 Features

### Core Functionality
- ✅ **Evidence Management**: Create, track, and manage evidence bags with GPS location
- ✅ **Chain of Custody**: Immutable custody timeline with hash verification
- ✅ **Case Management**: Link evidence to cases with closure enforcement
- ✅ **QR Codes**: Generate and scan QR codes for quick evidence access
- ✅ **File Upload**: Photo upload with SHA-256 integrity verification
- ✅ **Digital Signatures**: Sign custody transfers and closures
- ✅ **Disposal Workflow**: Request and approve evidence disposal

### Advanced Features
- ✅ **Random Audits**: Systematic audit checks with discrepancy tracking
- ✅ **Analytics Dashboard**: Visual insights and statistics
- ✅ **Security Monitor**: Real-time activity and threat detection
- ✅ **Audit Log**: Immutable system-wide activity tracking
- ✅ **Global Search**: Fast search across all entities
- ✅ **Reports**: PDF and CSV export capabilities
- ✅ **Internationalization**: English and Arabic (RTL) support
- ✅ **PWA**: Offline capability with background sync
- ✅ **Dark Mode**: Light/Dark theme support

### Security
- 🔒 **Authentication**: JWT-based with MFA ready
- 🔒 **RBAC**: 4 role types (Admin, Collector, Lab Tech, Investigator)
- 🔒 **RLS**: Database-level row security
- 🔒 **Encryption**: AES-256 for sensitive data, TLS 1.3 in transit
- 🔒 **Immutability**: Tamper-proof audit logs and custody chains
- 🔒 **Hash Chain**: Integrity verification for custody records

---

## 🏗️ Architecture

**Frontend**: React + TypeScript + Vite + Tailwind CSS  
**Backend**: Supabase (PostgreSQL + Auth + Storage)  
**Deployment**: Docker, Vercel, AWS, or Render

```
┌─────────────┐
│  React PWA  │ ← User Interface (Web + Mobile)
└──────┬──────┘
       │ REST/WebSocket
┌──────▼──────┐
│  Supabase   │ ← Backend Services
│  (Lovable   │   - PostgreSQL Database
│   Cloud)    │   - Authentication
│             │   - File Storage
└─────────────┘
```

---

## 📚 Documentation

- [**Deployment Guide**](DEPLOYMENT.md) - How to deploy to production
- [**API Documentation**](API_DOCUMENTATION.md) - Complete API reference
- [**Setup Instructions**](SETUP_INSTRUCTIONS.md) - Initial configuration
- [**Implementation Status**](IMPLEMENTATION_STATUS.md) - Feature checklist
- [**Project Handover**](PROJECT_HANDOVER.md) - Architecture and overview

---

## 🔧 Technology Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **UI Components** | shadcn/ui, Radix UI |
| **Backend** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth (JWT) |
| **Storage** | Supabase Storage (S3-compatible) |
| **State Management** | React Query |
| **Routing** | React Router v6 |
| **i18n** | i18next |
| **PDF Generation** | jsPDF |
| **QR Codes** | qrcode.react |
| **Maps** | Mapbox GL |
| **DevOps** | Docker, GitHub Actions |

---

## 🛠️ Development

### Prerequisites
- Node.js 20+
- npm or yarn
- Git

### Setup

```bash
# Clone repository
git clone <repo-url>
cd sfep-evidence-tracking

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start dev server
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

---

## 🐳 Docker

### Local Development

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Production Build

```bash
# Build image
docker build -t sfep:latest .

# Run container
docker run -p 3000:80 --env-file .env sfep:latest
```

---

## 🔐 Environment Variables

Required variables (automatically configured in Lovable Cloud):

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-key>
VITE_SUPABASE_PROJECT_ID=<your-project-id>
```

Optional:
```env
MAPBOX_PUBLIC_TOKEN=<mapbox-token>  # For map features
RESEND_API_KEY=<resend-key>         # For email notifications
```

---

## 👥 User Roles

| Role | Permissions |
|------|------------|
| **Admin** | Full system access, user management, approvals |
| **Collector** | Create evidence, manage custody |
| **Lab Tech** | Update evidence status, custody transfers |
| **Investigator** | View evidence, create cases |

---

## 🗄️ Database Schema

### Core Tables
- `evidence_bags` - Evidence tracking
- `chain_of_custody_log` - Custody timeline (immutable)
- `cases` - Case management
- `case_evidence` - Evidence-case links
- `evidence_photos` - Photo metadata
- `user_roles` - RBAC implementation
- `audit_log` - System activity (immutable)
- `disposal_requests` - Disposal workflow
- `audit_checks` - Random audits

See [PROJECT_HANDOVER.md](PROJECT_HANDOVER.md) for ERD diagrams.

---

## 🧪 Testing

### Manual Testing
See deployment guide for comprehensive test checklist.

### CI Pipeline
Automated tests run on every push:
- ESLint
- TypeScript type checking
- Docker build
- npm audit

---

## 📱 PWA Features

- ✅ Offline capability
- ✅ Background sync
- ✅ Add to home screen
- ✅ Push notifications (ready)
- ✅ Service worker caching

---

## 🌐 Internationalization

Supported languages:
- English (LTR)
- Arabic (RTL)

Use the language switcher in the header to toggle.

---

## 🚨 Security Considerations

### Before Production
- [ ] Enable HTTPS/TLS 1.3
- [ ] Configure MFA for admins
- [ ] Review all RLS policies
- [ ] Set up session timeout
- [ ] Configure rate limiting
- [ ] Enable audit logging
- [ ] Review CSP headers
- [ ] Conduct security audit
- [ ] Test backup restoration

---

## 📈 Analytics & Monitoring

### Built-in Dashboards
- **Analytics**: Evidence trends, case statistics, user activity
- **Security Monitor**: Failed logins, suspicious activity, active sessions

### Health Check
`GET /health` - Returns service status

---

## 🤝 Contributing

This is a proprietary project. For authorized contributors:

1. Create feature branch
2. Make changes
3. Submit PR with description
4. Await code review
5. Merge after approval

---

## 📄 License

**Proprietary Software**  
© 2025 SFEP Evidence Tracking System  
All Rights Reserved

Unauthorized access, use, or distribution prohibited.

---

## 📞 Support

- **Email**: support@sfep.example.com
- **Documentation**: [docs.sfep.example.com](https://docs.sfep.example.com)
- **Issues**: GitHub Issues (private repository)

---

## 🎯 Roadmap

### Phase 1 (Complete) ✅
- Core evidence management
- Chain of custody
- Case management
- Authentication & RBAC

### Phase 2 (Complete) ✅
- Random audits
- Analytics dashboard
- Security monitoring
- i18n & PWA

### Phase 3 (Future) 📋
- AI anomaly detection
- Blockchain anchoring
- Mobile app
- Real-time collaboration

---

**Built with ❤️ for law enforcement evidence management**
