import React from 'react';
import { Instagram, MessageCircle, Mail } from 'lucide-react';

const Connect = () => {
  const socialLinks = [
    {
      id: 'instagram',
      icon: Instagram,
      label: 'Instagram',
      url: 'https://www.instagram.com/rithu_collections_25',
      tooltip: 'Open Instagram'
    },
    {
      id: 'whatsapp',
      icon: MessageCircle,
      label: 'WhatsApp',
      url: 'https://wa.me/919344938654',
      tooltip: 'Chat on WhatsApp'
    },
    {
      id: 'email',
      icon: Mail,
      label: 'Email',
      url: 'mailto:rithucollections25@gmail.com',
      tooltip: 'Send an Email'
    }
  ];

  return (
    <div className="container animate-fade-in" style={{ 
      minHeight: '80vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      paddingBottom: '100px'
    }}>
      {/* 1. HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 className="title" style={{ fontSize: '32px', marginBottom: '8px', letterSpacing: '4px' }}>CONNECT</h1>
        <p className="text-secondary" style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.5 }}>
          Reach us anytime
        </p>
      </div>

      {/* 2. CENTER ICON GRID */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '32px',
        alignItems: 'center'
      }}>
        {socialLinks.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={link.tooltip}
            style={{ 
              textDecoration: 'none',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
            className="connect-btn"
          >
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '2px solid rgba(212, 175, 55, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-gold)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.1)';
              e.currentTarget.style.borderColor = 'var(--primary-gold)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(212, 175, 55, 0.3)';
              e.currentTarget.style.transform = 'scale(1.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
              e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
              e.currentTarget.style.boxShadow = '0 0 50px rgba(212, 175, 55, 0.6)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.15)';
            }}
            >
              <link.icon size={32} strokeWidth={1.5} />
            </div>
          </a>
        ))}
      </div>

      {/* Subtle branding at bottom */}
      <div style={{ 
        marginTop: '80px', 
        fontSize: '9px', 
        fontWeight: '900', 
        color: 'rgba(255,255,255,0.1)', 
        letterSpacing: '3px',
        textTransform: 'uppercase' 
      }}>
        Rithu Collections &copy; 2026
      </div>
    </div>
  );
};

export default Connect;
