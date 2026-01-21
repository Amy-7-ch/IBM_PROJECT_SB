from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(
    api_key="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"
)

conversation = []

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat(request: ChatRequest):
    conversation.append({
        "role": "user",
        "content": request.message
    })

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=conversation
    )

    reply = response.choices[0].message.content

    conversation.append({
        "role": "assistant",
        "content": reply
    })

    return {"reply": reply}
