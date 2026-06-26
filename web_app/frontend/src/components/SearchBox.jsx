import { useRef } from "react";
import { resizeTextarea } from "../utils/textarea";




function SearchBox({ question, setQuestion, loading, askQuestion }) {

    const textareaRef = useRef(null);

    function handleChange(event) {

        setQuestion(event.target.value);

        resizeTextarea(textareaRef);

    }

    return (

        <div className="search-box">

            <textarea

                ref={textareaRef}

                placeholder="Ask a question about the FIA Sporting Regulations..."

                value={question}

                onChange={handleChange}
            />

            <button onClick={askQuestion} disabled={loading || question.trim() === ""} >

            {loading ? "⏳ Generating..." : "Ask Question"}

            </button>

        </div>

    );

}


export default SearchBox;