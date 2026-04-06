import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

const ADMIN_EMAIL = 'rithucollections25@gmail.com';
const ADMIN_PASSWORD = 'rithucollections@ns';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        sessionStorage.setItem('admin_auth', 'true');
        navigate('/admin');
      } else {
        setLoading(false);
        setError('Invalid email or password.');
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    }, 800);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 60% 20%, rgba(212,175,55,0.12) 0%, #0a0a0a 60%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-30%', right: '-20%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', left: '-15%',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)',
        }} />
      </div>

      <div style={{
        width: '100%', maxWidth: '400px', position: 'relative',
        animation: shake ? 'shake 0.5s ease' : 'fadeInUp 0.6s ease',
      }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #D4AF37, #B8960C)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 32px rgba(212,175,55,0.3)',
          }}>
            <Lock size={32} color="#000" />
          </div>
          <h1 style={{
            fontSize: '26px', fontWeight: '800', color: '#fff',
            margin: '0 0 8px', letterSpacing: '-0.5px',
          }}>
            Admin Access
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>
            Rithu Collections — Secure Portal
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          padding: '36px 32px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>
          <form onSubmit={handleLogin}>
            {/* Email Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: '600',
                color: 'rgba(255,255,255,0.5)', marginBottom: '10px',
                letterSpacing: '1px', textTransform: 'uppercase',
              }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{
                  position: 'absolute', left: '16px', top: '50%',
                  transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)',
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="admin@example.com"
                  required
                  style={{
                    width: '100%', padding: '14px 16px 14px 46px',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${error ? 'rgba(255,80,80,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '14px', color: '#fff', fontSize: '15px',
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(212,175,55,0.5)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = error ? 'rgba(255,80,80,0.5)' : 'rgba(255,255,255,0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: '600',
                color: 'rgba(255,255,255,0.5)', marginBottom: '10px',
                letterSpacing: '1px', textTransform: 'uppercase',
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: '16px', top: '50%',
                  transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)',
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••••••"
                  required
                  style={{
                    width: '100%', padding: '14px 48px 14px 46px',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${error ? 'rgba(255,80,80,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '14px', color: '#fff', fontSize: '15px',
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(212,175,55,0.5)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = error ? 'rgba(255,80,80,0.5)' : 'rgba(255,255,255,0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', padding: '4px',
                    color: 'rgba(255,255,255,0.35)', display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.25)',
                borderRadius: '12px', padding: '12px 16px', marginBottom: '20px',
                color: '#ff6b6b', fontSize: '14px',
                animation: 'fadeIn 0.3s ease',
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '16px',
                background: loading
                  ? 'rgba(212,175,55,0.5)'
                  : 'linear-gradient(135deg, #D4AF37, #B8960C)',
                border: 'none', borderRadius: '14px',
                color: '#000', fontSize: '15px', fontWeight: '800',
                letterSpacing: '1px', textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(212,175,55,0.3)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 8px 28px rgba(212,175,55,0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 20px rgba(212,175,55,0.3)';
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <span style={{
                    width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.3)',
                    borderTopColor: '#000', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite', display: 'inline-block',
                  }} />
                  Verifying...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: 'center', color: 'rgba(255,255,255,0.2)',
          fontSize: '12px', marginTop: '24px',
        }}>
          🔒 Restricted area — authorised personnel only
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%,60%  { transform: translateX(-8px); }
          40%,80%  { transform: translateX(8px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
};

export default AdminLogin;
