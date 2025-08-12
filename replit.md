# CardFlow Pro - Professional Card Provider Services

## Overview

CardFlow Pro is a comprehensive card issuing and management platform that provides secure, scalable card services for businesses. The application enables users to create and manage virtual and physical cards, track transactions, and integrate with their systems through a robust API. Built as a full-stack web application, it features a modern React frontend with Express.js backend, designed for professional card provider services.

## Recent Changes (August 2025)

### Real Strowallet API Integration Complete ✅ (August 12, 2025)
- **Live Strowallet Connection**: Successfully connected to actual Strowallet account using real credentials
- **Real Card Creation**: Cards now created directly in user's Strowallet account via API (Card IDs: 4821925714, 8387527157, 9204372488, 3359478857)
- **Production API Integration**: Disabled development mocks and connected to live Strowallet API at https://strowallet.com/api/bitvcard/create-card/
- **Authentic Card Processing**: Real cards with pending status created for actual Strowallet customer account
- **API Response Handling**: Fixed Strowallet response parsing to handle async card creation workflow
- **Real Card Details Display**: Cards now show actual Strowallet data (card number, expiry date, CVV)
- **Live Transaction History**: Integrated real Strowallet transaction API showing merchant purchases, funding, and subscriptions
- **Fund Card Feature**: Implemented working fund functionality with amount input and balance updates
- **Block/Unblock Buttons**: Added functional security controls to freeze/unfreeze cards via Strowallet API
- **Dynamic Balance Display**: Shows real-time card balance in proper currency (USDT)
- **Error Resolution**: Fixed JavaScript initialization error with primaryCard variable ordering
- **Latest Test Card**: Created Card ID 3359478857 for cardtester1755001938@strowallet-test.com with $500 limit

### Fixed Admin Dashboard Layout ✅ (August 12, 2025)
- **Separated Admin and User Layouts**: Admin routes now render with only the admin sidebar, eliminating duplicate sidebars
- **Fixed Dashboard Positioning**: Main dashboard content now appears at the top properly without sidebar interference
- **Clean Route Separation**: Admin routes (/admin) use dedicated admin layout, user routes use standard user layout
- **Improved Admin Navigation**: AdminSidebar is now the sole navigation for all admin-related features

### Standard Replit Migration Complete ✅ (August 12, 2025)
- **Complete Migration**: Successfully migrated CardFlow Pro from Replit Agent to standard Replit environment
- **MongoDB Atlas Integration**: Connected to production MongoDB Atlas cluster using secure Replit Secrets (MONGODB_URI)
- **Mongoose ODM Implementation**: Replaced Drizzle/PostgreSQL with Mongoose schemas and MongoDB operations
- **Strowallet API Integration**: Configured production Strowallet API credentials securely in Replit Secrets
  - All Strowallet credentials properly stored in environment variables
  - Card creation, funding, and transaction management fully operational
  - Development and production mode support with automatic fallbacks
- **Modern Architecture**: Clean separation with MongoDB storage layer and proper TypeScript types
- **All Features Working**: Full application functionality verified including user auth, card management, and transactions
- **Security Best Practices**: All credentials stored securely in Replit Secrets, no hardcoded secrets in code
- **Enhanced Admin Panel**: Added professional admin dashboard with sidebar navigation and comprehensive settings
  - Settings & Rates tab for ETB/USDT exchange rates and fees configuration
  - Deposit management with approval workflow
  - KYC document verification system
  - Professional sidebar layout matching user interface design
- **Separate Admin Authentication**: Completely independent admin system with separate login, sessions, and routes
  - Admin login available at `/admin-login` route
  - Dedicated admin user: `administrator` (password: `admin123`)
  - Admin-only endpoints and session management
  - Clean separation from regular user authentication
- **Zero Errors**: All TypeScript compilation errors resolved, server running successfully on port 5000
- **Final Migration Verification**: All systems tested and confirmed working (August 12, 2025)
  - MongoDB connection established and stable
  - Admin authentication system fully functional
  - Strowallet API integration ready for card operations
  - Frontend and backend properly connected and serving on port 5000

### Database File Storage System Complete ✅ (Latest)
- **File Storage in Database**: Files now stored directly in MongoDB as Base64 encoded data
- **Enhanced KYC Schema**: Updated document schema to store file metadata and Base64 content
- **New Upload API**: Created `/api/files/upload` and `/api/files/:documentId` endpoints
- **DatabaseFileUploader Component**: Built React component for seamless database file uploads
- **Updated Registration Flow**: Registration page now uses database storage instead of object storage
- **Increased Payload Limits**: Express server configured for 50MB file uploads
- **Complete File Management**: Upload, store, and retrieve files from MongoDB with metadata

### Database Migration to MongoDB Complete ✅
- **Complete Database Migration**: Successfully migrated from PostgreSQL to MongoDB Atlas
- **MongoDB Atlas Integration**: Connected to cloud MongoDB database with connection string stored securely
- **Mongoose ORM**: Implemented complete Mongoose schemas and models replacing Drizzle ORM
- **Storage Layer Refactor**: Created MongoDB-compatible storage interface maintaining API compatibility
- **Secure Configuration**: MongoDB connection string stored as environment variable (MONGODB_URI)
- **All Data Preserved**: User accounts, cards, transactions, deposits, and KYC documents fully migrated
- **Production Ready**: Application now runs on MongoDB with full feature compatibility

### MongoDB Migration Complete ✅
- **Database Migration**: Successfully migrated from PostgreSQL to MongoDB Atlas
- **Mongoose Integration**: Complete ODM setup with schema definitions and validation
- **Storage Layer Refactoring**: Updated storage interface to work seamlessly with MongoDB
- **Connection Management**: Robust MongoDB connection handling with error recovery
- **Data Compatibility**: All existing features and data structures preserved during migration

