import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PollCard from '../components/PollCard';
import { useAuth } from '../Context/useAuth';
import { apiRequest } from '../services/api';

const initialDashboard = {
    summary: { total_polls: 0, active_polls: 0, closed_polls: 0, total_votes_received: 0 },
    recentPolls: [],
    recentActivity: []
};

const formatDate = (date) => new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
}).format(new Date(date));

export default function DashboardPage() {
    const { user } = useAuth();
    const [dashboard, setDashboard] = useState(initialDashboard);
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;
        Promise.all([apiRequest('/dashboard'), apiRequest('/polls/mine')])
            .then(([data, mine]) => {
                if (!mounted) return;
                setDashboard(data);
                setPolls(mine.polls);
            })
            .catch((requestError) => {
                if (mounted) setError(requestError.message);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => { mounted = false; };
    }, []);

    const stats = [
        ['Polls created', dashboard.summary.total_polls],
        ['Active now', dashboard.summary.active_polls],
        ['Closed', dashboard.summary.closed_polls],
        ['Votes received', dashboard.summary.total_votes_received]
    ];

    return (
        <main className="page container">
            <section className="dashboard-intro">
                <div>
                    <p className="eyebrow">Your space</p>
                    <h1>Good to see you, {user.first_name}.</h1>
                    <p>Keep an eye on the questions you’ve put out into the world.</p>
                </div>
                <Link className="button button-primary" to="/polls/new">Create a poll <span aria-hidden="true">+</span></Link>
            </section>

            {error && <p className="notice notice-error" role="alert">{error}</p>}
            <section className="stats-grid" aria-label="Poll overview">
                {stats.map(([label, value]) => (
                    <article className="stat-item" key={label}>
                        <span>{label}</span>
                        <strong>{loading ? '—' : value}</strong>
                    </article>
                ))}
            </section>

            <section className="section-block dashboard-list">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">Your questions</p>
                        <h2>Recently created</h2>
                    </div>
                    <span className="section-count">{polls.length.toString().padStart(2, '0')} total</span>
                </div>
                {loading && <p className="loading-state">Loading your polls…</p>}
                {!loading && polls.length === 0 && !error && (
                    <div className="empty-state">
                        <p>Your first poll starts with a question.</p>
                        <Link className="text-button" to="/polls/new">Create one →</Link>
                    </div>
                )}
                <div className="poll-grid">
                    {polls.slice(0, 6).map((poll) => (
                        <div key={poll.public_id} className="owned-poll">
                            <PollCard poll={poll} />
                            <div className="owned-poll-actions">
                                {poll.status === 'draft' && <Link to={`/polls/${poll.public_id}/edit`}>Edit draft</Link>}
                                {poll.status === 'active' && <Link to={`/polls/${poll.public_id}/results`}>View results</Link>}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="section-block activity-section">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">Your participation</p>
                        <h2>Recent votes</h2>
                    </div>
                </div>
                {dashboard.recentActivity.length === 0 && !loading && (
                    <p className="muted-copy">Your recent votes will show up here.</p>
                )}
                <ul className="activity-list">
                    {dashboard.recentActivity.map((activity) => (
                        <li key={`${activity.public_id}-${activity.voted_at}`}>
                            <span className="activity-date">{formatDate(activity.voted_at)}</span>
                            <span>You chose <strong>{activity.option_text}</strong> on</span>
                            <Link to={`/polls/${activity.public_id}`}>{activity.question}</Link>
                        </li>
                    ))}
                </ul>
            </section>
        </main>
    );
}
