# AGENTS.md — reports-service

Excel report generation microservice. Executes PostgreSQL stored procedures and returns `.xlsx` files.

## Purpose

Generates analytical reports (e.g., category spending, retail chain summaries) by:
1. Receiving a report ID from the user
2. Looking up the corresponding PL/pgSQL stored procedure name in the database
3. Executing the procedure to fetch raw data
4. Building an Excel file via `libxlsxwriter`
5. Returning the `.xlsx` file to the user

## Tech stack

- **C++23**, GCC 14
- **Crow** HTTP framework (lightweight, header-only)
- **libpqxx** for PostgreSQL access (raw SQL / stored procedures)
- **libxlsxwriter** for Excel `.xlsx` generation
- **CMake** build system
- **PostgreSQL 17** (shared DB with receipt-service)

## Status

**Active.** Fully implemented report generation flow via `/generate/:id` endpoint.

## Directory structure

```
reports-service/
  CMakeLists.txt                 # Build config (MUST list all .cpp/.hpp explicitly)
  Dockerfile                     # Multi-stage build (Ubuntu 24.04 + Crow + libpqxx + libxlsxwriter)
  
  src/
    main.cpp                     # Entry point: loads env, configures Crow, starts server
    
    common/
      env.hpp                    # Loads env vars, builds connection string
    
    modules/
      reports/
        reports_controller.{hpp,cpp}    # HTTP routes for /generate/:id
        reports_repository.{hpp,cpp}    # DB access (find procedure, execute procedure)
        excel_generator.{hpp,cpp}       # Builds .xlsx from raw data
```

## Report generation flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ GET /generate/:id
       ▼
┌─────────────────────────────────────────────────────────┐
│  ReportController::handle_generate(req, res)            │
│                                                         │
│  1. Extract :id from URL path                           │
│     → int report_id                                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  ReportRepository::find_procedure_name_by_id(report_id) │
│                                                         │
│  SELECT procedure_name                                  │
│  FROM reports_procedures_names                          │
│  WHERE id = report_id                                   │
│                                                         │
│  Returns: std::optional<std::string> procedure_name     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  ReportRepository::execute_procedure(procedure_name)    │
│                                                         │
│  CALL procedure_name()                                  │
│  (or SELECT * FROM procedure_name() depending on proc)  │
│                                                         │
│  Returns: ReportRawData {                               │
│    headers: std::vector<std::string>,                   │
│    rows: std::vector<std::vector<std::variant<...>>>    │
│  }                                                      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  ExcelGenerator::build_sheet(file_path, headers, rows)  │
│                                                         │
│  1. Create new workbook at file_path                    │
│  2. Add worksheet                                       │
│  3. Write headers (bold format)                         │
│  4. Write rows (iterate variants: int/double/string)    │
│  5. Close workbook                                      │
│                                                         │
│  Returns: void (file written to disk)                   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Return file to user                                    │
│                                                         │
│  res.set_header("Content-Type",                         │
│    "application/vnd.openxmlformats-officedocument...")  │
│  res.set_header("Content-Disposition",                  │
│    "attachment; filename=\"report.xlsx\"")              │
│  res.write(file_contents)                               │
└─────────────────────────────────────────────────────────┘
```

## Endpoints (target design)

- `GET /health` — liveness/readiness probe (Kubernetes), returns `{ "status": "ok" }`
- `GET /generate/:id` — generate report by ID
  - `:id` — integer, references `reports_procedures_names.id`
  - Returns: `.xlsx` file download
  - Errors:
    - `404` if report ID not found
    - `500` if procedure execution or Excel generation fails

## Code style & conventions

### Naming

| Element | Style | Example |
|---------|-------|---------|
| Namespace | `reports` | top-level |
| Classes | `CamelCase` | `ReportController`, `ExcelGenerator` |
| Functions | `snake_case` | `find_procedure_name_by_id`, `build_sheet` |
| Variables | `snake_case` | `report_id`, `procedure_name` |
| Class members | `snake_case` + `_` suffix | `repo_`, `connection_string_` |
| Files | `snake_case.{hpp,cpp}` | `reports_controller.hpp` |
| Include guards | `#ifndef SERVICE_PATH_FILE_HPP` | `#ifndef REPORTS_SERVICE_REPORTS_CONTROLLER_HPP` |

