import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PollCard from '../components/PollCard';
import { apiRequest } from '../services/api';

export default function ExplorePage() {
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;
        apiRequest('/polls')
            .then((data) => {
                if (mounted) setPolls(data.polls);
            })
            .catch((requestError) => {
                if (mounted) setError(requestError.message);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => { mounted = false; };
    }, []);

    return (
        <main className="page container">
            <section className="explore-hero">
                <p className="eyebrow">The public square</p>
                <h1>Better questions.<br /><span>Better answers.</span></h1>
                <div className="explore-intro">
                    <p>Explore what people are asking right now. Add your voice, then see where the room lands.</p>
                    <Link className="button button-primary" to="/polls/new">Start a poll <span aria-hidden="true">→</span></Link>
                </div>
            </section>

            <section className="section-block">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">Open for input</p>
                        <h2>Recent polls</h2>
                    </div>
                    <span className="section-count">{polls.length.toString().padStart(2, '0')} polls</span>
                </div>
                {loading && <p className="loading-state">Finding the latest polls…</p>}
                {error && <p className="notice notice-error" role="alert">{error}</p>}
                {!loading && !error && polls.length === 0 && (
                    <div className="empty-state">
                        <p>No active polls just yet.</p>
                        <span>Be the first to ask a good question.</span>
                        <Link className="text-button" to="/polls/new">Create a poll →</Link>
                    </div>
                )}
                <div className="poll-grid">
                    {polls.map((poll) => <PollCard key={poll.public_id} poll={poll} />)}
                </div>
            </section>
        </main>
    );
}
