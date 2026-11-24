import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
    const { login, register } = useAuth();

    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            if (isRegister) {
                await register(name, email, password);
                setSuccess('Account created successfully!');
            } else {
                await login(email, password);
                setSuccess('Login successful!');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="auth-container">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>
                    {isRegister ? 'Create an account' : 'Welcome back'}
                </h1>

                <p>
                    {isRegister
                        ? 'Register to get started'
                        : 'Login to your account'}
                </p>

                {isRegister && (
                    <input
                        type="text"
                        placeholder="Full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        minLength={2}
                        maxLength={100}
                        required
                    />
                )}

                <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    maxLength={72}
                    required
                />

                {error && (
                    <div className="error-message">{error}</div>
                )}

                {success && (
                    <div className="success-message">{success}</div>
                )}

                <button type="submit" disabled={submitting}>
                    {submitting
                        ? 'Please wait...'
                        : isRegister
                            ? 'Register'
                            : 'Login'}
                </button>

                <div className="auth-switch">
                    {isRegister
                        ? 'Already have an account? '
                        : "Don't have an account? "}

                    <button
                        type="button"
                        className="switch-button"
                        onClick={() => {
                            setIsRegister(!isRegister);
                            setError('');
                            setSuccess('');
                        }}
                    >
                        {isRegister ? 'Login' : 'Register'}
                    </button>
                </div>
            </form>
        </main>
    );
}