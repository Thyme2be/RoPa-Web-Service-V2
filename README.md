# CN334 ROPA Netbay Project

This repository contains the source code for the CN334 ROPA project, a collaboration with Netbay. The project is split into a **FastAPI** backend and a **Next.js** frontend.

## Project Structure

- `server/`: Python FastAPI backend.
- `client/`: React/Next.js frontend.

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed on your machine:

### Backend (Server)
- **Python**: 3.10 or higher
- **pip**: Python package manager
- **venv**: (Standard in Python 3.3+) For creating virtual environments

### Frontend (Client)
- **Node.js**: 20.x or higher (LTS recommended)
- **npm**: (Included with Node.js) or **pnpm** / **yarn**

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd cn334-ropa-netbay
```

### 2. Backend Setup (Server)

Navigate to the server directory and set up the Python environment:

```bash
cd server

# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# On Linux/macOS:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### Running the Backend
To start the FastAPI server with auto-reload:
```bash
uvicorn app.main:app --reload
```
The backend will be available at `http://localhost:8000`. 
You can access the interactive API documentation at `http://localhost:8000/docs`.

---

### 3. Frontend Setup (Client)

Navigate to the client directory and install Node.js dependencies:

```bash
cd ../client

# Install dependencies
npm install
```

#### Running the Frontend
To start the Next.js development server:
```bash
npm run dev
```
The frontend will be available at `http://localhost:3000`.

---

## 🧪 Development Workflow

- **Branching**: Use descriptive branch names (e.g., `feature/login-page`, `bugfix/api-headers`).
- **Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/) if possible.
- **Linting**:
    - Backend: Use `ruff` or `flake8` (if configured).
    - Frontend: Run `npm run lint` before committing.

## 📄 License

[Insert License Information Here, e.g., MIT]
