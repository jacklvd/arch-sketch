# ArchSketch — AI System Design Diagram Generator

## Build Plan

---

## 1. Project Overview

An AI-powered tool that generates professional system design diagrams from user-provided requirements. The user inputs their system quest, functional requirements, non-functional requirements, and design descriptions. The AI then generates four types of diagrams: high-level architecture, database schema, API design, and low-level design — rendered as interactive, draggable node-based diagrams using React Flow with real tech icons/logos.

### Model Strategy

| Model | Role | When |
|-------|------|------|
| **Gemma 4 (Ollama, local)** | Primary generator | Simple/medium diagrams, low latency |
| **Gemini (Google AI API)** | Fallback generator | Complex architectures, when local model output fails validation |

The backend auto-detects complexity and routes accordingly. If the local model produces invalid/incomplete JSON, the system silently retries with Gemini.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Vite + React + TypeScript + Tailwind)        │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Input    │→ │ React Flow   │  │ Icon Registry    │  │
│  │ Form     │  │ Diagram View │  │ (SVG/PNG assets) │  │
│  └──────────┘  └──────────────┘  └──────────────────┘  │
│        │              ▲                    ▲             │
│        │              │                    │             │
│        ▼              │                    │             │
│  ┌──────────────────────────────────────────┐           │
│  │  DiagramRenderer (maps AI JSON → nodes)  │           │
│  └──────────────────────────────────────────┘           │
└────────────────────────┬────────────────────────────────┘
                         │ REST / SSE
┌────────────────────────▼────────────────────────────────┐
│  Backend (Python FastAPI)                                │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ /generate   │  │ Model Router │  │ Prompt Engine  │ │
│  │  endpoint   │→ │ (local/cloud)│→ │ (per diagram   │ │
│  └─────────────┘  └──────────────┘  │  type)         │ │
│                          │          └────────────────┘ │
│               ┌──────────┴──────────┐                  │
│               ▼                     ▼                  │
│        ┌────────────┐      ┌──────────────┐            │
│        │ Ollama     │      │ Gemini API   │            │
│        │ (Gemma 4)  │      │ (fallback)   │            │
│        └────────────┘      └──────────────┘            │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Core JSON Contract (AI Output → Frontend)

This is the most critical design decision. Both models must output this same JSON schema so the frontend can render any diagram type uniformly.

```jsonc
{
  "diagramType": "high_level" | "database" | "api" | "low_level",
  "title": "Video Streaming Platform Architecture",
  "nodes": [
    {
      "id": "client",
      "label": "Client App",
      "icon": "mobile",           // maps to icon registry
      "group": "frontend",        // for grouping/coloring
      "position": { "x": 100, "y": 300 },  // suggested placement
      "metadata": {               // type-specific extra info
        "tech": ["React Native", "TypeScript"]
      }
    },
    {
      "id": "api_gateway",
      "label": "API Gateway",
      "icon": "aws_api_gateway",
      "group": "networking",
      "position": { "x": 350, "y": 300 }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "client",
      "target": "api_gateway",
      "label": "HTTPS / REST",
      "style": "solid",           // solid | dashed | animated
      "labelPosition": "center"
    }
  ],
  "groups": [                     // optional bounding boxes
    {
      "id": "fargate_cicd",
      "label": "Fargate CI/CD Stack",
      "nodeIds": ["codecommit", "codepipeline", "codebuild"],
      "style": "dashed_border"
    }
  ]
}
```

**Database diagram nodes** have a different metadata shape:

```jsonc
{
  "id": "users",
  "label": "users",
  "icon": "table",
  "type": "db_table",
  "metadata": {
    "columns": [
      { "name": "id", "type": "int", "pk": true },
      { "name": "full_name", "type": "varchar" },
      { "name": "email", "type": "varchar" }
    ]
  }
}
```

**API diagram nodes** have endpoint metadata:

