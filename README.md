# Astraiv Technologies - Admin Dashboard (CMS & CRM)

Superuser & Admin management portal for Astraiv Technologies.

## 🌐 Domains
- Production: `https://superuser.admin.astraivtechnologies.com`

## 🛠️ Tech Stack
- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4
- Prisma ORM (PostgreSQL / Supabase)
- Better Auth (Admin Role Guard)
- TanStack Table & Recharts
- Framer Motion & Lucide Icons

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.x
- PostgreSQL database (or Supabase instance)

### Installation
```bash
npm install
```

### Environment Setup
Create a `.env` file with the following variables:
```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="your-secret"
BETTER_AUTH_URL="http://localhost:3001"
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```

### Database Setup
```bash
npx prisma generate
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3001](http://localhost:3001) with your browser.

### Production Build
```bash
npm run build
npm start
```
