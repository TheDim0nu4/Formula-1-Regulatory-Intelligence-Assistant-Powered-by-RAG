import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function App() {

    const exampleQuestions = [
        "Under what conditions can the Safety Car be deployed during a race in 2024?",
        "How did the Safety Car regulations change between 2021 and 2022?",
        "How have the Sprint regulations evolved from 2021 to 2026?",
        "Which articles in the 2026 Sporting Regulations govern Safety Car procedures?",
        "A lapped driver ignored multiple blue flags during a race in 2024. Should the driver receive a penalty?"
    ];

    const textareaRef = useRef(null);

    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);

    const [answer, setAnswer] = useState("");
    const [references, setReferences] = useState([]);
    const [error, setError] = useState("");

    function resizeTextarea() {

        const textarea = textareaRef.current;

        if (!textarea)
            return;

        const MIN_HEIGHT = 95;
        const MAX_HEIGHT = 220;

        textarea.style.height = `${MIN_HEIGHT}px`;

        const newHeight = Math.min(textarea.scrollHeight, MAX_HEIGHT);

        textarea.style.height = `${newHeight}px`;

        if (textarea.scrollHeight > MAX_HEIGHT)
            textarea.style.overflowY = "auto";
        else
            textarea.style.overflowY = "hidden";

    }

    async function askQuestion() {

        if (question.trim() === "")
            return;

        setLoading(true);

        setAnswer("");
        setReferences([]);
        setError("");

        try {

            const response = await fetch("/api/get-answer", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    question: question
                })

            });

            if (!response.ok) {

                const error = await response.json();

                throw new Error(error.detail);

            }

            const data = await response.json();

            setAnswer(data.answer);
            setReferences(data.references);

            setQuestion("");

            setTimeout(resizeTextarea, 0);

        }
        catch (err) {

            console.error(err);

            setError(err.message);

        }
        finally {

            setLoading(false);

        }

    }

    function handleKeyDown(event) {

        if (event.ctrlKey && event.key === "Enter") {

            event.preventDefault();

            askQuestion();

        }

    }

    return (

        <div className="app">

            <div className="container">

                <header>

                    <h1>🏎 Formula 1</h1>

                    <h2>
                        Regulatory Intelligence Assistant
                    </h2>

                    <p>
                        Powered by Retrieval-Augmented Generation (RAG) over FIA Sporting Regulations (2018–2026)
                    </p>

                </header>

                <div className="search-box">

                    <textarea

                        ref={textareaRef}

                        placeholder="Ask a question about the FIA Sporting Regulations..."

                        value={question}

                        onChange={(e) => {

                            setQuestion(e.target.value);

                            resizeTextarea();

                        }}

                        onKeyDown={handleKeyDown}

                    />

                    <button

                        onClick={askQuestion}

                        disabled={loading || question.trim() === ""}

                    >

                        {loading ? "⏳ Generating..." : "Ask Question"}

                    </button>

                </div>

                <div className="examples">

                    <h3>
                        Example Questions
                    </h3>

                    {

                        exampleQuestions.map((q, index) => (

                            <div

                                key={index}

                                className="example"

                                onClick={() => {

                                    setQuestion(q);

                                    setTimeout(resizeTextarea, 0);

                                }}

                            >

                                {q}

                            </div>

                        ))

                    }

                </div>

                {

                    error !== "" &&

                    <div className="answer-card">

                        <div className="answer-header">

                            <h3>Error</h3>

                        </div>

                        <p>{error}</p>

                    </div>

                }

                {

                    answer !== "" &&

                    <div className="answer-card">

                        <div className="answer-header">

                            <h3>Answer</h3>

                        </div>

                        <ReactMarkdown remarkPlugins={[remarkGfm]}>

                            {answer}

                        </ReactMarkdown>

                    </div>

                }

                {

                    references.length > 0 &&

                    <div className="references">

                        <h3>

                            References

                        </h3>

                        <ol className="reference-list">

                            {

                                references.map((reference, index) => (

                                    <li

                                        key={index}

                                        className="reference-card"

                                    >

                                        {reference}

                                    </li>

                                ))

                            }

                        </ol>

                    </div>

                }

            </div>

        </div>

    );

}

export default App;