# PetStore Pro

PetStore Pro is a local pet-store inventory and sales application. The repository contains a React/Vite frontend and a Spring Boot API. Docker Compose starts the frontend, API, and PostgreSQL database together.

## Run the complete app locally

Requirements: Docker Desktop with the Docker engine running.

```powershell
Copy-Item .env.example .env
```

Edit `.env` and replace `POSTGRES_PASSWORD` with a unique local value, then run:

```powershell
docker compose up --build
```

Open <http://localhost:8081>. The first run downloads build and runtime images. PostgreSQL data is kept in a named Docker volume when the stack is stopped.

Stop the stack with `Ctrl+C`, then run `docker compose down`. To delete the local database data as well, run `docker compose down --volumes`.

The frontend currently uses mock API data; the real API is being implemented incrementally. The Compose setup is intended to keep working as API endpoints are added.

## Run the frontend separately

Requirements: Node.js and npm.

```powershell
npm ci
npm run dev
```

For local frontend development, `VITE_API_BASE_URL` in `.env` defaults to `http://localhost:8080`.

## Backend

The backend is in `backend/` and targets Java 21. When running it outside Docker, configure the datasource using the `SPRING_DATASOURCE_*` environment variables. Docker users do not need to install Java, Maven, Node.js, or PostgreSQL separately.