### Initialization & const-correctness

- **Use brace initialization `{}` everywhere** instead of `=`:
  ```cpp
  const auto config{load_env_config()};      // ✅
  const auto config = load_env_config();     // ❌
  
  std::size_t row{0};                        // ✅
  std::size_t row = 0;                       // ❌
  
  pqxx::connection conn{connection_string_}; // ✅
  ```

- **Const-correctness**: add `const` to all variables where possible:
  ```cpp
  const auto procedure_name{repo_->find_procedure_name_by_id(report_id)};
  const std::string filepath{"/tmp/report_" + std::to_string(report_id) + ".xlsx"};
  const pqxx::result result{txn.exec("SELECT * FROM " + procedure_name + "()")};
  ```

- **Exception**: `pqxx::connection` cannot be `const` because `pqxx::work` requires mutable reference.

### Architecture patterns

1. **Controller** (`ReportController`):
   - Holds `std::shared_ptr<ReportRepository>`
   - Registers routes via `register_routes(crow::SimpleApp&)`
   - Handlers extract params, call repo, invoke generator, return file

2. **Repository** (`ReportRepository`):
   - Constructed with PostgreSQL connection string
   - `find_procedure_name_by_id(int)` → `std::optional<std::string>`
   - `execute_procedure(const std::string&)` → `ReportRawData`
   - Uses `libpqxx::connection` + `libpqxx::work` for queries

3. **ExcelGenerator**:
   - Stateless utility class
   - `build_sheet(file_path, headers, rows)` writes `.xlsx` to disk
   - Handles `std::variant<int, double, std::string>` in rows

4. **Data flow**:
   - `ReportRawData` is the intermediate representation:
     ```cpp
     struct ReportRawData {
       std::vector<std::string> headers;
       std::vector<std::vector<std::variant<int, double, std::string>>> rows;
     };
     ```
   - Repository converts DB rows → `ReportRawData`
   - Generator converts `ReportRawData` → `.xlsx`

### Environment variables (planned)

| Var | Purpose |
|-----|---------|
| `POSTGRES_DB` | Database name |
| `POSTGRES_USER` | DB user |
| `POSTGRES_PASSWORD` | DB password |
| `POSTGRES_HOST` | DB host |
| `POSTGRES_PORT` | DB port |
| `REPORTS_SERVICE_APP_PORT` | Service port (default `4001`) |

## Docker

Multi-stage build in `Dockerfile`:
- **Stage 1 (builder)**: Ubuntu 24.04, CMake 4.1.2, Crow (header-only), libpqxx-dev, libxlsxwriter-dev
- **Stage 2 (runtime)**: minimal image with libpqxx-6.4, libxlsxwriter1, libpq5

Orchestration via `docker-compose.yaml`:
- Port: `${REPORTS_SERVICE_APP_PORT:-4001}`
- Environment: `POSTGRES_HOST=postgres` (internal network)
- Dependencies: postgres (healthy) + migration-job (completed)

Run both services:
```bash
docker compose up --build
```

Run only reports-service:
```bash
docker compose up --build reports-service
```

## Database integration

Reports-service shares the PostgreSQL database with receipt-service. The `reports_procedures_names` table (created by Liquibase migration `2026-10-04-01_add-reports-table.sql`) maps report IDs to PL/pgSQL procedure names:

```sql
CREATE TABLE reports_procedures_names (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    procedure_name VARCHAR(100) NOT NULL
);
```

Stored procedures are defined in migrations (e.g., `2026-10-04-02_add-first-report-plsql.sql`) and registered via seeds (e.g., `2026-10-04-01_save-new-report-proc-to-table.sql`).
