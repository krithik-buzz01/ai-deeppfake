# VERIFAI REST API Specification (OpenAPI 3.0 Compatible)

Base URL: `/api/v1`

## 1. Authentication Endpoints (`/auth`)

### `POST /auth/signup`
Creates a new account in unverified status. Dispatches email OTP and SMS verification.
- **Request Body**:
  ```json
  {
    "fullName": "Dr. Jordan Vance",
    "email": "jordan@forensics.org",
    "phone": "+919876543210",
    "password": "MasterSecurePassword123!#",
    "privacyConsent": true
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "message": "Account created. Verification codes dispatched.",
    "user": { "id": "...", "emailVerified": false, "phoneVerified": false }
  }
  ```

### `POST /auth/verify-email`
Verifies ownership of email using 6-digit one-time code.
- **Request Body**: `{ "email": "...", "otp": "729415" }`
- **Response `200 OK`**: `{ "success": true, "emailVerified": true, "fullyActivated": boolean }`

### `POST /auth/verify-phone`
Verifies ownership of phone number using SMS code.
- **Request Body**: `{ "phone": "+919876543210", "code": "849201" }`
- **Response `200 OK`**: `{ "success": true, "phoneVerified": true, "fullyActivated": boolean }`

### `POST /auth/login`
Authenticates user using Argon2id password verification.
- **Request Body**: `{ "email": "...", "password": "..." }`
- **Response `200 OK`**: Sets HTTP-only cookies (`accessToken`, `refreshToken`), returns user profile.
- **Response `403 Forbidden`**: Returned if `emailVerified === false` or `phoneVerified === false`.

---

## 2. Media Vault Endpoints (`/media`)

### `POST /media/upload` (Requires Auth)
Validates binary magic bytes, computes SHA-256 and perceptual dHash, and saves file to private vault.
- **Multipart Form**: `file` (binary payload, max 100MB), optional `isLiveCapture` (boolean).
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "asset": {
      "id": "...",
      "filename": "evidence.jpg",
      "mimeType": "image/jpeg",
      "sha256Hash": "...",
      "dHash": "...",
      "signedUrl": "..."
    }
  }
  ```

### `GET /media/duplicates/:assetId` (Requires Auth)
Identifies exact cryptographic matches (100% SHA-256) and perceptual near-duplicates (Hamming distance $\le 8$).

---

## 3. Forensic Analysis Endpoints (`/analysis`)

### `POST /analysis/submit/:assetId` (Requires Auth)
Executes multimodal deepfake detection, ELA, C2PA provenance extraction, and seals findings into the audit chain.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "analysis": {
      "id": "...",
      "calibratedScore": 0.884,
      "overallRisk": "critical",
      "confidenceInterval": { "lower": 0.834, "upper": 0.934 },
      "summary": "...",
      "detectedSignals": ["..."],
      "durationMs": 420
    }
  }
  ```

### `GET /analysis/detail/:analysisId` (Requires Auth)
Returns analysis metrics, model runs, video frames timeline, and C2PA certificate chain.

---

## 4. Reports & Chain of Custody (`/reports`)

### `POST /reports/generate` (Requires Auth)
Creates a versioned report sealed with a tamper-evident chain hash.

### `GET /reports/:reportId/pdf` (Requires Auth)
Streams an audit-grade multi-page forensic PDF report.

### `GET /reports/:reportId/tamper-chain` (Requires Auth)
Verifies the cryptographic chain of custody from genesis to the current report block.

---

## 5. Administrative Endpoints (`/admin`) (Requires Admin Role)
- `GET /admin/stats`: Global metrics, risk distribution, storage usage.
- `GET /admin/users`: Paginated user list with verification status.
- `PATCH /admin/users/:userId/role`: Server-side authorization role modifier (`user` <-> `analyst` <-> `admin`).
- `GET /admin/providers/health`: Live connectivity monitor for MongoDB, Redis, AI Service, SMTP, and Twilio.
- `GET /admin/audit/logs`: Paginated tamper-evident audit event stream.
