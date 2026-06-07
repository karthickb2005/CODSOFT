import os
import requests
from typing import List

# Prefer official Groq SDK when available, fallback to HTTP
BASE_URL = os.environ.get("GROQ_API_URL", "https://api.groq.dev/v1")
API_KEY = os.environ.get("GROQ_API_KEY")
if not API_KEY:
    raise EnvironmentError("GROQ_API_KEY environment variable is not set")


class Model:
    def __init__(self, name: str):
        self.name = name


HAS_SDK = False
_sdk_client = None
try:
    from groq import Groq
    _sdk_client = Groq(api_key=API_KEY)
    HAS_SDK = True
except Exception:
    HAS_SDK = False


def _headers():
    return {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }


def _extract_text_from_sdk_response(resp):
    # Try several common SDK response shapes
    try:
        # new-style: resp.choices[0].message.content
        choices = getattr(resp, 'choices', None)
        if choices:
            first = choices[0]
            msg = getattr(first, 'message', None)
            if msg:
                text = getattr(msg, 'content', None) or getattr(msg, 'text', None)
                if text:
                    return text

        # dict-like
        if isinstance(resp, dict):
            if 'choices' in resp and resp['choices']:
                c = resp['choices'][0]
                if isinstance(c, dict):
                    m = c.get('message') or c.get('message', {})
                    if isinstance(m, dict):
                        return m.get('content') or m.get('text')
            if 'output' in resp:
                return resp['output']
            if 'text' in resp:
                return resp['text']
    except Exception:
        pass
    return None


def generate_text(model: str, prompt: str, timeout: int = 60) -> str:
    """Generate text using Groq SDK if present, otherwise HTTP fallback."""
    # SDK path
    if HAS_SDK and _sdk_client is not None:
        try:
            resp = _sdk_client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
            )
            text = _extract_text_from_sdk_response(resp)
            if text:
                return text
            # try dict conversion
            try:
                data = resp.__dict__
            except Exception:
                data = resp
            if isinstance(data, dict):
                found = _extract_text_from_sdk_response(data)
                if found:
                    return found
        except Exception:
            # fall through to HTTP fallback
            pass

    # HTTP fallback (try multiple endpoints)
    candidate_paths = [
        f"/models/{model}/outputs",
        f"/models/{model}/generate",
        f"/models/{model}/completions",
        f"/models/{model}/predict",
        f"/generate?model={model}",
    ]

    last_exc = None
    for path in candidate_paths:
        url = f"{BASE_URL}{path}"
        payload = {"input": prompt} if "generate" in path or "outputs" in path or "completions" in path else {"prompt": prompt}
        try:
            resp = requests.post(url, json=payload, headers=_headers(), timeout=timeout)
            if resp.status_code == 404:
                last_exc = requests.HTTPError(f"404 Not Found for {url}")
                continue
            resp.raise_for_status()
            data = resp.json()

            # Extract text from common shapes
            if isinstance(data, dict):
                if 'outputs' in data and isinstance(data['outputs'], list):
                    first = data['outputs'][0]
                    if isinstance(first, dict) and 'content' in first:
                        for item in first['content']:
                            if isinstance(item, dict) and 'text' in item:
                                return item['text']
                if 'result' in data and isinstance(data['result'], dict) and 'output' in data['result']:
                    return data['result']['output']
                if 'output' in data and isinstance(data['output'], str):
                    return data['output']
                if 'text' in data and isinstance(data['text'], str):
                    return data['text']

            # Nested search
            def find_first_string(obj):
                if isinstance(obj, str):
                    return obj
                if isinstance(obj, dict):
                    for v in obj.values():
                        res = find_first_string(v)
                        if res:
                            return res
                if isinstance(obj, list):
                    for v in obj:
                        res = find_first_string(v)
                        if res:
                            return res
                return None

            found = find_first_string(data)
            if found:
                return found

            return str(data)
        except Exception as e:
            last_exc = e
            continue

    raise last_exc if last_exc is not None else RuntimeError("No endpoints attempted")


def list_models() -> List[Model]:
    # SDK path
    if HAS_SDK and _sdk_client is not None:
        try:
            raw = _sdk_client.models.list()
            models_list = []
            # Try SDK return types
            try:
                for m in raw:
                    name = getattr(m, 'name', None) or (m.get('name') if isinstance(m, dict) else None)
                    if name:
                        models_list.append(Model(name))
            except Exception:
                pass
            return models_list
        except Exception:
            pass

    # HTTP fallback
    url = f"{BASE_URL}/models"
    resp = requests.get(url, headers=_headers(), timeout=30)
    resp.raise_for_status()
    data = resp.json()

    models_list = []
    if isinstance(data, dict) and "models" in data:
        raw = data["models"]
    elif isinstance(data, list):
        raw = data
    else:
        raw = []
        for v in data.values() if isinstance(data, dict) else []:
            if isinstance(v, list):
                raw = v
                break

    for m in raw:
        if isinstance(m, dict) and "name" in m:
            models_list.append(Model(m["name"]))
        elif isinstance(m, str):
            models_list.append(Model(m))

    return models_list
