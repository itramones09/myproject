import os
import time
from dotenv import load_dotenv
from google import genai
from google.genai import errors

# Load variables from .env
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError(
        "GEMINI_API_KEY was not found in .env"
    )

# Create Gemini client
client = genai.Client(api_key=api_key)

prompt = "Explain artificial intelligence in one simple sentence."

for attempt in range(1, 4):
    try:
        print(f"Sending request to Gemini... Attempt {attempt}")

        interaction = client.interactions.create(
            model="gemini-3.8-flash",
            input=prompt
        )

        print("\nGemini response:")
        print(interaction.output_text)

        break

    except errors.ServerError as e:
        print("\nGemini server is temporarily unavailable.")

        if attempt < 3:
            print("Retrying in 3 seconds...\n")
            time.sleep(3)
        else:
            print("Failed after 3 attempts.")
            print(e)

    except errors.ClientError as e:
        print("\nGemini client error:")
        print(e)
        break

    except Exception as e:
        print("\nUnexpected error:")
        print(e)
        break