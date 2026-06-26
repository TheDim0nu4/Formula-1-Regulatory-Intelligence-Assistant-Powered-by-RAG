import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";




function AnswerCard({ answer, error }) {

    if (error !== "") {

        return (

            <div className="answer-card">

                <div className="answer-header">

                    <h3>Error</h3>

                </div>

                <p>{error}</p>

            </div>

        );

    }

    if (answer === "")
        return null;

    return (

        <div className="answer-card">

            <div className="answer-header">

                <h3>Answer</h3>

            </div>

            <ReactMarkdown remarkPlugins={[remarkGfm]}>

                {answer}

            </ReactMarkdown>

        </div>

    );

}


export default AnswerCard;