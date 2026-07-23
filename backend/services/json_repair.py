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


def close_truncated(text: str) -> str:
    """Salvage JSON that was cut off mid-generation.

    Models stop mid-object when prompt+output overruns the context window. Rewind
    to the last point where a value ended cleanly (a `,` or a closing brace), drop
    the half-written tail, and close whatever brackets were still open there.
    """
    stack: list[str] = []
    cut: int | None = None       # where to truncate
    cut_stack: list[str] = []    # brackets open at that point
    in_str = esc = False

    for i, ch in enumerate(text):
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch in "{[":
            stack.append("}" if ch == "{" else "]")
        elif ch in "}]":
            if stack:
                stack.pop()
            # A closing bracket always ends a complete value.
            cut, cut_stack = i + 1, list(stack)
        elif ch == "," and stack and stack[-1] == "]":
            # Cut *before* the comma so no dangling separator is left behind.
            # Only array commas separate complete elements — a comma inside an
            # object sits between key/value pairs of an object that isn't
            # finished, and cutting there yields a node missing required fields.
            cut, cut_stack = i, list(stack)

    if cut is None:
        return text
    return text[:cut] + "".join(reversed(cut_stack))


def parse_diagram_json(text: str) -> dict:
    cleaned = repair_json(text)
    try:
        return validate_and_fix(json.loads(cleaned))
    except json.JSONDecodeError:
        pass

    # repair_json's greedy {...} match chops a truncated response at the last
    # *inner* brace, so retry from the first brace to the end and close it.
    start = text.find("{")
    salvaged = close_truncated(text[start:]) if start != -1 else text
    try:
        data = json.loads(salvaged)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Failed to parse diagram JSON after repair: {e}\n"
            f"Cleaned text (first 500 chars): {cleaned[:500]}"
        )

    # A salvage this shallow lost the whole diagram; a blank canvas is worse than
    # a clear error, and DiagramResponse would reject it with a vaguer one anyway.
    if not data.get("nodes"):
        raise ValueError(
            "Diagram JSON was cut off before any complete node "
            f"({len(text)} chars received). The model ran out of context — "
            "shorten the requirements or raise num_ctx."
        )

    logger.warning(
        "Diagram JSON was truncated (%d chars) — salvaged %d nodes, %d edges. "
        "Raise num_ctx or shorten the requirements for a complete diagram.",
        len(text), len(data.get("nodes", [])), len(data.get("edges", [])),
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


if __name__ == "__main__":
    # Self-check: a response cut off mid-generation must salvage into something
    # DiagramResponse accepts, or be rejected outright — never a half-built node.
    import sys
    from pathlib import Path

    sys.path.insert(0, str(Path(__file__).parent.parent))
    from models.diagram import DiagramResponse

    logging.disable(logging.WARNING)

    full = json.dumps(
        {
            "diagramType": "high_level",
            "title": "T",
            "nodes": [
                {"id": f"n{i}", "label": f"Node {i}", "icon": "server", "group": "g1",
                 "position": {"x": 0, "y": 0}, "metadata": {"tech": ["Go"]}}
                for i in range(12)
            ],
            "edges": [
                {"id": f"e{i}", "source": f"n{i}", "target": f"n{i+1}",
                 "label": "HTTPS", "style": "solid"}
                for i in range(11)
            ],
            "groups": [{"id": "g1", "label": "All",
                        "nodeIds": [f"n{i}" for i in range(12)],
                        "style": "dashed_border"}],
        },
        separators=(",", ":"),
    )

    assert parse_diagram_json(full)["title"] == "T"
    assert parse_diagram_json(f"```json\n{full}\n```")["title"] == "T"

    salvaged = rejected = 0
    for n in range(1, len(full)):
        try:
            d = parse_diagram_json(full[:n])
        except ValueError:
            rejected += 1
            continue
        DiagramResponse(**d)  # every salvage must satisfy the real response model
        ids = {x["id"] for x in d["nodes"]}
        assert all(e["source"] in ids and e["target"] in ids for e in d["edges"]), n
        assert all(set(g["nodeIds"]) <= ids for g in d.get("groups") or []), n
        salvaged += 1

    # Strings holding commas/braces must not be mistaken for structure.
    tricky = '{"nodes":[{"id":"a","label":"x,y}z"},{"id":"b","lab'
    assert [x["id"] for x in parse_diagram_json(tricky)["nodes"]] == ["a"]

    assert salvaged and rejected, "expected both outcomes across the sweep"
    print(f"json_repair OK — {salvaged} truncations salvaged, {rejected} rejected")
