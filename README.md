# PetStore Pro

PetStore Pro is a local pet-store web application for product catalog management, inventory tracking, sales, operational alerts, audit history, and store metrics. The React/Vite frontend talks to a Spring Boot REST API backed by PostgreSQL. Docker Compose runs the complete app.

## Run the complete app

Requirements: Docker Desktop with the Docker engine running.

1. Copy the example environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Edit `.env` and replace `POSTGRES_PASSWORD` with a unique local value. Generate a JWT signing secret in PowerShell:

   ```powershell
   $bytes = New-Object byte[] 32
   $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
   $rng.GetBytes($bytes)
   [Convert]::ToBase64String($bytes)
   $rng.Dispose()
   ```

   Put the printed value in `.env` as `JWT_SECRET`. Keep `.env` private and never commit or share the generated key.

3. Build and start the services:

   ```powershell
   docker compose up --build -d
   ```

4. Open the app at <http://localhost:8081>. The frontend is bound to this computer only. To follow service logs, run `docker compose logs -f`; stop the stack with `docker compose down`.

PostgreSQL data persists in the `petstore-data` named volume when the containers stop. To delete the database data as well, run `docker compose down --volumes`.

The first Compose build downloads the required container images and Maven/npm dependencies. Docker users do not need to install Java, Maven, Node.js, or PostgreSQL separately.

## Demo accounts and roles

The local demo accounts are created on first startup when `DEMO_USERS_ENABLED=true`:

| Username | Role | Password |
| --- | --- | --- |
| `a` | Employee | `a` |
| `aa` | Manager | `a` |
| `aaa` | DevOps | `a` |

These intentionally weak demo credentials are for local demonstration only. Keep the app off public networks, replace the credentials before any shared deployment, and disable `DEMO_USERS_ENABLED` outside local development.

| Capability | Employee | Manager | DevOps |
| --- | :---: | :---: | :---: |
| View products, inventory, sales, and alerts | Yes | Yes | Yes |
| Create, edit, and delete products | No | Yes | Yes |
| Dashboard | No | Yes | Yes |
| Audit log page and API | No | Yes | No |
| Prometheus metrics endpoint | No | No | Yes |

Roles are enforced by the backend as well as by frontend navigation.

## Features

### Product catalog

- Search and browse products with category filters and pagination.
- Managers and DevOps users can create, partially update, and delete products.
- Product data is persistent in PostgreSQL. Products with dependent sales, stock, or alert history cannot be deleted.
- Medicine products can have an expiry date. Products have a configurable low-stock threshold.
- A new database has no product records; sign in as `aa` or `aaa` to add products.

### Inventory

- Browse stock movements, optionally filtered by product.
- Record `IN` (add units), `OUT` (remove units), or `ADJUSTMENT` (set the absolute stock count).
- Each movement records the actor, quantity, time, and optional reason. Stock changes are audited.
- Stock is allowed to become negative so the app can demonstrate the critical negative-stock alert.

### Sales

- Browse sales with inclusive `from`/`to` date filters.
- Register a sale against a product. The backend checks stock and transactionally stores the sale, decrements inventory, records a `SALE` movement, refreshes alerts, and writes an audit event.
- Insufficient stock returns HTTP 409; no partial sale is saved.

### Alerts

- Low-stock alerts activate when stock is zero or below the configured threshold, as long as stock is not negative.
- Negative stock produces a critical alert.
- Medicine expiry alerts activate when the expiry date is within 30 days or has passed. Severity increases as expiry approaches.
- Alert conditions refresh after product, inventory, and sale changes, with a scheduled daily reconciliation.
- When a condition clears, its unresolved alert is automatically resolved. A later recurrence creates a new alert. Users can also explicitly resolve an alert; this is audited.

### Audit logs

- Product changes, inventory changes, sales, and alert resolutions record the actor, timestamp, action, entity, and details.
- Managers can filter by action text and page through newest-first audit entries.
- Audit entries are read-only through the web app.

### Dashboard

- Managers and DevOps users can view database-backed product count, total stock value, sales today (UTC), low-stock count, expiring medicine count, unresolved alert count, recent sales, and top products by units sold.

## API and Swagger

Swagger UI: <http://localhost:8081/swagger-ui/index.html>

OpenAPI JSON: <http://localhost:8081/v3/api-docs>

The Swagger page documents the API paths, request/response fields, filters, pagination, role requirements, and JWT bearer authentication. Use `POST /api/auth/login` with a demo account, copy the returned `token`, choose **Authorize**, and enter the token. The login endpoint itself is public; application endpoints remain protected by the backend.

| Method and path | Purpose | Access |
| --- | --- | --- |
| `POST /api/auth/login` | Sign in and receive a JWT | Public |
| `GET /api/products` | Search/filter/paginate products | Authenticated |
| `GET /api/products/{id}` | Read one product | Authenticated |
| `POST /api/products` | Create a product | Manager, DevOps |
| `PUT /api/products/{id}` | Partially update a product | Manager, DevOps |
| `DELETE /api/products/{id}` | Delete a product without dependent history | Manager, DevOps |
| `GET /api/inventory/movements` | List stock movements | Authenticated |
| `POST /api/inventory/adjustments` | Adjust product stock | Authenticated |
| `GET /api/sales` | List sales by date range | Authenticated |
| `POST /api/sales` | Register a sale | Authenticated |
| `GET /api/alerts` | Filter alerts by type/resolution | Authenticated |
| `PATCH /api/alerts/{id}/resolve` | Resolve an alert | Authenticated |
| `GET /api/audit-logs` | Filter and paginate audit events | Manager |
| `GET /api/dashboard/summary` | Read live dashboard metrics | Manager, DevOps |
| `GET /actuator/health` | Health probe | Public |
| `GET /actuator/prometheus` | Prometheus metrics | DevOps |

Paginated endpoints use `page` (1-based, default 1) and `pageSize` (default 50, maximum 100). Product search uses `search` and `category`; sales dates use ISO `yyyy-MM-dd`; audit filters use `userId` and a substring `action`. The backend port is internal to the Compose network; access the API through the frontend proxy at `localhost:8081`.

## Factory training fixture

[`factory-fixtures/synthetic-findings.json`](./factory-fixtures/synthetic-findings.json) contains explicitly labeled fictional CWE finding records. It is inert JSON for future factory demonstrations; it is not a scan result, does not point to real source files, and does not add vulnerable or executable code to the application.

## Development and verification

Frontend:

```powershell
npm ci
npm run build
npm run lint
```

Backend (Java 21 and Maven required outside Docker):

```powershell
mvn -f .\backend\pom.xml clean verify
```

The backend runs Flyway migrations at startup and validates the schema with Hibernate. Existing migrations are under `backend/src/main/resources/db/migration`; add new schema changes as new versioned migrations.

For local development outside Compose, the backend requires PostgreSQL plus `JWT_SECRET` and datasource environment variables. Set `CORS_ALLOWED_ORIGINS` to include the frontend origin. The Vite development server uses `VITE_API_BASE_URL=http://localhost:8080` by default.
