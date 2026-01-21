import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.signin(username, password);
      const derivedName = [response.data.firstName, response.data.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      const displayName = response.data.displayName || derivedName || response.data.username;
      onLogin(
        response.data.token, 
        response.data.username, 
        response.data.id, 
        response.data.role,
        displayName
      );
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container animate-slide-up">
        {/* Logo Section */}
        <div className="text-center mb-3">
          <div className="card-icon">📅</div>
          <h1>Welcome Back</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Sign in to your appointment booking account
          </p>
        </div>

        {error && (
          <div className="error">
            <span>⚠️</span> {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" style={{ width: '18px', height: '18px', marginRight: '8px' }}></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="form-link">
          Don't have an account?{' '}
          <span onClick={() => navigate('/signup')}>
            Create one here
          </span>
        </div>

        <div className="info mt-3">
          <strong>🔑 Demo Credentials:</strong><br/>
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
            <div>Student: <code>student@example.com</code> / <code>student123</code></div>
            <div>Teacher: <code>teacher@example.com</code> / <code>teacher123</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
