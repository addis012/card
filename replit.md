# CardFlow Pro - Professional Card Provider Services

## Overview

CardFlow Pro is a comprehensive card issuing and management platform that provides secure, scalable card services for businesses. The application enables users to create and manage virtual and physical cards, track transactions, and integrate with their systems through a robust API. Built as a full-stack web application, it features a modern React frontend with Express.js backend, designed for professional card provider services.

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
- **PostgreSQL** configured as the primary database (via Drizzle configuration)
- **Drizzle ORM** with schema-first approach for type-safe database operations
- **Neon Database** integration for serverless PostgreSQL hosting
- **Four main entities**: Users, Cards, Transactions, and API Keys
- **Relational structure** with proper foreign key constraints and data integrity

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