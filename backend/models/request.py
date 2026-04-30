from pydantic import BaseModel
from .diagram import DiagramType


class GenerateRequest(BaseModel):
    quest: str
    functional_reqs: str
    non_functional_reqs: str
    design_description: str
    diagram_type: DiagramType
