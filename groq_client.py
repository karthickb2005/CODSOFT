import os
from typing import List

# SDK-only Groq client wrapper
API_KEY = os.environ.get("GROQ_API_KEY")
if not API_KEY:
    raise EnvironmentError("GROQ_API_KEY environment variable is not set")


class Model:
    def __init__(self, name: str):
        self.name = name


try:
    from groq import Groq
except Exception as e:
    raise EnvironmentError("Groq SDK not installed. Install with: pip install groq") from e


_sdk_client = Groq(api_key=API_KEY)


def _extract_text_from_sdk_response(resp):
    # Try several common SDK response shapes conservatively
    try:
        # object-like: resp.choices[0].message.content
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
            if 'output' in resp and isinstance(resp['output'], str):
                return resp['output']
            if 'text' in resp and isinstance(resp['text'], str):
                return resp['text']
    except Exception:
        pass
    return None


def generate_text(model: str, prompt: str, timeout: int = 60) -> str:
    """Generate text using the Groq Python SDK (SDK-only).

    Raises clear exceptions when the SDK call fails.
    """
    try:
        resp = _sdk_client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            # SDK may accept timeout via kwargs; if not, the call will use default
        )

        # Try to extract text from known shapes
        text = _extract_text_from_sdk_response(resp)
        if text:
            return text

        # Try dict conversion fallback
        try:
            data = resp.__dict__
        except Exception:
            data = resp

        if isinstance(data, dict):
            found = _extract_text_from_sdk_response(data)
            if found:
                return found

        # As a last resort, string-ify the response
        return str(resp)
    except Exception as e:
        # Surface SDK exception to caller for handling/retry
        raise


def list_models() -> List[Model]:
    raw = _sdk_client.models.list()
    models_list: List[Model] = []
    try:
        # SDK may return iterable of model objects or dicts
        for m in raw:
            name = getattr(m, 'name', None) or (m.get('name') if isinstance(m, dict) else None)
            if name:
                models_list.append(Model(name))
    except Exception:
        # Try if raw is dict/list
        if isinstance(raw, list):
            for item in raw:
                if isinstance(item, str):
                    models_list.append(Model(item))
    return models_list
