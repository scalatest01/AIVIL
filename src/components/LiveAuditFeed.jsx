import React, { useState, useEffect } from 'react';

export default function LiveDemoSection() {
  const [demoAudits, setDemoAudits] = useState([]);

  // Simulate real-time agent decisions
  useEffect(() => {
    const demoData = [
      {
        id: 1,
        timestamp: '14:23:47',
        verdict: 'APPROVED',
        action: 'Approve purchase order',
        amount: 3500,
        reason: 'Within procurement limits'
      },
      {
        id: 2,
        timestamp: '14:22:15',
        verdict: 'BLOCKED',
        action: 'Send customer email',
        amount: null,
        reason: 'Domain not in approved list'
      },
      {
        id: 3,
        timestamp: '14:21:03',
        verdict: 'ESCALATE',
        action: 'Approve purchase order',
        amount: 12000,
        reason: 'Exceeds policy limit, needs human review'
      },
      {
        id: 4,
        timestamp: '14:19:44',
        verdict: 'APPROVED',
        action: 'Process refund',
        amount: 249,
        reason: 'Verified customer request'
      },
      {
        id: 5,
        timestamp: '14:18:32',
        verdict: 'APPROVED',
        action: 'Send notification',
        amount: null,
        reason: 'Policy compliant'
      }
    ];

    // Show audits sequentially
    demoData.forEach((audit, idx) => {
      setTimeout(() => {
        setDemoAudits(prev => [audit, ...prev].slice(0, 5));
      }, idx * 2000);
    });

    // Loop the demo
    const loopInterval = setInterval(() => {
      demoData.forEach((audit, idx) => {
        setTimeout(() => {
          setDemoAudits(prev => [audit, ...prev].slice(0, 5));
        }, idx * 2000);
      });
    }, 15000);

    return () => clearInterval(loopInterval);
  }, []);

  const verdictColors = {
    'APPROVED': { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    'ESCALATE': { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    'BLOCKED': { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
  };

  return (
    <section style={{ padding: '4rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: '500',
          margin: '0 0 1rem 0',
          color: 'var(--color-text-primary)'
        }}>
          See your AI agent decide in real-time
        </h2>
        <p style={{
          fontSize: '16px',
          color: 'var(--color-text-secondary)',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Every decision. Every audit. Verified. Accountable. Live on your dashboard.
        </p>
      </div>

      {/* Demo Dashboard */}
      <div style={{
        backgroundColor: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '2rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}>
        {/* Dashboard Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '500',
              color: 'var(--color-text-primary)'
            }}>
              Live Feed
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--color-text-secondary)'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10b981'
              }}></span>
              Live monitoring active
            </div>
          </div>

          {/* Agent Selector */}
          <select style={{
            width: '100%',
            maxWidth: '300px',
            padding: '8px 12px',
            fontSize: '13px',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: 'var(--color-background-secondary)',
            color: 'var(--color-text-primary)'
          }}>
            <option>Prometheus - Procurement Specialist</option>
            <option>Research Bot - Data Gathering</option>
            <option>Customer Service - Support Agent</option>
          </select>
        </div>

        {/* Audit Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {demoAudits.length === 0 ? (
            <div style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
              fontSize: '14px'
            }}>
              Waiting for first decision...
            </div>
          ) : (
            demoAudits.map((audit, idx) => {
              const styles = verdictColors[audit.verdict];

              return (
                <div
                  key={audit.id}
                  style={{
                    backgroundColor: styles.bg,
                    border: `0.5px solid ${styles.color}`,
                    borderRadius: 'var(--border-radius-md)',
                    padding: '1rem',
                    animation: `slideIn 0.3s ease-out`,
                    opacity: idx === 0 ? 1 : 0.8 - idx * 0.15
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: styles.color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {audit.verdict}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      color: 'var(--color-text-secondary)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {audit.timestamp}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '8px',
                    fontSize: '13px'
                  }}>
                    <div style={{ color: 'var(--color-text-secondary)' }}>
                      <span style={{ color: 'var(--color-text-primary)', fontWeight: '500' }}>
                        {audit.action}
                      </span>
                      {audit.amount && (
                        <span> · ${audit.amount.toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  <div style={{
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                    fontStyle: 'italic'
                  }}>
                    {audit.reason}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <p style={{
          fontSize: '14px',
          color: 'var(--color-text-secondary)',
          margin: '0 0 1rem 0'
        }}>
          Sign up free and get your AI agent monitored in 2 minutes
        </p>
        <button style={{
          padding: '12px 32px',
          fontSize: '14px',
          fontWeight: '500',
          backgroundColor: 'var(--color-background-info)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--border-radius-md)',
          cursor: 'pointer'
        }}>
          Create your first agent
        </button>
      </div>

      {/* Animation */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-12px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </section>
  );
}
