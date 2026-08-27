import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone } from 'lucide-react';
import api from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@company.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-app p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Login Card */}
        <div className="bg-surface-card p-8 rounded-lg shadow-md border border-surface-border w-full">
          <h1 className="text-2xl font-bold text-center text-primary-dark mb-6">Punch Item Management</h1>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-textMuted mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-surface-border rounded-md focus:outline-none focus:border-primary-blue"
                placeholder="you@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-textMuted mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-surface-border rounded-md focus:outline-none focus:border-primary-blue"
                placeholder="••••••••"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-primary-blue text-white py-2 rounded-md hover:bg-blue-700 transition-colors font-medium mt-4"
            >
              Sign In
            </button>
          </form>
        </div>

        {/* PWA Link Card */}
        <div 
          onClick={() => navigate('/field-app')}
          className="bg-surface-card p-6 rounded-lg shadow-sm border border-surface-border w-full flex items-center justify-between hover:bg-slate-50 transition cursor-pointer group"
        >
          <div>
            <h3 className="font-semibold text-primary-dark group-hover:text-primary-blue transition-colors">Field App (PWA)</h3>
            <p className="text-sm text-surface-textMuted mt-1">Access mobile site application without login</p>
          </div>
          <div className="p-3 bg-blue-50 text-primary-blue rounded-full group-hover:scale-110 transition-transform">
            <Smartphone size={24} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
