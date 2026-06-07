import os
from dotenv import load_dotenv
load_dotenv()
import groq_client as groq

api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    raise EnvironmentError("GROQ_API_KEY environment variable is not set")

print("Listing available models:")
with open("models.txt", "w") as f:
    for m in groq.list_models():
        f.write(m.name + "\n")
        print(m.name)
