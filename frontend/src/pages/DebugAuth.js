import React from 'react';

function DebugAuth() {
  const isAuthenticated = localStorage.getItem('token') ? true : false;
  const user = localStorage.getItem('displayName') || localStorage.getItem('username');
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>🔍 Authentication Debug Page</h2>
      <div style={{ backgroundColor: '#f0f0f0', padding: '20px', borderRadius: '5px' }}>
        <h3>localStorage Values:</h3>
        <p><strong>token:</strong> {localStorage.getItem('token') || 'null'}</p>
        <p><strong>username:</strong> {localStorage.getItem('username') || 'null'}</p>
        <p><strong>displayName:</strong> {localStorage.getItem('displayName') || 'null'}</p>
        <p><strong>userId:</strong> {localStorage.getItem('userId') || 'null'}</p>
        <p><strong>userRole:</strong> {localStorage.getItem('userRole') || 'null'}</p>
        
        <h3>Computed Values:</h3>
        <p><strong>isAuthenticated:</strong> {isAuthenticated ? 'true' : 'false'}</p>
        <p><strong>user:</strong> {user || 'null'}</p>
        <p><strong>userId:</strong> {userId || 'null'}</p>
        <p><strong>userRole:</strong> {userRole || 'null'}</p>
        
        <h3>Route Access Check:</h3>
        <p><strong>Can access /teacher-slots:</strong> {(isAuthenticated && userRole === 'ROLE_TEACHER') ? '✅ YES' : '❌ NO'}</p>
        <p><strong>Should redirect to dashboard:</strong> {!(isAuthenticated && userRole === 'ROLE_TEACHER') ? '✅ YES' : '❌ NO'}</p>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Actions:</h3>
        <button onClick={() => window.location.href = '/login'} style={{ marginRight: '10px', padding: '10px' }}>
          Go to Login
        </button>
        <button onClick={() => window.location.href = '/teacher-slots'} style={{ marginRight: '10px', padding: '10px' }}>
          Go to Teacher Slots
        </button>
        <button onClick={() => window.location.href = '/dashboard'} style={{ marginRight: '10px', padding: '10px' }}>
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

export default DebugAuth;