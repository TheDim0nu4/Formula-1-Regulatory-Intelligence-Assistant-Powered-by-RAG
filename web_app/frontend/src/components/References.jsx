function References({references}) {

    if (references.length === 0)
        return null;

    return (

        <div className="references">

            <h3>

                References

            </h3>

            <ol className="reference-list">

                {

                    references.map((reference, index) => (

                        <li key={index} className="reference-card">

                            <div className="reference-header">

                                <span className="reference-year">

                                    {reference.year}{" "}

                                </span>

                                <span className="reference-type">

                                    {reference.regulation_type.charAt(0).toUpperCase() +
                                        reference.regulation_type.slice(1)} Regulation

                                </span>

                            </div>

                            <div className="reference-details">

                                <strong>

                                    Article {reference.article},

                                </strong>

                                <span>

                                    Chapter "{reference.chapter}"

                                </span>

                            </div>

                        </li>

                    ))

                }

            </ol>

        </div>

    );

}


export default References;