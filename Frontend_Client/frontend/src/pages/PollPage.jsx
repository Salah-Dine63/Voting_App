import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../Context/useAuth';
import { apiRequest, getSocketUrl } from '../services/api';

const dateLabel = (date) => new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
}).format(new Date(date));

export default function PollPage() {
    const { publicId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [poll, setPoll] = useState(null);
    const [results, setResults] = useState(null);
    const [selectedOption, setSelectedOption] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const pollStatus = poll?.status;

    useEffect(() => {
        let mounted = true;
        apiRequest(`/polls/${publicId}`)
            .then(async (pollData) => {
                if (!mounted) return;
                setPoll(pollData.poll);
                if (pollData.poll.has_voted || pollData.poll.status === 'closed') {
                    const initialResults = await apiRequest(`/polls/${publicId}/results`);
                    if (mounted) setResults(initialResults);
                }
            })
            .catch((requestError) => {
                if (mounted) setError(requestError.message);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => { mounted = false; };
    }, [publicId, user]);

    useEffect(() => {
        if (pollStatus !== 'active') return undefined;
        const socket = io(getSocketUrl());
        const onResults = (updatedResults) => setResults(updatedResults);
        const onClosed = () => {
            setPoll((current) => current ? { ...current, status: 'closed' } : current);
            setNotice('This poll has closed.');
        };
        const onConnect = () => socket.emit('poll:join', publicId);
        socket.on('connect', onConnect);
        socket.on('poll:results-updated', onResults);
        socket.on('poll:closed', onClosed);
        return () => {
            socket.emit('poll:leave', publicId);
            socket.off('connect', onConnect);
            socket.off('poll:results-updated', onResults);
            socket.off('poll:closed', onClosed);
            socket.disconnect();
        };
    }, [publicId, pollStatus]);

    const handleVote = async (event) => {
        event.preventDefault();
        if (!user) {
            navigate('/login', { state: { from: { pathname: `/polls/${publicId}` } } });
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            const updatedResults = await apiRequest(`/polls/${publicId}/votes`, {
                method: 'POST',
                body: JSON.stringify({ option_id: selectedOption })
            });
            setResults(updatedResults);
            setPoll((current) => ({ ...current, has_voted: true }));
            setNotice('Your vote has been recorded.');
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSubmitting(false);
        }
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setNotice('Poll link copied.');
        } catch {
            setError('Could not copy the link. Copy the address from your browser instead.');
        }
    };

    const isOwner = user && poll && String(user.id) === String(poll.created_by);
    const canVote = user && poll && poll.status === 'active' && !poll.has_voted;

    if (loading) return <main className="page container"><p className="loading-state">Loading poll…</p></main>;
    if (error && !poll) return <main className="page container"><p className="notice notice-error">{error}</p></main>;
    if (!poll) return null;

    return (
        <main className="page container poll-detail-page">
            <Link className="back-link" to="/">← Explore polls</Link>
            <div className="poll-detail-top">
                <span className={`status-label status-${poll.status}`}>{poll.status}</span>
                <button className="text-button" onClick={copyLink}>Copy poll link</button>
            </div>
            <p className="eyebrow">A question for the room</p>
            <h1>{poll.question}</h1>
            {poll.description && <p className="poll-description">{poll.description}</p>}
            <p className="poll-byline">
                Asked by {[poll.creator_first_name, poll.creator_last_name].filter(Boolean).join(' ')}
                {poll.ends_at && <> · Closes {dateLabel(poll.ends_at)}</>}
            </p>

            {notice && <p className="notice notice-success" role="status">{notice}</p>}
            {error && <p className="notice notice-error" role="alert">{error}</p>}

            {results && (poll.has_voted || poll.status === 'closed' || isOwner) ? (
                <ResultsBlock results={results} />
            ) : canVote ? (
                <form className="vote-form" onSubmit={handleVote}>
                    <fieldset>
                        <legend>Choose one answer</legend>
                        {poll.options.map((option) => (
                            <label className={`vote-option ${selectedOption === String(option.id) ? 'is-selected' : ''}`} key={option.id}>
                                <input
                                    type="radio"
                                    name="poll-option"
                                    value={option.id}
                                    checked={selectedOption === String(option.id)}
                                    onChange={(event) => setSelectedOption(event.target.value)}
                                />
                                <span>{option.option_text}</span>
                                <span className="radio-indicator" />
                            </label>
                        ))}
                    </fieldset>
                    <button className="button button-primary" disabled={!selectedOption || submitting}>
                        {submitting ? 'Submitting…' : 'Submit your vote'}
                    </button>
                </form>
            ) : poll.status === 'draft' ? (
                <div className="notice">This poll is a draft and has not been published.</div>
            ) : poll.status === 'active' ? (
                <p className="notice">{user ? 'You have already voted.' : 'Sign in to cast your vote.'}</p>
            ) : (
                <ResultsBlock results={results} />
            )}

            {isOwner && (
                <OwnerActions poll={poll} publicId={publicId} onUpdate={setPoll} onError={setError} />
            )}
        </main>
    );
}

function ResultsBlock({ results }) {
    if (!results) return <p className="loading-state">Loading poll results…</p>;
    return (
        <section className="results-block" aria-live="polite">
            <div className="results-heading">
                <h2>Current results</h2>
                <span>{results.totalVotes} {results.totalVotes === 1 ? 'vote' : 'votes'}</span>
            </div>
            <div className="result-list">
                {results.options.map((option) => (
                    <div className="result-row" key={option.id}>
                        <div className="result-label">
                            <span>{option.option_text}</span>
                            <strong>{option.percentage}% <small>({option.votes})</small></strong>
                        </div>
                        <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${option.percentage}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function OwnerActions({ poll, publicId, onUpdate, onError }) {
    const [busy, setBusy] = useState(false);

    const changeStatus = async (action) => {
        setBusy(true);
        onError('');
        try {
            const response = await apiRequest(`/polls/${publicId}/${action}`, { method: 'POST' });
            onUpdate((current) => ({ ...current, ...response.poll }));
        } catch (requestError) {
            onError(requestError.message);
        } finally {
            setBusy(false);
        }
    };

    const deleteDraft = async () => {
        setBusy(true);
        onError('');
        try {
            await apiRequest(`/polls/${publicId}`, { method: 'DELETE' });
            window.location.assign('/dashboard');
        } catch (requestError) {
            onError(requestError.message);
            setBusy(false);
        }
    };

    return (
        <div className="owner-actions">
            <span>Manage this poll</span>
            {poll.status === 'draft' && (
                <>
                    <Link className="button button-secondary" to={`/polls/${publicId}/edit`}>Edit draft</Link>
                    <button className="button button-primary" disabled={busy} onClick={() => changeStatus('publish')}>Publish poll</button>
                    <button className="text-button danger-text" disabled={busy} onClick={deleteDraft}>Delete draft</button>
                </>
            )}
            {poll.status === 'active' && (
                <>
                    <Link className="button button-secondary" to={`/polls/${publicId}/results`}>Live results</Link>
                    <button className="button button-secondary" disabled={busy} onClick={() => changeStatus('close')}>Close poll</button>
                </>
            )}
        </div>
    );
}
