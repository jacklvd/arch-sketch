# ArchSketch

AI-powered system design diagram generator. Describe your system and get interactive, draggable architecture diagrams — high-level architecture, database schema, API design, and low-level component diagrams.

## How It Works

Fill in your system requirements (quest, functional/non-functional requirements, design description), pick a diagram type, and click **Generate Diagram**. The backend routes the request to a local Ollama model (`gemma4:e4b`) first, falling back to Gemini (`gemini-2.5-flash`) for complex cases or if Ollama is unavailable.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Vite + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Diagrams | React Flow (`@xyflow/react`) |
| Auto-layout | dagre |
| State | Zustand |
| Backend | FastAPI (Python 3.14) |
| Local AI | Ollama — `gemma4:e4b` |
| Cloud AI | Google Gemini — `gemini-2.5-flash` |
| Validation | Pydantic v2 |

## Project Structure

```text
arch-sketch/
├── backend/
│   ├── main.py                  # FastAPI entry point
│   ├── api/routes/generate.py   # POST /api/generate
│   ├── models/                  # Pydantic request & diagram models
│   ├── services/                # OllamaClient, GeminiClient, ModelRouter, JSON repair
│   └── prompts/                 # Prompt templates per diagram type
├── client/
│   ├── src/
│   │   ├── api/                 # Axios API client
│   │   ├── components/          # InputForm, DiagramCanvas, DiagramTabs
│   │   ├── nodes/               # Custom React Flow nodes
│   │   ├── edges/               # Custom React Flow edges
│   │   ├── lib/                 # iconRegistry, diagramMapper, layoutEngine
│   │   ├── store/               # Zustand store
│   │   └── types/               # TypeScript types matching JSON contract
│   └── public/                  # Static assets & icons
├── docker-compose.yml
└── README.md
```

## Running the App

### Option A — Docker (recommended)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
# Clone and enter the project
git clone <repo-url> arch-sketch
cd arch-sketch

# (Optional) set your Gemini API key for the cloud fallback
export GEMINI_API_KEY=your_key_here

# Build and start all three services (client, backend, ollama)
docker compose up --build

# First run only: pull the AI model into the Ollama container
docker compose exec ollama ollama pull gemma4:e4b
```

| Service | URL |
| --- | --- |
| Frontend | <http://localhost:3000> |
| Backend API | <http://localhost:8000> |
| Ollama | <http://localhost:11434> |

To stop: `docker compose down`. Model data is persisted in the `ollama_data` Docker volume.

---

### Option B — Local Development

#### Prerequisites

- Python 3.14+, [Poetry](https://python-poetry.org/)
- Node.js 18+, Yarn
- [Ollama](https://ollama.com/) installed and running

#### 1. Ollama

```bash
ollama pull gemma4:e4b
# Ollama starts automatically on most installs; if not:
ollama serve
```

#### 2. Backend

```bash
cd backend

# Install dependencies
poetry install

# Add your Gemini API key (used as fallback if Ollama is unavailable)
echo "GEMINI_API_KEY=your_key_here" > .env

# Start the server
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

#### 3. Frontend

```bash
cd client
yarn install
yarn dev
```

The app will be at **<http://localhost:5173>**.

---

## Diagram Types

| Type | Description |
| --- | --- |
| **High-Level Architecture** | Services, components, load balancers, databases, and their connections |
| **Database Schema** | Tables, columns, PKs/FKs, and relationships with cardinality |
| **API Design** | Services with endpoints, HTTP methods, and inter-service calls |
| **Low-Level Design** | Internal layers — controllers, services, repositories, domain classes, and design patterns |

## Features

- **Tab switching** — generate all four diagram types and switch between them without losing any
- **Regenerate** — re-run the last generation for the active diagram with one click
- **Export PNG** — download the current diagram as a high-resolution PNG
- **Ollama status** — live indicator in the sidebar shows whether the local model is reachable

## Model Routing

1. **Ollama** (`gemma4:e4b`) — tried first; fast, local, private
2. **JSON repair** — strips markdown fences, fixes trailing commas, validates schema
3. **Gemini** (`gemini-2.5-flash`) — fallback if Ollama is unavailable or produces invalid output

## Demo
![high-level-design](assets/high-level-design.png)
![database-design](assets/database-design.png)
![low-level-design](assets/low-level-design.png)
