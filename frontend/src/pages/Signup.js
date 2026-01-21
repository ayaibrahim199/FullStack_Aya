import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

function Signup({ onSignup }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.signup({
        username,
        password,
        role: [role],
        firstName,
        lastName,
      });
      // Auto-login after signup
      const response = await authService.signin(username, password);
      const derivedName = [response.data.firstName, response.data.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      const displayName = response.data.displayName || derivedName || username;
      onSignup(
        response.data.token, 
        response.data.username, 
        response.data.id, 
        response.data.role,
        displayName
      );
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data || 'Signup failed. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container animate-slide-up">
        {/* Logo Section */}
        <div className="text-center mb-3">
          <div className="card-icon">✨</div>
          <h1>Create Account</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Join our appointment booking platform
          </p>
        </div>

        {error && (
          <div className="error">
            <span>⚠️</span> {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="signup-first-name">First Name</label>
            <input
              id="signup-first-name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Aya"
              required
              autoComplete="given-name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-last-name">Last Name</label>
            <input
              id="signup-last-name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Hassan"
              required
              autoComplete="family-name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="signup-username">Username</label>
            <input
              id="signup-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a secure password"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-role">I am a...</label>
            <select 
              id="signup-role"
              value={role} 
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="student">👨‍🎓 Student - Book appointments</option>
              <option value="teacher">👨‍🏫 Teacher - Manage availability</option>
            </select>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" style={{ width: '18px', height: '18px' }}></span>
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="form-link">
          Already have an account?{' '}
          <button 
            type="button"
            onClick={() => navigate('/login')} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--primary-color)',
              fontWeight: '600',
              cursor: 'pointer',
              padding: 0,
              width: 'auto'
            }}
          >
            Sign in here
          </button>
        </div>
      </div>
    </div>
  );
}

export default Signup;
