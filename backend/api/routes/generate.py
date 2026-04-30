from fastapi import APIRouter, HTTPException
from models.request import GenerateRequest
from models.diagram import DiagramResponse
from services.prompt_engine import build_prompt
from services.model_router import route_and_generate

router = APIRouter()


@router.post("/generate", response_model=DiagramResponse)
async def generate_diagram(request: GenerateRequest) -> DiagramResponse:
    try:
        prompt = build_prompt(
            request.diagram_type,
            request.quest,
            request.functional_reqs,
            request.non_functional_reqs,
            request.design_description,
        )
        return await route_and_generate(prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
