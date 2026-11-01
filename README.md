# IaC Analyzer

Security and configuration analyzer for **Infrastructure as Code**. It scans Terraform, CloudFormation and Ansible files, detects misconfigurations, assigns a risk score and suggests remediation snippets.

## Features

- Parses Terraform, CloudFormation and Ansible files
- Detects security misconfigurations using a rule-based engine
- Risk scoring with remediation suggestions
- Web dashboard with scan history
- Scan reports uploaded to AWS S3 (bucket provisioned via Terraform)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | JavaScript, React |
| Backend | Python, FastAPI |
| Analysis Engine | Python |
| Infrastructure | Terraform (HCL), AWS S3 |

## Project Structure

```
backend/    API and report handling
engine/     IaC parser, rules, risk scoring
frontend/   Web dashboard
infra/      Terraform config for S3 reports bucket
samples/    Sample IaC files for testing
tools/      Helper scripts
```

## Screenshots

![Dashboard](./screenshots/dashboard.png)
![Scan result](./screenshots/scan-result.png)

## Getting Started

### Prerequisites

- Python 3.x
- Node.js 18+
- AWS account (only if you use the S3 report upload)

### Installation

```bash
git clone https://github.com/abdullah-naseer007/iac-analyzer.git
cd iac-analyzer

# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (in a new terminal)
cd frontend
npm install
npm start
```

## Usage

1. Open the dashboard in your browser.
2. Upload a Terraform, CloudFormation or Ansible file (try the ones in `samples/`).
3. View the findings, risk score and suggested fixes.

## Roadmap

Progress is tracked on the GitHub Project board of this repository.

## Author

**Abdullah Naseer**, BS IT Student, GCUF
[LinkedIn](https://linkedin.com/in/your-id) | pythonprogram33@gmail.com
