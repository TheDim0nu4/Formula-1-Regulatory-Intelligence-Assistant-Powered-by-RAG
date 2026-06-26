import { useState } from "react";

import Header from "./components/Header";
import SearchBox from "./components/SearchBox";
import ExampleQuestions from "./components/ExampleQuestions";
import AnswerCard from "./components/AnswerCard";
import References from "./components/References";

import { getAnswer } from "./api/ragApi";




function App() {

    const exampleQuestions = [
        "Under what conditions can the Safety Car be deployed during a race in 2024?",
        "How did the Safety Car regulations change between 2021 and 2022?",
        "How have the Sprint regulations evolved from 2021 to 2026?",
        "Which articles in the 2026 Sporting Regulations govern Safety Car procedures?",
        "A driver exceeded the maximum speed limit in the pit lane during a race in 2022. According to the Sporting Regulations, should the driver receive a penalty?"
    ];

    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);

    const [answer, setAnswer] = useState("");
    const [references, setReferences] = useState([]);
    const [error, setError] = useState("");

    async function askQuestion() {

        if (question.trim() === "")
            return;

        setLoading(true);

        setAnswer("");
        setReferences([]);
        setError("");

        try {

            const data = await getAnswer(question);

            setAnswer(data.answer);
            setReferences(data.references);

            setQuestion("");

        }
        catch (err) {

            console.error(err);

            setError(err.message);

        }
        finally {

            setLoading(false);

        }

    }

    return (

        <div className="app">

            <div className="container">

                <Header />

                <SearchBox
                    question={question}
                    setQuestion={setQuestion}
                    loading={loading}
                    askQuestion={askQuestion}
                />

                <ExampleQuestions
                    questions={exampleQuestions}
                    setQuestion={setQuestion}
                />

                <AnswerCard
                    answer={answer}
                    error={error}
                />

                <References
                    references={references}
                />

            </div>

        </div>

    );

}


export default App;