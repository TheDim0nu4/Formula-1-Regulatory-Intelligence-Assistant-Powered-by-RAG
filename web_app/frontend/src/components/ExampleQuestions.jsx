import { resizeTextarea } from "../utils/textarea";




function ExampleQuestions({ questions, setQuestion }) {

    function selectQuestion(question) {
        
        setQuestion(question);

        setTimeout(() => resizeTextarea(), 0);

    }

    return (

        <div className="examples">

            <h3>

                Example Questions

            </h3>

            {

                questions.map((question, index) => (

                    <div

                        key={index}

                        className="example"

                        onClick={() => selectQuestion(question)}

                    >

                        {question}

                    </div>

                ))

            }

        </div>

    );

}


export default ExampleQuestions;