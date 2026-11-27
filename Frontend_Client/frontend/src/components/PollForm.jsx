import { useState } from 'react';

const emptyPoll = { question: '', description: '', options: ['', ''], ends_at: '' };

const toLocalDateTime = (date) => {
    const localDate = new Date(new Date(date).getTime() - new Date(date).getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
};

export default function PollForm({ initialPoll, onSubmit, submitting, submitLabel }) {
    const [question, setQuestion] = useState(() => initialPoll?.question || emptyPoll.question);
    const [description, setDescription] = useState(() => initialPoll?.description || emptyPoll.description);
    const [options, setOptions] = useState(() => (
        initialPoll ? initialPoll.options.map((option) => option.option_text) : emptyPoll.options
    ));
    const [endsAt, setEndsAt] = useState(() => (
        initialPoll?.ends_at ? toLocalDateTime(initialPoll.ends_at) : emptyPoll.ends_at
    ));

    const changeOption = (index, value) => {
        setOptions((current) => current.map((option, position) => (
            position === index ? value : option
        )));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit({
            question,
            description,
            options,
            ends_at: endsAt ? new Date(endsAt).toISOString() : null
        });
    };

    return (
        <form className="poll-form" onSubmit={handleSubmit}>
            <label>
                Your question <span className="required-mark">*</span>
                <input
                    autoFocus
                    maxLength={255}
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="What would you like to know?"
                    required
                />
            </label>
            <label>
                A little context <span className="optional-label">Optional</span>
                <textarea
                    rows={3}
                    maxLength={5000}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Add a note to help people choose."
                />
            </label>
            <fieldset>
                <legend>Answer options <span className="required-mark">*</span></legend>
                <p className="field-hint">Add 2 to 6 distinct options.</p>
                <div className="option-fields">
                    {options.map((option, index) => (
                        <div className="option-field" key={index}>
                            <span className="option-number">{String(index + 1).padStart(2, '0')}</span>
                            <input
                                aria-label={`Option ${index + 1}`}
                                maxLength={255}
                                value={option}
                                onChange={(event) => changeOption(index, event.target.value)}
                                placeholder={`Option ${index + 1}`}
                                required
                            />
                            {options.length > 2 && (
                                <button
                                    className="remove-option"
                                    type="button"
                                    aria-label={`Remove option ${index + 1}`}
                                    onClick={() => setOptions((current) => current.filter((_, position) => position !== index))}
                                >×</button>
                            )}
                        </div>
                    ))}
                </div>
                {options.length < 6 && (
                    <button
                        className="text-button add-option"
                        type="button"
                        onClick={() => setOptions((current) => [...current, ''])}
                    >+ Add an option</button>
                )}
            </fieldset>
            <label className="closing-field">
                Closes at <span className="optional-label">Optional</span>
                <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(event) => setEndsAt(event.target.value)}
                />
            </label>
            <div className="form-actions">
                <button className="button button-primary" disabled={submitting}>
                    {submitting ? 'Saving…' : submitLabel}
                </button>
            </div>
        </form>
    );
}
