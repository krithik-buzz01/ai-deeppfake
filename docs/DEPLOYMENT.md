# VERIFAI Production Deployment & Operations Guide

## Table of Contents
1. [Infrastructure Architecture](#1-infrastructure-architecture)
2. [Domain & TLS Termination](#2-domain--tls-termination)
3. [SMS Provider Approval & Regulatory Compliance](#3-sms-provider-approval--regulatory-compliance)
4. [SMTP Domain Authentication (SPF, DKIM, DMARC)](#4-smtp-domain-authentication-spf-dkim-dmarc)
5. [Cryptographic Secrets Management](#5-cryptographic-secrets-management)
6. [Database Backup & Recovery](#6-database-backup--recovery)
7. [Health Monitoring & Observability](#7-health-monitoring--observability)
8. [Reproducible Startup Commands](#8-reproducible-startup-commands)

---

## 1. Infrastructure Architecture

The production environment consists of five containerized services orchestrated via Docker Compose or Kubernetes:
- **`frontend`**: Static Single Page Application served via Nginx with strict security headers.
- **`backend`**: Node.js Express Gateway managing REST endpoints, authentication, and ISO/IEC 27037 audit logs.
- **`ai-service`**: Python FastAPI worker serving PyTorch neural artifact models and forensic signal processors.
- **`worker`**: BullMQ async worker handling high-throughput video and batch processing queues.
- **`mongodb`**: MongoDB Atlas cluster or replica set storing the 19 forensic collections.
- **`redis`**: Managed Redis instance providing session cache and message broker queues.

---

## 2. Domain & TLS Termination

### TLS / HTTPS Configuration
In production, all traffic must be encrypted in transit using TLS 1.3 or 1.2 with secure cipher suites.
Example Nginx SSL snippet:
```nginx
server {
    listen 443 ssl http2;
    server_name vault.verifai.io;

    ssl_certificate /etc/letsencrypt/live/vault.verifai.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vault.verifai.io/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' https:;" always;
}
```

---

## 3. SMS Provider Approval & Regulatory Compliance

VERIFAI enforces real mobile ownership verification using Twilio Verify or compliant SMS providers.

### India DLT (Distributed Ledger Technology) Compliance
If sending SMS to Indian numbers (`+91`), telecom regulations (TRAI) mandate registration on DLT platforms (e.g. Vilpower, TrueConnect, Airtel DLT):
1. **Entity Registration**: Register corporate legal entity with Principal Entity ID (PE ID).
2. **Sender ID (Header)**: Register 6-character alphabetic Header (e.g. `VRFSEC`).
3. **Template Registration**: Register the OTP message template:
   ```text
   Your VERIFAI security verification code is {#var#}. Valid for 5 minutes. Do not share this OTP with anyone.
   ```
4. Configure the approved `TemplateId` and `EntityId` in provider settings.

### US A2P 10DLC Registration
For US numbers (`+1`), register the Brand and Campaign under Twilio Trust Hub / A2P 10DLC for Two-Factor Authentication (2FA) use cases.

---

## 4. SMTP Domain Authentication (SPF, DKIM, DMARC)

To guarantee deliverability of verification codes and security alerts, configure DNS records on your sending domain:

1. **SPF (Sender Policy Framework)**:
   ```dns
   TXT @ "v=spf1 include:mailgun.org ~all"
   ```
2. **DKIM (DomainKeys Identified Mail)**:
   Add the 2048-bit public key CNAME or TXT record provided by your transactional email provider.
3. **DMARC (Domain-based Message Authentication)**:
   ```dns
   TXT _dmarc "v=DMARC1; p=reject; rua=mailto:dmarc-reports@verifai.io; pct=100; adkim=s; aspf=s"
   ```

---

## 5. Cryptographic Secrets Management

Generate cryptographically strong random keys for production:
```bash
# JWT Access Secret
openssl rand -hex 32

# JWT Refresh Secret
openssl rand -hex 32

# Cookie Secret
openssl rand -hex 32

# OTP HMAC Key
openssl rand -hex 32
```
Never commit `.env` or production secrets to source control. Inject secrets via AWS Secrets Manager, HashiCorp Vault, or environment variables in container runtime.

---

## 6. Database Backup & Recovery

Configure automated daily backups with point-in-time recovery for the 19 MongoDB collections:
```bash
# Backup command
mongodump --uri="mongodb://mongodb:27017/verifai_db" --archive="/backups/verifai_$(date +%Y%m%d_%H%M%S).archive" --gzip

# Restore command
mongorestore --uri="mongodb://mongodb:27017/verifai_db" --archive="/backups/verifai_target.archive" --gzip --drop
```

---

## 7. Health Monitoring & Observability

- **Gateway Health**: `GET /api/v1/health`
- **Provider Status**: `GET /api/v1/admin/providers/health`
- **Audit Chain Integrity**: `GET /api/v1/admin/audit/logs` (verifies Merkle hash chaining from genesis)
- **AI Service Metrics**: `GET /health` (CPU memory RSS, torch version, registered models)

---

## 8. Reproducible Startup Commands

### Option A: Complete Docker Compose Stack
```bash
docker-compose up --build -d
```
Services will become available at:
- Web Application: `http://localhost`
- Backend API Gateway: `http://localhost:5000/api/v1`
- AI Inference Engine: `http://localhost:8000/docs`

### Option B: Local Development / Manual Services
1. **Python AI Service**:
   ```bash
   cd ai-service
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
2. **Node.js Backend Gateway**:
   ```bash
   npm run dev:backend
   ```
3. **React Vite Frontend**:
   ```bash
   npm run dev:frontend
   ```
