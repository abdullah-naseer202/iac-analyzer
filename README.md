# IaC Analyzer

A security analyzer for **Infrastructure as Code**. Upload a Terraform or CloudFormation file and the analyzer finds misconfigurations (public buckets, open SSH ports, unencrypted databases, hardcoded passwords), gives a **risk score**, and suggests **fix code** before the infrastructure is deployed.

This is "shift-left security": catch the problem while writing code, not after deployment.

## Features

- Parses Terraform (`.tf`) and CloudFormation (`.yaml`/`.yml`) files into structured data
- Custom rules engine plus Checkov integration, with severity mapping and duplicate removal
- Risk score and compliance score (0-100) with a grade
- Remediation suggestions with copy-ready fix code
- React dashboard: findings cards with severity badges, risk summary and scan history
- User accounts (signup/login with JWT) and projects with the latest compliance score
- Scan reports stored in AWS S3 (bucket created with Terraform)
- GitHub Actions workflow that scans IaC on every pull request and fails the build on HIGH or CRITICAL findings

## Architecture

```
Browser (React)
     |
     v
Express backend  ----->  Database
     |            \
     v             ----->  AWS S3 (scan reports)
FastAPI engine
     |
     v
Parser -> Rules (custom + Checkov) -> Risk score + Fixes
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express, JWT authentication |
| Analysis engine | Python, FastAPI, python-hcl2, PyYAML, Checkov |
| Database | PostgreSQL (Neon) |
| Storage | AWS S3 |
| Infrastructure | Terraform (HCL) |
| CI/CD | GitHub Actions |

## Project Structure

```
backend/    Express API: auth, projects, scans, S3 upload
engine/     FastAPI engine: parser, rules, risk scoring, remediation
frontend/   React dashboard
infra/      Terraform config for the S3 reports bucket
samples/    Insecure and secure sample IaC files for testing
tools/      Helper scripts
.github/    GitHub Actions workflows
```

## Screenshots

![Dashboard](./screenshots/dashboard.png)
![Scan result](./screenshots/scan-result.png)
![Scan history](./screenshots/scan-history.png)

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A PostgreSQL database (for example a free Neon project)
- An AWS account and AWS CLI, only for the S3 report upload
- Terraform, only to create the S3 bucket

### 1. Clone the repository

```bash
git clone https://github.com/abdullah-naseer007/iac-analyzer.git
cd iac-analyzer
```

### 2. Create the S3 bucket (optional)

```bash
cd infra
terraform init
terraform plan
terraform apply
```

This creates a private, encrypted, versioned S3 bucket in `ap-south-1`.

### 3. Start the analysis engine (FastAPI)

```bash
cd engine
python -m venv venv
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 4. Start the backend (Express)

Create a `backend/.env` file with your database connection string, JWT secret and AWS settings. Never commit this file.

```bash
cd backend
npm install
node index.js
```

The backend runs on http://localhost:3000.

### 5. Start the frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

## Usage

1. Sign up and log in.
2. Create a project.
3. Upload a Terraform or CloudFormation file (try the files in `samples/`).
4. Review the risk score, findings and fix suggestions.
5. Open earlier scans from the scan history list.

## Limitations

- Static analysis only: the tool does not see the real deployed state.
- Terraform variables and modules are not fully resolved.
- Rule coverage is limited to common AWS misconfigurations.

## Roadmap

- Kubernetes and Docker manifest support
- Auto-fix pull requests
- Multi-cloud support (Azure, GCP)
- Accuracy benchmark against Checkov

Progress is tracked on the project board of this repository.

## Author

**Abdullah Naseer**, BS IT Student, GCUF
pythonprogram33@gmail.com
