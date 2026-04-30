from pydantic import BaseModel, Field
from typing import Optional, Literal
from enum import Enum


class DiagramType(str, Enum):
    HIGH_LEVEL = "high_level"
    DATABASE = "database"
    API = "api"
    LOW_LEVEL = "low_level"


class NodePosition(BaseModel):
    x: float = 0
    y: float = 0


class DbColumn(BaseModel):
    name: str
    type: str
    pk: bool = False
    fk: bool = False


class ApiEndpoint(BaseModel):
    method: str
    path: str
    response: str


class NodeMetadata(BaseModel):
    tech: Optional[list[str]] = None
    columns: Optional[list[DbColumn]] = None
    endpoints: Optional[list[ApiEndpoint]] = None


class DiagramNode(BaseModel):
    id: str
    label: str
    icon: str = "unknown"
    group: Optional[str] = None
    type: Optional[str] = None
    position: NodePosition = Field(default_factory=NodePosition)
    metadata: Optional[NodeMetadata] = None


class DiagramEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    style: Optional[Literal["solid", "dashed", "animated"]] = "solid"
    labelPosition: Optional[str] = "center"


class DiagramGroup(BaseModel):
    id: str
    label: str
    nodeIds: list[str]
    style: Optional[str] = "dashed_border"


class DiagramResponse(BaseModel):
    diagramType: DiagramType
    title: str
    nodes: list[DiagramNode]
    edges: list[DiagramEdge]
    groups: Optional[list[DiagramGroup]] = None
