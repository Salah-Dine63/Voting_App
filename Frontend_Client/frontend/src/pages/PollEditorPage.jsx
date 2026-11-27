import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PollForm from '../components/PollForm';
import { apiRequest } from '../services/api';

export default function PollEditorPage() {
    const { publicId } = useParams();
    const navigate = useNavigate();
    const [poll, setPoll] = useState(null);
    const [loading, setLoading] = useState(Boolean(publicId));
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!publicId) return undefined;
        let mounted = true;
        apiRequest(`/polls/${publicId}`)
            .then(({ poll: loadedPoll }) => {
                if (mounted) setPoll(loadedPoll);
            })
            .catch((requestError) => {
                if (mounted) setError(requestError.message);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => { mounted = false; };
    }, [publicId]);

    const handleSubmit = async (data) => {
        setSubmitting(true);
        setError('');
        try {
            const response = await apiRequest(publicId ? `/polls/${publicId}` : '/polls', {
                method: publicId ? 'PUT' : 'POST',
                body: JSON.stringify(data)
            });
            navigate(`/polls/${response.poll.public_id}`);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <main className="page container"><p className="loading-state">Loading draft…</p></main>;
    }

    if (publicId && !poll) {
        return (
            <main className="page container">
                <p className="notice notice-error" role="alert">{error || 'Poll not found.'}</p>
                <Link className="text-button" to="/dashboard">Return to your polls →</Link>
            </main>
        );
    }

    if (publicId && poll && poll.status !== 'draft') {
        return (
            <main className="page container">
                <p className="notice notice-error">Only draft polls can be edited.</p>
                <Link className="text-button" to={`/polls/${publicId}`}>Return to poll →</Link>
            </main>
        );
    }

    return (
        <main className="page container editor-page">
            <p className="eyebrow">{publicId ? 'Shape your question' : 'Start a conversation'}</p>
            <h1>{publicId ? 'Edit your draft.' : 'What do you want to ask?'}</h1>
            <p className="page-lede">Keep it clear. Give people a few thoughtful ways to respond.</p>
            {error && <p className="notice notice-error" role="alert">{error}</p>}
            <PollForm
                initialPoll={poll}
                onSubmit={handleSubmit}
                submitting={submitting}
                submitLabel={publicId ? 'Save draft' : 'Create draft'}
            />
        </main>
    );
}
