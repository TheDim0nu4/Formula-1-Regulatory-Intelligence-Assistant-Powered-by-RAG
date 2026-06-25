from fastapi import FastAPI, HTTPException
from fastembed import SparseTextEmbedding, TextEmbedding
from qdrant_client import QdrantClient
import cohere
import os
from google import genai
from rag_pipeline import rag_pipeline
import time




app = FastAPI()




dense_model = TextEmbedding(
    model_name="BAAI/bge-small-en-v1.5"
)

sparse_model = SparseTextEmbedding(
    model_name="Qdrant/minicoil-v1"
)

qdrant_client = QdrantClient(url='http://qdrant:6333')

cohere_client = cohere.ClientV2(api_key=os.getenv("COHERE_API_KEY"))

gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))





@app.get('/')
def index():
    return {'status': 'everything is okay'}




@app.get('/get-answer')
def get_answer(question: str):


    MAX_RETRIES = 3

    for attempt in range(1, MAX_RETRIES+1):

        try:
            answer, retrieved_chunks = rag_pipeline(question, gemini_client, qdrant_client, dense_model, sparse_model, cohere_client)

        except Exception as e:

            if '503 UNAVAILABLE' in str(e) and attempt < MAX_RETRIES:
                time.sleep(5)
                continue

            raise HTTPException(status_code=500, detail=str(e))
        
        else:
            break


    references = []

    for chunk in retrieved_chunks:

        year = chunk.payload['year']
        regulation_type = chunk.payload['regulation_type']
        article = chunk.payload['article']
        chapter = chunk.payload['chapter']

        references.append(f"{year} {regulation_type.capitalize()} regulation, article {article}, chapter '{chapter}'")


    return {'answer': answer, 'references': references, 'attempt': attempt}




