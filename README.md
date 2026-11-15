# PetStore Pro

PetStore Pro is a local pet-store inventory and sales application. The repository contains a React/Vite frontend and a Spring Boot API. Docker Compose starts the frontend, API, and PostgreSQL database together.

## Run the complete app locally

Requirements: Docker Desktop with the Docker engine running.

```powershell
Copy-Item .env.example .env
```

Edit `.env` and replace `POSTGRES_PASSWORD` with a unique local value. Generate a JWT key in PowerShell:

```powershell
$bytes = New-Object byte[] 32
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
[Convert]::ToBase64String($bytes)
$rng.Dispose()
```

Copy the printed value into `.env` as `JWT_SECRET`. Keep `.env` private and never commit or share the generated key. Then run:

```powershell
docker compose up --build
```

Open <http://localhost:8081>. The web app is bound to this computer only. The first run downloads build and runtime images. PostgreSQL data is kept in a named Docker volume when the stack is stopped.

Stop the stack with `Ctrl+C`, then run `docker compose down`. To delete the local database data as well, run `docker compose down --volumes`.

Login uses the backend API and issues JWTs. The three local demo accounts are `a` (employee), `aa` (manager), and `aaa` (DevOps), all with password `a`. These intentionally weak credentials are for local demonstration only: keep the app off public networks and disable `DEMO_USERS_ENABLED` outside local development.

The Products page reads and writes PostgreSQL through the backend. Employees can view products; managers and DevOps users can create, edit, and delete them. Product changes are recorded in the database audit log. A new database starts with no products, so sign in as `aa` or `aaa` and add products from the Products page. Inventory, sales, alerts, the audit-log page, and the dashboard still use frontend mock data; Inventory and Sales retain their own mock product catalog for now.

## Run the frontend separately

Requirements: Node.js and npm.

```powershell
npm ci
npm run dev
```

For local frontend development, `VITE_API_BASE_URL` in `.env` defaults to `http://localhost:8080`. Set the backend environment variables from `.env` in the shell that starts it, including a real `JWT_SECRET`.

## Backend

The backend is in `backend/` and targets Java 21. When running it outside Docker, configure the datasource using the `SPRING_DATASOURCE_*` environment variables. Docker users do not need to install Java, Maven, Node.js, or PostgreSQL separately.
