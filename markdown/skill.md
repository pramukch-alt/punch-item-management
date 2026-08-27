# Skill & Development Guidelines: Punch Item Management System

## 1. Tech Stack Definition
*   **Frontend:** React.js (Vite), Tailwind CSS (for styling and rapid UI development), Lucide React (for icons), React Router DOM (for routing), Axios (for API communication).
*   **Backend:** Node.js, Express.js / NestJS (RESTful API architecture), Multer (for file/image uploads), `xlsx` package (for Excel parsing and export).
*   **Database:** PostgreSQL, managed via ORM (Prisma or TypeORM) to ensure robust schema migration and transaction safety.
*   **Storage:** Local file system storage (or AWS S3/MinIO) for storing Before/After site images securely.

---

## 2. Core Functional Requirements & Rules

### 2.1 Role-Based Access Control (RBAC)
*   **Administrator:** Full access to all pages, CRUD operations, and User Management (create/assign roles).
*   **Contractor:** Can create new punch items, update items (upload Before/After images), submit to OE, and cancel items. Cannot delete records physically (use Canceled status).
*   **OE (Owner Engineer):** Can review items submitted by contractors. Can select *Approve & Submit* (moves to Owner) or *Reject* (requires text filling, sends back to Contractor).
*   **Owner:** Final approver. Can select *Approve & Submit* (sets status to Closed) or *Reject* (requires text filling, sends back to Contractor).

### 2.2 Discipline & Running Number Generation
*   **Disciplines:** 
    1. Civil (`CIV`)
    2. Mechanical (`MEC`)
    3. Electrical (`ELE`)
    4. Control & Instrument (`CSI`)
    5. Commissioning (`COM`)
*   **Rule:** Every created punch item must automatically generate a unique running number based on its discipline (e.g., `CIV-2026-0001`) utilizing database transactions to prevent duplication.

### 2.3 Workflow Lifecycle Management
*   Status transitions must strictly follow:
    `Open` (Contractor creates) $\rightarrow$ `Submit to OE` $\rightarrow$ (`Approved` $\rightarrow$ `Submit to Owner` OR `Rejected` $\rightarrow$ back to Contractor) $\rightarrow$ (`Closed` OR `Rejected` $\rightarrow$ back to Contractor).
*   Contractors can cancel items (`Canceled`) if created by mistake.

### 2.4 Data Import / Export (Excel Integration)
*   Must support bulk Excel uploads to speed up data entry.
*   **Upsert Logic:** New imports must append or update data safely based on unique identifiers (`running_no`) without overwriting or destroying existing historical logs/statuses.

---

## 3. Coding Standards & Best Practices
*   **Clean Code & Modular Structure:** Separate components, services, routes, and controllers clearly.
*   **Error Handling:** Implement try-catch blocks on backend controllers with descriptive HTTP status codes (`400`, `401`, `403`, `404`, `500`).
*   **Security:** Secure all API endpoints using JWT (JSON Web Token) authentication and middleware verification for user roles. Sanitize all inputs to prevent SQL Injection and XSS attacks.