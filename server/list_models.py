"""
Temporary diagnostic script — NOT part of the app.
Run this once to see which models your real API key can actually use,
then delete this file.

Usage (from the server/ directory, with venv activated):
    python list_models.py
"""

from google import genai

from app.config import settings

client = genai.Client(api_key=settings.gemini_api_key)

print("Models available to this API key that support generateContent:\n")

for model in client.models.list():
    if "generateContent" in (model.supported_actions or []):
        print(f"  {model.name}")