```jsonc
{
  "id": "scheduler_service",
  "label": "Scheduler Service",
  "icon": "microservice",
  "type": "api_service",
  "metadata": {
    "endpoints": [
      { "method": "POST", "path": "/schedule", "response": "202 Accepted" },
      { "method": "GET",  "path": "/status/{id}", "response": "200 OK" }
    ]
  }
}
```

---

## 4. Icon Registry Design

```
frontend/
  src/
    assets/
      icons/
        aws/          ← AWS Architecture Icons (SVG)
        generic/      ← client.svg, server.svg, database.svg, microservice.svg
        tech/         ← kafka.svg, redis.svg, nginx.svg, spring.svg
        custom/       ← user-uploaded PNGs/SVGs
    lib/
      iconRegistry.ts ← maps icon keys → imports
```

```typescript
// iconRegistry.ts
const icons: Record<string, string> = {
  // AWS
  aws_api_gateway: '/icons/aws/api-gateway.svg',
  aws_lambda:      '/icons/aws/lambda.svg',
  aws_s3:          '/icons/aws/s3.svg',
  aws_dynamodb:    '/icons/aws/dynamodb.svg',
  aws_fargate:     '/icons/aws/fargate.svg',
  aws_cognito:     '/icons/aws/cognito.svg',
  // Generic
  client:          '/icons/generic/client.svg',
  server:          '/icons/generic/server.svg',
  database:        '/icons/generic/database.svg',
  load_balancer:   '/icons/generic/load-balancer.svg',
  // Tech
  kafka:           '/icons/tech/kafka.svg',
  redis:           '/icons/tech/redis.svg',
  nginx:           '/icons/tech/nginx.svg',
  spring_boot:     '/icons/tech/spring-boot.svg',
  // Fallback
  unknown:         '/icons/generic/box.svg',
};

export function getIcon(key: string): string {
  return icons[key] ?? icons['unknown'];
}
```

The AI model prompt includes a list of available icon keys so it picks from the registry. Unknown icons gracefully fall back to a generic box.

---

## 5. Phased Build Plan

### Phase 1 — Foundation (Days 1–3)

**Goal:** Backend running, frontend skeleton, one model generating a parseable JSON diagram.

#### Backend

- [X] Init FastAPI project with `uv` or `poetry`
- [X] Create Pydantic models matching the JSON contract above
- [X] Build `/api/generate` endpoint — accepts `{ quest, functional_reqs, non_functional_reqs, design_description, diagram_type }`
- [X] Implement `OllamaClient` — calls local Gemma 4 via `POST http://localhost:11434/api/generate`
- [X] Implement `GeminiClient` — calls Gemini API via `google-genai` SDK
- [X] Build `ModelRouter` — tries Ollama first, validates JSON output, falls back to Gemini on failure
- [X] Build prompt templates (one per diagram type) that include:
  - The JSON schema the model must follow
  - The list of available icon keys
  - Example output for that diagram type
- [X] Add JSON validation/repair layer (strip markdown fences, fix trailing commas, etc.)

#### Frontend

- [X] `npm create vite@latest frontend -- --template react-ts` - DONE and I used yarn as package management
- [X] Install: `reactflow`, `tailwindcss`, `@tailwindcss/vite`, `zustand`
- [X] Build the input form page (quest, FRs, NFRs, design description — textarea fields)
- [X] Build basic React Flow canvas that can render a hardcoded diagram JSON
- [X] Create `DiagramRenderer` that maps the JSON contract → React Flow nodes/edges
- [X] Set up icon registry with ~20 starter icons

#### Integration

- [X] Wire form submission → backend → display result on canvas
- [X] Add loading state with streaming indicator

---

### Phase 2 — High-Level Architecture Diagram (Days 4–6)

**Goal:** Production-quality high-level diagram rendering, matching the style of your reference images.

#### Custom React Flow Nodes

- [ ] `ArchitectureNode` — icon + label + optional tech badges, colored border by group
- [ ] `GroupNode` — dashed/solid bounding box around child nodes (like "Fargate CI/CD Stack")
- [ ] Custom edge styles — solid, dashed, animated, with labels

