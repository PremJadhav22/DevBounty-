# DevBounty: The Autonomous Open-Source Engineering Agent

**DevBounty** is a professional-grade autonomous system designed to find, analyze, and fix open-source bugs in real-time. Built for high-speed engineering pipelines, it leverages multi-agent orchestration to provide end-to-end bug resolution with human-level reasoning.

![DevBounty Banner](https://img.shields.io/badge/Status-Hackathon%20Ready-emerald?style=for-the-badge&logo=github)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20FastAPI%20%7C%20Groq-blue?style=for-the-badge)

## Key Features

- **Target Acquisition:** Scans GitHub for "good first issues" across Python, JS, and TS.
- **Multi-Agent Pipeline:**
    - **Engineer Agent:** Analyzes the bug and writes the fix.
    - **Syntax Verifier:** Ensures the code is parseable and valid.
    - **Senior Reviewer Agent:** Critiques the fix and requests refinements.
- **Real-time Streaming:** "God Mode" terminal provides a live look into the AI's reasoning.
- **Premium UI:** Cyberpunk-inspired dashboard built with React and Framer Motion.
- **One-Click PR:** Automatically clones, fixes, and submits Pull Requests.

## Architecture

```mermaid
graph TD
    User((User)) -->|Initiate| UI[React Dashboard]
    UI -->|WebSocket| BE[FastAPI Backend]
    BE -->|Scrape| GH[GitHub API]
    BE -->|Multimodal LLM| AI[Groq / Gemini]
    AI -->|Reasoning| EA[Engineer Agent]
    EA -->|Fix| SV[Syntax Verifier]
    SV -->|Validation| RA[Reviewer Agent]
    RA -->|Approval| BE
    BE -->|Git| PR[GitHub Pull Request]
```

## Quick Start

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **GitHub PAT** (with `repo` scope)

### 2. Environment Setup
Create a `.env` file in the `backend/` directory:
```env
AI_PROVIDER=groq
AI_MODEL=llama-3.3-70b-versatile
GROQ_API_KEY=your_groq_key
GITHUB_API_TOKEN=your_github_pat
```

### 3. Installation

**Backend Setup:**
```bash
# From the project root:
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (Mac/Linux)
source venv/bin/activate

# Install requirements
pip install -r backend/requirements.txt
```

**Frontend Setup:**
```bash
# Build the production dashboard
cd frontend-react
npm install
npm run build
npm run dev
```

### 4. Running the App
Launch the integrated server from the `backend` directory:
```bash
cd backend
python main.py
```
> **Note:** Access the dashboard at `http://localhost:8000`

---
