import { Link } from 'react-router-dom';

export default function PollCard({ poll }) {
    const creator = [poll.creator_first_name, poll.creator_last_name].filter(Boolean).join(' ');

    return (
        <article className="poll-card">
            <div className="poll-card-meta">
                <span className={`status-dot status-${poll.status}`}>{poll.status}</span>
                <span>{poll.vote_count || 0} votes</span>
            </div>
            <h2><Link to={`/polls/${poll.public_id}`}>{poll.question}</Link></h2>
            {poll.description && <p>{poll.description}</p>}
            <div className="poll-card-footer">
                <span>{creator ? `By ${creator}` : 'Recently published'}</span>
                <Link to={`/polls/${poll.public_id}`} aria-label={`Open poll: ${poll.question}`}>Take part <span aria-hidden="true">→</span></Link>
            </div>
        </article>
    );
}
