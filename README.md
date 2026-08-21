# 🏁 Formula 1 Regulatory Intelligence Assistant Powered by Retrieval-Augmented Generation (RAG)

This project implements a Formula 1 Regulatory Intelligence Assistant powered by Retrieval-Augmented Generation (RAG). 
The system allows users to ask natural language questions about FIA Formula 1 Sporting Regulations and returns accurate answers with references to the relevant regulation articles. 
It combines document parsing, chunking, hybrid retrieval using dense and sparse embeddings, multi-query retrieval, reranking, answer generation using LLM APIs, 
and a web application that provides an intuitive interface for interacting with the system.

  

## 📁 Project Structure 

```
Formula-1-Regulatory-Intelligence-Assistant-Powered-by-RAG/
│
├── data/
│   ├── documents/
│   └── qdrant_storage/
│
├── images/
│
├── notebooks/
│   ├── data_indexing.ipynb
│   └── rag_pipeline_test.ipynb
│
├── web_app/
│   ├── backend/
│   ├── frontend/
│   └── docker-compose.yml
│
├── .env
├── .gitignore
├── README.md
└── requirements.txt
```

- 
-



## 📊 Data

The knowledge base of the assistant consists of the official FIA Formula 1 Sporting Regulations covering the 2018–2026 seasons, downloaded as PDF documents from: 

https://api.fia.com/regulation/category/110

Since the PDFs contain introductory and concluding pages without regulatory content, metadata (data/documents/metadata.json) was created for each document, specifying the first and last relevant page, the regulation type, and the year. Because the 2018–2025 documents share one structure while the 2026 document follows a different one, two separate parsing functions were implemented to split each document into structured chunks. Each chunk stores the article number, chapter name, regulation content, together with its regulation type and year.



## 🧩 Data Indexing

Data indexing is implemented in notebooks/data_indexing.ipynb and covers the following steps:

1. Document Chunking – text is extracted from each PDF and split into chunks based on the document's article/chapter structure, with the corresponding metadata attached to every chunk.
2. Creating the Vector Database – Qdrant is used as the vector database because it is fast, easy to use, and supports both dense and sparse vectors, which are required for hybrid search. Qdrant runs as a Docker container with a bind mount for persistent storage, so the same storage is later reused by the web application.
3. Creating Embeddings – since hybrid search is used, two types of vectors are generated for every chunk: dense embeddings with BAAI/bge-small-en-v1.5 and sparse embeddings with Qdrant/minicoil-v1. Embeddings are computed not only from the regulation text but also from its metadata (regulation type, year, chapter, article) to improve retrieval quality.
4. Saving Embeddings into the Database – the resulting points are upserted into the regulations collection in Qdrant.



## 💻 Web Application

The web application lets users type a question, pick from a list of example questions, or write their own. The question is sent to the backend, which runs the full RAG pipeline and returns a generated answer together with the retrieved regulation references. 

![image](images/web_app_1.png)

![image](images/web_app_2.png)

























