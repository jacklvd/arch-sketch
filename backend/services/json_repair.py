import re
import json
import logging

logger = logging.getLogger(__name__)


def repair_json(text: str) -> str:
    # Strip markdown code fences
    text = re.sub(r"```(?:json|jsonc)?\s*", "", text)
    text = re.sub(r"```\s*$", "", text, flags=re.MULTILINE)
    text = text.strip()

    # Extract the outermost JSON object
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        text = match.group()

    # Remove trailing commas before } or ]
    text = re.sub(r",\s*([}\]])", r"\1", text)

    return text


def parse_diagram_json(text: str) -> dict:
    cleaned = repair_json(text)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Failed to parse diagram JSON after repair: {e}\n"
            f"Cleaned text (first 500 chars): {cleaned[:500]}"
        )
    return validate_and_fix(data)


def validate_and_fix(data: dict) -> dict:
    node_ids = {n["id"] for n in data.get("nodes", []) if "id" in n}
    diagram_type = data.get("diagramType", "")

    # Remove edges whose source or target reference a non-existent node
    valid_edges = []
    for edge in data.get("edges", []):
        src, tgt = edge.get("source"), edge.get("target")
        if src in node_ids and tgt in node_ids:
            valid_edges.append(edge)
        else:
            logger.warning(
                "Dropping edge %s: source=%s or target=%s not in nodes",
                edge.get("id"), src, tgt,
            )
    data["edges"] = valid_edges

    # For database diagrams: ensure every node has type=db_table
    if diagram_type == "database":
        for node in data.get("nodes", []):
            node.setdefault("type", "db_table")

    # Remove groups that reference missing node ids
    if "groups" in data:
        for group in data["groups"]:
            group["nodeIds"] = [nid for nid in group.get("nodeIds", []) if nid in node_ids]
        data["groups"] = [g for g in data["groups"] if g["nodeIds"]]

    # Ensure every edge has a unique id
    seen_ids: set[str] = set()
    for i, edge in enumerate(data.get("edges", [])):
        if not edge.get("id") or edge["id"] in seen_ids:
            edge["id"] = f"e_auto_{i}"
        seen_ids.add(edge["id"])

    return data
