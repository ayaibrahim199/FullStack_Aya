# Smart Appointment Booking System

A full-stack appointment booking application with a Spring Boot backend and a React frontend.

## Technology stack

- Backend: Spring Boot 3.4.1, Java 17, Spring Data JPA, Spring Security, JWT, PostgreSQL/H2
- Frontend: React 18, react-router-dom, Axios, react-scripts
- API documentation: Springdoc OpenAPI Swagger UI

## Prerequisites

- Java 17 or newer
- Maven (optional; project includes `./mvnw` wrapper)
- Node.js and npm

## Project layout

- `/backend` - Spring Boot application
- `/frontend` - React single-page application

## Setup

### Backend

1. Open a terminal in the project root.
2. Build the backend:

```bash
cd backend
../mvnw clean package -DskipTests
```

3. The packaged jar will be available at `backend/target/booking-api-0.0.1-SNAPSHOT.jar`.

### Frontend

1. Open another terminal in the project root.
2. Install frontend dependencies:

```bash
cd frontend
npm install
```

## Run the application

### Start backend

From `backend`:

```bash
./mvnw spring-boot:run
```

Or run the packaged jar:

```bash
cd backend
java -jar target/booking-api-0.0.1-SNAPSHOT.jar
```

The backend listens on `http://localhost:8080` by default.

### Start frontend

From `frontend`:

```bash
npm start
```

The React app should launch on `http://localhost:3000`.

## API documentation

Once the backend is running, Swagger UI is available at:

- `http://localhost:8080/swagger-ui.html`

The OpenAPI JSON is available at:

- `http://localhost:8080/api-docs`

## Configuration

Backend configuration is stored in:

- `backend/src/main/resources/application.properties`

This file controls the database connection, JWT settings, and Swagger/OpenAPI paths.

## Frontend backend connection

The frontend calls the API at `http://localhost:8080/api` by default. You can change the base URL in:

- `frontend/src/services/api.js`

If you modify backend port or host, update the frontend configuration accordingly.

## Running tests

### Backend tests

```bash
cd backend
./mvnw test
```

### Frontend tests

```bash
cd frontend
npm test
```

## Notes

- Start the backend before the frontend so the React app can reach the API.
- If ports `8080` or `3000` are already in use, update the backend or frontend configuration.
- The backend currently uses a PostgreSQL datasource by default. Adjust `application.properties` for local or alternate database settings.

## Main application entrypoint

- Backend main class: `com.example.booking.BookingApplication`

## Helpful commands

```bash
# Build backend
cd backend && ../mvnw clean package -DskipTests

# Run backend
cd backend && ./mvnw spring-boot:run

# Install frontend dependencies
cd frontend && npm install

# Run frontend
cd frontend && npm start
```
