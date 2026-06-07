import os
from dotenv import load_dotenv
load_dotenv()
import groq_client as groq

# Write available models to file
with open("models_new_sdk.txt", "w") as f:
    try:
        for m in groq.list_models():
            print(m.name)
            f.write(m.name + "\n")
    except Exception as e:
        print(f"Error listing models: {e}")
        f.write(f"Error listing models: {e}\n")
