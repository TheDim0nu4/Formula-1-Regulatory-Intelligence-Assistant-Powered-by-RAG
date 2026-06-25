from qdrant_client.models import Filter, FieldCondition, MatchValue, Prefetch, SparseVector, FusionQuery
import math




def get_dense_embedding(dense_model, text):

    return next(dense_model.embed([text])).tolist()




def get_sparse_embedding(sparse_model, text):

    sparse_embedding = next(sparse_model.embed([text]))

    values = sparse_embedding.values.tolist()
    indices = sparse_embedding.indices.tolist()

    return values, indices




def retrieval(query, qdrant_client, dense_model, sparse_model, relevant_years, limit_vector_search=200, limit_keywords_search=200, 
                                                                                                                        limit_result=100):

    dense_embedding = get_dense_embedding(dense_model, query)
    sparse_embedding_values, sparse_embedding_indices = get_sparse_embedding(sparse_model, query)


    query_filter = None

    if relevant_years != []:

        query_filter = Filter(
            should=[
                FieldCondition(
                    key="year",
                    match=MatchValue(value=year)
                )
                for year in relevant_years
            ]
        )


    results = qdrant_client.query_points(
        collection_name="regulations",
        with_payload=True,
        prefetch=[
            Prefetch(
                query=dense_embedding,
                using="dense",
                limit=limit_vector_search,
                filter=query_filter
            ),
            Prefetch(
                query=SparseVector(
                    indices=sparse_embedding_indices,
                    values=sparse_embedding_values
                ),
                using="sparse",
                limit=limit_keywords_search,
                filter=query_filter
            ),
        ],
        query=FusionQuery(fusion="rrf"),
        limit=limit_result,
    )


    return results.points




def reranking(query, list_points, cohere_client, top_n):

    texts = []

    for point in list_points:

        text = f"""
        Regulation Type: {point.payload['regulation_type']} regulation
        Year: {point.payload['year']}
        Article: {point.payload['article']}
        Chapter: {point.payload['chapter']}

        {point.payload['content']}
        """.strip()

        texts.append(text)


    response = cohere_client.rerank(
        model="rerank-v4.0-pro",
        query=query,
        documents=texts,
        top_n=top_n,
    )
    
    reranking_result = [ list_points[item.index] for item in response.results ]


    return reranking_result




def generate_multi_queries(query, gemini_client, number_generated_queries=4):

    gemini_prompt = f"""
    Generate {number_generated_queries} alternative search queries for the following question.

    The queries should have the same meaning but use different wording.

    Question:
    {query}

    Return only the queries, one per line.
    """

    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=gemini_prompt
    )

    return [query] + response.text.split("\n")




def reciprocal_rank_fusion(result_lists, k=60):

    id_point = {}

    for points_list in result_lists:

        for idx, point in enumerate(points_list):

            id = point.id

            if id not in id_point:
                id_point[id] = point
                id_point[id].score = 0

            id_point[id].score += ( 1 / (k + (idx+1)) )


    rrf_result = sorted( list(id_point.items()), key=lambda x: x[1].score, reverse=True )
    rrf_result = list( dict(rrf_result).values() )


    return rrf_result     




