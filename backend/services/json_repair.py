import re
import json


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
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Failed to parse diagram JSON after repair: {e}\n"
            f"Cleaned text (first 500 chars): {cleaned[:500]}"
        )
