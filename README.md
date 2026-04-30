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
└── client/
    ├── src/
    │   ├── api/                 # Axios API client
    │   ├── components/          # InputForm, DiagramCanvas
    │   ├── nodes/               # Custom React Flow nodes
    │   ├── lib/                 # iconRegistry, diagramMapper, layoutEngine
    │   ├── store/               # Zustand store
    │   └── types/               # TypeScript types matching JSON contract
    └── public/                  # Static assets & icons
```

## Getting Started

### Prerequisites

- Python 3.14+, [Poetry](https://python-poetry.org/)
- Node.js 18+, Yarn
- [Ollama](https://ollama.com/) with `gemma4:e4b` pulled
- A [Google Gemini API key](https://aistudio.google.com/) (for fallback)

### Backend

```bash
cd backend
cp .env.example .env        # add your GEMINI_API_KEY
poetry install
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd client
yarn install
yarn dev
```

### Ollama

Ollama runs automatically in the background on most installs. If not:

```bash
ollama pull gemma4:e4b
ollama serve
```

The app will be at **<http://localhost:5173>**.

## Diagram Types

| Type | Description |
| --- | --- |
| **High-Level Architecture** | Services, components, load balancers, databases, and their connections |
| **Database Schema** | Tables, columns, PKs/FKs, and relationships |
| **API Design** | Services with endpoints, HTTP methods, and inter-service calls |
| **Low-Level Design** | Internal layers — controllers, services, repositories, and design patterns |

## Model Routing

The backend scores request complexity and routes accordingly:

1. **Ollama** (`gemma4:e4b`) — tried first; fast, local, private
2. **JSON repair** — strips markdown fences, fixes trailing commas, validates schema
3. **Gemini** (`gemini-2.5-flash`) — fallback if Ollama is unavailable or produces invalid output