def generate_answer(user_query, list_points, gemini_client):

    texts = []

    for point in list_points:

        text = f"""
        Regulation Type: {point.payload['regulation_type']} regulation
        Year: {point.payload['year']}
        Article: {point.payload['article']}
        Chapter: {point.payload['chapter']}

        {point.payload['content']}
        """.strip()

        texts.append(text)

    context = '\n\n'.join(texts)


    prompt = f"""
    You are an expert on FIA Formula 1 Regulations.

    Answer the question using ONLY the provided context.

    Rules:

    - Do not use outside knowledge.
    - If the answer is not available in the context, say:
    "The provided regulations do not contain enough information to answer this question."
    - For every factual statement, provide the corresponding year, regulation type, and article number.
    - If multiple articles are relevant, cite all of them.
    - Be precise, concise, and factual.
    - Prefer concise summaries over reproducing regulatory text.
    - Do not quote large portions of regulations unless necessary.
    - Use bullet points when comparing regulations.

    - When answering comparison questions, focus only on substantive regulatory changes.
    - Compare regulations based on the content and meaning of the rules, not article numbering.
    - Do not assume that two rules are equivalent because they share the same article number.
    - Do not assume that two rules are different because they have different article numbers.
    - Do not treat article renumbering, article references, cross-references, formatting changes, or wording changes as regulatory changes unless the actual meaning of the rule has changed.
    - Changes in article references, article numbering, and cross-references must not be reported as regulatory changes unless the provided context demonstrates a change in the underlying rule.
    - If the only observed difference is a change in article references, article numbering, or cross-references, classify the result as "Insufficient information for comparison" unless the content of the referenced regulations is available and demonstrates a substantive change.
    - A difference in wording or references alone is not sufficient evidence of a substantive regulatory change.
    - A regulatory change should be reported only when the rule's requirements, permissions, restrictions, procedures, obligations, or penalties have changed.
    - Before reporting a regulatory change, verify that the actual rule content differs between the years.

    - Structure comparison answers using the following sections:
    - Confirmed substantive regulatory changes
    - Confirmed unchanged regulations
    - Insufficient information for comparison

    - If no confirmed substantive regulatory changes are found, explicitly state:
    "No confirmed substantive regulatory changes were identified in the provided context."

    - Do not conclude that a rule was added, removed, or modified unless evidence from all relevant years is present in the context.
    - Missing articles in the retrieved context should be treated as insufficient information, not as evidence of a regulatory change.
    - If the available context is insufficient to compare a rule across years, classify it as "Insufficient information for comparison".

    - For comparison questions, summarize the outcome of the comparison before providing supporting details.
    - Focus on the most important findings rather than listing every matching article.

    Context:
    {context}

    Question:
    {user_query}
    """


    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )


    return response.text




def extract_years(query, gemini_client):

    prompt = f"""
    Extract Formula 1 regulation years mentioned in the question.

    If a range is requested, return all years in that range.

    Return ONLY a LIST of integers.

    Examples:

    Question:
    What were the Safety Car rules in 2021?

    Answer:
    [2021]

    Question:
    Compare the 2018 and 2026 regulations.

    Answer:
    [2018, 2026]

    Question:
    How did the regulations change from 2020 to 2026?

    Answer:
    [2020, 2021, 2022, 2023, 2024, 2025, 2026]

    Question:
    How did the regulations evolve between 2019 and 2022?

    Answer:
    [2019, 2020, 2021, 2022]

    Question:
    In which year was the fastest lap point removed?

    Answer:
    []

    Question:
    {query}
    """


    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=prompt
    )


    return eval(response.text)




def rag_pipeline(user_query, gemini_client, qdrant_client, dense_model, sparse_model, cohere_client):

    relevant_years = extract_years(user_query, gemini_client)

    queries = generate_multi_queries(user_query, gemini_client)

    hybrid_search_results_lists = [ retrieval(query, qdrant_client, dense_model, sparse_model, relevant_years) for query in queries]
    
    rrf_result = reciprocal_rank_fusion(hybrid_search_results_lists)


    reranking_top_n = 25   # 20
    reranking_result = []

    if len(relevant_years) <= 1:
        reranking_result = reranking(user_query, rrf_result, cohere_client, reranking_top_n)
    else:
        top_n_per_year = math.ceil( reranking_top_n / len(relevant_years) ) 

        for year in relevant_years:

            year_specific_points = list( filter( lambda x: x.payload['year'] == year, rrf_result ) )
            reranking_year_res = reranking(user_query, year_specific_points, cohere_client, min(top_n_per_year, len(year_specific_points)))

            reranking_result += reranking_year_res


    final_answer = generate_answer(user_query, reranking_result, gemini_client)


    return final_answer, reranking_result



