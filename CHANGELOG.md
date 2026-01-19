# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-19

### Added
- **Initial Release** of Smart Appointment Booking System
- **JWT Authentication** with role-based access (Student/Teacher)
- **Booking Workflow**: Complete approval process (PENDING → CONFIRMED/REJECTED/CANCELLED)
- **Student Features**:
  - Browse and book available appointment slots
  - Comprehensive statistics dashboard with analytics
  - Real-time booking status tracking
  - Ability to cancel confirmed bookings
- **Teacher Features**:
  - Create and manage available time slots
  - Approve or reject student booking requests
  - Dashboard for pending bookings management
- **Backend (Spring Boot 3.4.1)**:
  - RESTful API with comprehensive endpoints
  - JWT security configuration
  - H2 in-memory database for easy setup
  - Data initialization with demo users
  - Proper DTO pattern to avoid JSON serialization issues
- **Frontend (React 18)**:
  - Modern, responsive UI design
  - Professional dashboard interfaces
  - Real-time status updates
  - Mobile-friendly responsive design
- **Documentation**:
  - Comprehensive README with setup instructions
  - API documentation with example requests
  - Contributing guidelines
  - MIT License for open-source distribution

### Technical Details
- **Backend**: Java 17, Spring Boot 3.4.1, Spring Security, JWT, H2 Database
- **Frontend**: React 18, Modern CSS, Responsive Design
- **Build Tools**: Maven (backend), npm (frontend)
- **Testing**: Comprehensive test coverage for critical components

### Demo Data
- **Teacher Account**: `teacher@example.com` / `password123`
- **Student Account**: `student@example.com` / `password123`
