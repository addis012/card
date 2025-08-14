# CardFlow Pro - Professional Card Provider Services

## Overview
CardFlow Pro is a comprehensive card issuing and management platform providing secure, scalable card services for businesses. It enables users to create and manage virtual and physical cards, track transactions, and integrate via a robust API. This full-stack web application features a modern React frontend with an Express.js backend, designed for professional card provider services. Its business vision includes offering a secure and reliable card management solution with high market potential in financial technology, aiming to be a leading platform for card issuance and transaction management.

## Recent Updates (August 14, 2025)
- ✅ Successfully migrated from Replit Agent to native Replit environment
- ✅ MongoDB Atlas connection established and working properly
- ✅ All environment variables configured securely in Replit Secrets
- ✅ Strowallet API credentials (Addisu's production keys) added and configured
- ✅ Project dependencies installed and application running smoothly
- ✅ .env.example file created for documentation
- ✅ Migration completed successfully with all systems operational

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Frameworks**: React 18 with TypeScript.
- **Build Tool**: Vite for fast development and optimized production builds.
- **Styling**: Tailwind CSS with shadcn/ui components for a consistent, professional design.
- **State Management**: TanStack Query for efficient server state management and caching.
- **Routing**: Wouter for lightweight client-side routing.
- **Form Handling**: React Hook Form with Zod validation for robust form processing.
- **UI/UX Decisions**: Employs shadcn/ui and Radix UI for accessible, professional components and a consistent visual design. Admin and user layouts are separated for clear navigation and dedicated experiences.

### Backend Architecture
- **Framework**: Express.js with TypeScript for API endpoints and middleware.
- **API Design**: RESTful API design with clear separation of concerns.
- **Storage Abstraction**: In-memory storage (MemStorage) as a default data layer with an abstract interface.
- **Error Handling**: Structured route handling with comprehensive error management.
- **Logging**: Request/response logging middleware for debugging.
- **Admin System**: Independent admin system with separate login (`/admin-login`), sessions, and routes, including an enhanced admin panel with professional sidebar navigation for settings, rates, deposit management, and KYC verification.

### Database Design
- **Primary Database**: MongoDB, integrated with MongoDB Atlas for cloud hosting.
- **ODM**: Mongoose for schema definitions and validation.
- **Data Model**: Document-based structure with embedded relationships across seven main collections: Users, Cards, Transactions, API Keys, Deposits, KYC Documents.
- **File Storage**: Files (e.g., KYC documents) are stored directly in MongoDB as Base64 encoded data, with an enhanced KYC schema to store metadata and content.

### Core Features & Technical Implementations
- **Card Management**: Creation, funding, details display, transaction history, blocking/unblocking, and address management via Strowallet API.
- **Authentication**: User and independent admin authentication with Bcrypt password hashing.
- **KYC Workflow**: Two-step registration with mandatory document upload, admin review, and approval process.
- **API Integration**: Full integration with Strowallet API for card operations, including development mock system fallback.
- **File Management**: Dedicated API endpoints (`/api/files/upload`, `/api/files/:documentId`) and a React component (`DatabaseFileUploader`) for seamless database file uploads and retrieval.
- **Security**: All credentials (e.g., MongoDB URI, Strowallet API keys) are stored securely in Replit Secrets.

## External Dependencies

### API Integrations
- **Strowallet API**: For real-time card creation, funding, transaction history, and card management.

### Database
- **MongoDB Atlas**: Cloud-hosted MongoDB service.

### Frontend Libraries
- **React**: Core UI library.
- **Vite**: Frontend build tool.
- **Tailwind CSS**: Utility-first CSS framework.
- **shadcn/ui**: Component library built on Radix UI.
- **TanStack Query**: Data fetching and state management.
- **Wouter**: Client-side routing.
- **React Hook Form**: Form management.
- **Zod**: Schema validation.
- **Radix UI**: Accessible UI primitives.
- **Heroicons**: Icon set.

### Backend Libraries
- **Express.js**: Web application framework.
- **Mongoose**: MongoDB object data modeling.
- **Bcrypt**: Password hashing.

### Utilities
- **date-fns**: Date utility library.
- **clsx / Tailwind Merge**: Utility for conditional CSS classes.