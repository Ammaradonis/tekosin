# TÊKOȘÎN Admin Panel

**Verein für LGBTIQ-Geflüchtete und Migrant\*innen in Wien**

> ⚠️ This NGO does NOT offer housing or legal consultations.

## Tech Stack

- **Backend**: Node.js, Express, Sequelize ORM, PostgreSQL
- **Frontend**: React, Redux Toolkit, TailwindCSS, Chart.js, i18next
- **Auth**: JWT with refresh tokens, RBAC (Super Admin, Admin, 6 Sub-admin roles, Members)
- **Payments**: PayPal Express Checkout (server-side order creation, IPN, refunds, subscriptions)
- **Languages**: German (default), English, Turkish, Arabic, Farsi, Spanish

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (running on port 4040)

### Backend Setup
```bash
cd backend
npm install
# Edit .env if needed (DB_PORT, DB_PASSWORD, etc.)
node seeders/seed.js   # Seeds 2000+ mock records
node server.js         # Starts on port 3001
```

### Frontend Setup
```bash
cd frontend
npm install
npm start              # Starts on port 3000
```

### Login Credentials
| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@tekosin.org | Admin123! |
| Admin | muco@tekosin.org | Admin123! |
| Sub-admins | [role]@tekosin.org | Admin123! |

## Features

- **Dashboard**: Real-time stats, charts, crisis countdown timers
- **Member Management**: CRUD, search/filter, bulk ops, GDPR compliance
- **Payments**: PayPal integration, manual entries, refunds, CSV/PDF export
- **User Management**: RBAC, provisioning, password resets
- **Events**: CRUD with multi-language support
- **Content CMS**: Pages, blog, documents with versioning
- **Volunteers**: Management and tracking
- **Notifications**: In-app, email stubs, SMS stubs
- **Audit Logs**: Full action tracking
- **Reports**: Demographics, funding, utilization
- **Newsletters**: Multi-language, bulk send
- **Exports**: CSV/PDF with filters

## Contact

- 📧 tekosinlgbti@gmx.at
- 📱 +436508924805
- 📍 Schwarzhorngasse 1, 1050 Wien
- 📸 [@tekosin.lgbtiq](https://www.instagram.com/tekosin.lgbtiq/)

---

❤️ Made with passion by Anna & Muco ❤️
