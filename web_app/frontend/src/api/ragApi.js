export async function getAnswer(question) {

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

    return await response.json();

}