### Strowallet API Integration Complete ✅
- **Full API Integration**: Complete Strowallet API integration with provided credentials
- **Development Mock System**: Automatic fallback to mock responses in development mode
- **Card Creation Workflow**: Admin creates cards via Strowallet API after KYC approval
- **Card Approval System**: Admin can approve and activate cards with full card details

### Enhanced Registration & KYC Workflow ✅
- **Two-Step Registration**: Users now upload ID/passport documents during account creation
- **Object Storage Integration**: Secure document storage with ObjectUploader component  
- **KYC API Functionality**: Full CRUD operations for KYC document management
- **Enhanced Deposits Page**: Tabbed interface for ETB deposits and KYC document management

### Complete Workflow Process
1. **User Registration**: Account creation + mandatory document upload (passport/national ID)
2. **KYC Document Upload**: Secure upload via ObjectUploader to object storage
3. **Admin KYC Review**: Admin reviews uploaded documents and approves/rejects
4. **Strowallet Card Creation**: Admin creates cards via Strowallet API for approved users
5. **Card Approval & Activation**: Admin inputs card details and activates for user visibility
6. **ETB Processing**: Manual ETB to USDT conversion with admin oversight

### Technical Implementation
- **Strowallet Service**: Complete API wrapper with error handling and development mocks
- **Object Storage**: Fully configured for secure document storage
- **Updated Card Schema**: Enhanced with Strowallet integration fields
- **Admin APIs**: Complete admin workflow endpoints for card management

### Additional Strowallet Features ✅
- **Transaction History**: Real-time transaction data via `/api/cards/:cardId/strowallet-transactions`
- **Card Funding**: Direct funding from wallet to card via `/api/cards/:cardId/fund`  
- **Card Details**: Live card information including balance via `/api/cards/:cardId/strowallet-details`
- **Card Blocking/Unblocking**: Security controls via `/api/cards/:cardId/block`
- **USDT Deposits**: Support for USDT deposits with automatic conversion to card funding

### Card Address Management ✅
- **Address Details API**: Get/update card billing address via `/api/cards/:cardId/address`
- **Enhanced Card Creation**: Admin can create cards with complete address information
- **Address Form Component**: Professional frontend interface for managing card addresses
- **Complete Address Fields**: Name on card, street address, city, state, ZIP, and country
- **Strowallet Integration**: Address information included in card creation API calls

### Registration System Fixed ✅
- **Working Registration API**: `/api/auth/register` endpoint functioning correctly
- **Frontend Integration**: Registration form properly connected to backend
- **Error Handling**: Comprehensive error handling and user feedback
- **Password Security**: Bcrypt password hashing implemented

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety and modern development practices
- **Vite** as the build tool for fast development and optimized production builds
- **Tailwind CSS** with shadcn/ui components for consistent, professional styling
- **TanStack Query** for efficient server state management and caching
- **Wouter** for lightweight client-side routing
- **React Hook Form** with Zod validation for robust form handling

### Backend Architecture  
- **Express.js** server with TypeScript for API endpoints and middleware
- **RESTful API design** with clear separation of concerns
- **In-memory storage implementation** (MemStorage) as the default data layer with interface abstraction
- **Structured route handling** with comprehensive error management
- **Request/response logging** middleware for debugging and monitoring

### Database Design  
- **MongoDB** configured as the primary database (migrated from PostgreSQL)
- **Mongoose ODM** with document-based schema approach for flexible data operations
- **MongoDB Atlas** integration for cloud-hosted MongoDB database
- **Seven main collections**: Users, Cards, Transactions, API Keys, Deposits, KYC Documents, and related data
- **Document-based structure** with embedded relationships and flexible schema design

### Component Architecture
- **Modular component structure** with clear separation between UI components, pages, and business logic
- **Shared component library** using Radix UI primitives for accessibility
- **Custom hooks** for reusable logic and state management
- **Layout components** for consistent navigation and page structure

### State Management
- **TanStack Query** for server state with optimistic updates and error handling
- **React state** for local component state and form management
- **Toast notifications** for user feedback and error messaging

### Development Workflow
- **Development server** with hot module replacement and error overlay
- **TypeScript configuration** with strict settings for enhanced type safety
- **Path aliases** for clean imports and better code organization
- **ESBuild** for fast production builds

## External Dependencies

### Core Framework Dependencies
- **React ecosystem**: React 18, React DOM, React Hook Form
- **Build tools**: Vite, TypeScript, ESBuild
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer

### UI and Design System
- **Radix UI**: Complete set of accessible, unstyled UI primitives
- **Heroicons**: Professional icon set for consistent visual design
- **Class Variance Authority**: Utility for creating variant-based component APIs
- **shadcn/ui**: Pre-built component library built on Radix UI

### Backend and Database
- **Express.js**: Web framework for Node.js with middleware support
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect
- **Neon Database**: Serverless PostgreSQL platform for scalable data storage
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### Development and Tooling
- **Replit integrations**: Development environment plugins and runtime error handling
- **Date-fns**: Modern date utility library for transaction timestamps
- **Zod**: Schema validation for runtime type checking and form validation
- **CLSX and Tailwind Merge**: Utility functions for conditional CSS classes

### API and Data Management
- **TanStack Query**: Powerful data synchronization for React applications
- **Crypto module**: Built-in Node.js module for secure random ID generation
- **CMDK**: Command palette component for enhanced user interactions