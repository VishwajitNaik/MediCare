# Hospital Management System

A comprehensive hospital management system built with Next.js, featuring separate interfaces for doctors, medical staff, and administrators.

## Features

- **Doctor Portal**: Patient management, prescription creation
- **Medical Staff Portal**: Prescription fulfillment, inventory management
- **Admin Dashboard**: System statistics and overview
- **Secure Authentication**: JWT-based authentication with role-based access

## Setup

### Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your actual values:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/hospital_management

   # Authentication
   JWT_SECRET=your_super_secret_jwt_key_here_change_in_production

   # Next.js
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_here
   ```

### Installation

```bash
npm install
# or
yarn install
```

### Database Setup

Make sure MongoDB is running locally, or update `MONGODB_URI` to point to your MongoDB instance.

### Development

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Routes

### Authentication
- `POST /api/auth/doctor/signup` - Doctor registration
- `POST /api/auth/doctor/signin` - Doctor login
- `POST /api/auth/medical/signup` - Medical staff registration
- `POST /api/auth/medical/signin` - Medical staff login
- `POST /api/auth/logout` - Logout

### Doctor Routes (Authenticated as DOCTOR)
- `POST /api/doctor/patients/create` - Create patient
- `GET /api/doctor/patients/list` - List doctor's patients
- `GET/PUT/DELETE /api/doctor/patients/[id]` - Patient CRUD
- `POST /api/doctor/prescriptions/create` - Create prescription
- `GET /api/doctor/prescriptions/list` - List prescriptions

### Medical Routes (Authenticated as MEDICAL)
- `GET /api/medical/prescriptions/fetch` - Get pending prescriptions
- `POST /api/medical/prescriptions/fulfill` - Fulfill prescription
- `POST /api/medical/inventory/add` - Add/update inventory
- `GET /api/medical/inventory/list` - List inventory

### Common Routes (Any authenticated user)
- `GET /api/common/medicines` - List medicines
- `GET /api/common/patients` - List all patients

### Admin Routes
- `GET /api/admin/stats` - System statistics

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Authentication pages
│   │   ├── api/              # API routes
│   │   ├── dashboard/        # Admin dashboard
│   │   ├── doctor/           # Doctor interface
│   │   ├── medical/          # Medical staff interface
│   │   ├── page.js           # Home page
│   │   └── layout.js         # Root layout
│   ├── lib/
│   │   ├── mongodb.js        # Database connection
│   │   └── auth.js           # Authentication utilities
│   └── models/               # Mongoose models
├── .env.example              # Environment variables template
└── .env.local               # Local environment variables (gitignored)
```

## Security

- Environment variables are properly configured and gitignored
- JWT tokens are used for authentication
- Passwords are hashed with bcrypt
- Role-based access control implemented
- Sensitive data is never exposed to the client

## Development Notes

- The application includes graceful error handling and can run without a database connection
- All routes include proper authentication checks
- The UI uses minimal styling for clarity and functionality
