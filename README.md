# IaC Analyzer

Security and configuration analyzer for **Infrastructure as Code**. It scans Terraform, CloudFormation and Ansible files, detects misconfigurations, assigns a risk score and suggests remediation snippets.

## Features
- Parses Terraform, CloudFormation and Ansible files
- Detects security misconfigurations using a rule-based engine
- Risk scoring with remediation suggestions
- Web dashboard with scan history
- Scan reports uploaded to AWS S3 (infrastructure provisioned via Terraform)

## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | JavaScript, [React] |
| Backend | [Python / FastAPI] |
| Analysis Engine | Python |
| Infrastructure | Terraform (HCL), AWS S3 |

## Project Structure