#### Prompt Engineering

- [ ] Craft the `high_level` prompt template:
  - System prompt explaining the role, available icons, expected JSON
  - Few-shot examples based on your reference image 1 (the AWS architecture)
  - Instructions for grouping, positioning, and edge labeling
- [ ] Test with various system design scenarios (e-commerce, chat app, video platform)
- [ ] Tune for both Gemma 4 and Gemini — may need different prompt styles per model

#### Layout

- [ ] Implement auto-layout using `dagre` or `elkjs` (React Flow compatible) so nodes aren't overlapping
- [ ] Allow the AI's suggested positions as hints, but run layout algorithm for final placement
- [ ] Make nodes draggable for manual adjustment after generation

---

### Phase 3 — Database Schema Diagram (Days 7–9)

**Goal:** ER-diagram style rendering matching your reference image 3.

#### Custom Nodes

- [ ] `TableNode` — header bar (table name) + columns list with name/type/PK indicator
- [ ] Style: dark header, light body, clean typography
- [ ] FK edges — crow's foot notation or simple line with cardinality labels

#### Prompt Engineering

- [ ] Craft `database` prompt template:
  - Input: the user's design description + functional requirements
  - Output: tables with columns, types, PKs, FKs, and relationships
  - Few-shot example matching your reference image 3 schema style
- [ ] Validate: every FK edge target must reference an existing table/column

#### Enhancements

- [ ] Color-code tables by domain (user-related, order-related, reference data)
- [ ] Show index indicators on columns

---

### Phase 4 — API Design Diagram (Days 10–11)

**Goal:** Service interaction diagram matching your reference image 4 style.

#### Custom Nodes

- [ ] `ServiceNode` — rounded box with service name + list of endpoints (method + path + response code)
- [ ] `ClientNode` — device icon with request arrows

#### Custom Edges

- [ ] Request edges (bold, colored by HTTP method) — labeled with `HTTP POST`, `HTTP GET`, etc.
- [ ] Response edges (thinner, muted) — labeled with status codes like `200 (OK)`, `201 (Created)`
- [ ] Bidirectional edge pairs for request/response

#### Prompt

- [ ] `api` prompt template — generates services, their endpoints, and inter-service communication
- [ ] Include REST conventions, proper HTTP methods, and status codes

---

### Phase 5 — Low-Level Design Diagram (Days 12–13)

**Goal:** Detailed component-level diagram showing internal architecture of a service.

#### Custom Nodes

- [ ] `ClassNode` — UML-style with class name, attributes, methods
- [ ] `ComponentNode` — internal module boxes (controller, service, repository layers)
- [ ] Pattern annotations (Observer, Factory, Singleton badges)

#### Prompt

- [ ] `low_level` prompt — generates class relationships, design patterns, internal data flow
- [ ] Focus on one service at a time (user picks which service from high-level to drill into)

---

### Phase 6 — Polish & UX (Days 14–16)

#### Frontend

- [ ] Tab-based view switching between the 4 diagram types
- [ ] Export diagram as PNG/SVG (React Flow has `toImage()`)
- [ ] Dark mode / light mode toggle
- [ ] Diagram history — save/load previous generations (localStorage or SQLite)
- [ ] Side panel showing the raw requirements alongside the diagram
- [ ] "Regenerate" button per diagram type
- [ ] Zoom controls and minimap

#### Backend

- [ ] SSE streaming for long generations — stream partial JSON or status updates
- [ ] Cache model responses per input hash
- [ ] Health check endpoint for Ollama status
- [ ] Rate limiting

#### Model Routing Intelligence

- [ ] Complexity scoring: count entities mentioned in description, use Gemma for ≤10 nodes, Gemini for more
- [ ] JSON repair pipeline: strip fences → fix quotes → validate schema → retry if invalid
- [ ] Fallback chain: Gemma → repair → Gemini → repair → error

---

