import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { apiRequest, getSocketUrl } from '../services/api';

export default function PollResultsPage() {
    const { publicId } = useParams();
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const resultsStatus = results?.poll.status;

    useEffect(() => {
        let mounted = true;
        apiRequest(`/polls/${publicId}/results`)
            .then((data) => {
                if (mounted) setResults(data);
            })
            .catch((requestError) => {
                if (mounted) setError(requestError.message);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => { mounted = false; };
    }, [publicId]);

    useEffect(() => {
        if (resultsStatus !== 'active') return undefined;
        const socket = io(getSocketUrl());
        const onResults = (updatedResults) => setResults(updatedResults);
        const onConnect = () => socket.emit('poll:join', publicId);
        const onClosed = () => {
            setResults((current) => current ? {
                ...current,
                poll: { ...current.poll, status: 'closed' }
            } : current);
        };
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
    }, [publicId, resultsStatus]);

    return (
        <main className="page container results-page">
            <Link className="back-link" to={`/polls/${publicId}`}>← Back to poll</Link>
            {loading && <p className="loading-state">Loading results…</p>}
            {error && <p className="notice notice-error" role="alert">{error}</p>}
            {results && (
                <>
                    <p className="eyebrow">Live from the room</p>
                    <h1>{results.poll.question}</h1>
                    <div className="results-block standalone-results" aria-live="polite">
                        <div className="results-heading">
                            <h2>Poll results</h2>
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
                    </div>
                </>
            )}
        </main>
    );
}