## 6. Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend framework | Vite + React 18 + TypeScript |
| Styling | Tailwind CSS v4 |
| Diagram rendering | React Flow (@xyflow/react) |
| Auto-layout | dagre or elkjs |
| State management | Zustand |
| HTTP client | Axios |
| Backend framework | FastAPI (Python 3.12) |
| Local AI | Ollama (Gemma 4) |
| Cloud AI | Google Gemini API |
| Validation | Pydantic v2 |
| Export | html-to-image (for PNG/SVG export) |

---

## 7. File Structure

```
archsketch/
├── backend/
│   ├── main.py                    # FastAPI app entry
│   ├── requirements.txt
│   ├── api/
│   │   └── routes/
│   │       └── generate.py        # POST /api/generate
│   ├── models/
│   │   ├── request.py             # Pydantic input models
│   │   └── diagram.py             # Pydantic diagram JSON schema
│   ├── services/
│   │   ├── model_router.py        # Ollama-first, Gemini-fallback logic
│   │   ├── ollama_client.py       # Local Gemma 4 calls
│   │   ├── gemini_client.py       # Google Gemini API calls
│   │   ├── prompt_engine.py       # Builds prompts per diagram type
│   │   └── json_repair.py         # Cleans/validates model output
│   └── prompts/
│       ├── high_level.txt
│       ├── database.txt
│       ├── api_design.txt
│       └── low_level.txt
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── public/
│   │   └── icons/                 # Icon assets (SVG/PNG)
│   │       ├── aws/
│   │       ├── generic/
│   │       ├── tech/
│   │       └── custom/
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/
│       │   └── generate.ts        # API client
│       ├── components/
│       │   ├── InputForm.tsx       # Requirements input form
│       │   ├── DiagramCanvas.tsx   # React Flow wrapper
│       │   ├── DiagramTabs.tsx     # Switch between diagram types
│       │   └── ExportButton.tsx
│       ├── nodes/                  # Custom React Flow nodes
│       │   ├── ArchitectureNode.tsx
│       │   ├── TableNode.tsx
│       │   ├── ServiceNode.tsx
│       │   ├── ClassNode.tsx
│       │   └── GroupNode.tsx
│       ├── edges/
│       │   └── CustomEdge.tsx
│       ├── lib/
│       │   ├── iconRegistry.ts
│       │   ├── diagramMapper.ts   # JSON → React Flow nodes/edges
│       │   └── layoutEngine.ts    # dagre/elk auto-layout
│       ├── store/
│       │   └── diagramStore.ts    # Zustand state
│       └── types/
│           └── diagram.ts         # TypeScript types matching JSON contract
│
└── README.md
```

---

## 8. Key Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| **Model outputs invalid JSON** | Multi-layer repair: regex cleanup → `json5` parsing → schema validation → retry with Gemini |
| **Gemma 4 too weak for complex diagrams** | Complexity scoring routes hard problems to Gemini; keep Gemma for ≤10 node diagrams |
| **Node overlap / ugly layouts** | Use dagre/elkjs for auto-layout; AI positions are hints, not final |
| **Icon mismatch (AI picks non-existent icon)** | Prompt includes full icon list; fallback to generic box; fuzzy-match icon names |
| **Slow local inference** | SSE streaming for progress; show partial results; timeout → Gemini fallback |
| **Inconsistent diagram styles across types** | Strict JSON contract + typed custom nodes ensure visual consistency |

---

## 9. Getting Started (First Session)

```bash
# Backend
mkdir archsketch && cd archsketch
mkdir backend && cd backend
python -m venv venv && source venv/bin/activate
pip install fastapi uvicorn pydantic httpx google-genai python-dotenv
# Start: uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd archsketch
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install @xyflow/react zustand axios dagre @types/dagre
npm install -D tailwindcss @tailwindcss/vite
# Start: npm run dev

# Ollama (separate terminal)
ollama pull gemma3:4b   # or gemma4 when available
ollama serve
```

Start with Phase 1 — get one hardcoded prompt producing a valid JSON diagram and rendering it on the canvas. Everything else builds on that foundation.