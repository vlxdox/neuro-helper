import React, { useState, useEffect } from 'react';
import { FiX, FiShield } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    const cookiesAccepted = localStorage.getItem('cookiesAccepted');
    if (!cookiesAccepted) {
      setTimeout(() => setIsVisible(true), 500);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    setIsClosing(true);
    setTimeout(() => setIsVisible(false), 300);
  };

  const handleDecline = () => {
    localStorage.setItem('cookiesAccepted', 'false');
    setIsClosing(true);
    setTimeout(() => setIsVisible(false), 300);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  // Динамические стили для тёмной/светлой темы
  const glassBackground = isDark
    ? 'rgba(30, 30, 40, 0.85)'
    : 'rgba(255, 255, 255, 0.85)';
  
  const borderColor = isDark
    ? 'rgba(255, 255, 255, 0.15)'
    : 'rgba(255, 255, 255, 0.5)';
  
  const shadowColor = isDark
    ? 'rgba(0, 0, 0, 0.4)'
    : 'rgba(0, 0, 0, 0.15)';

  return (
    <>
      <style>
        {`
          @keyframes slideInFromRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes slideOutToRight {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }
        `}
      </style>

      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        maxWidth: '380px',
        width: 'calc(100% - 48px)',
        background: glassBackground,
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: `0 8px 32px ${shadowColor}, 0 1px 3px rgba(0, 0, 0, 0.1)`,
        border: `1px solid ${borderColor}`,
        zIndex: 10000,
        animation: isClosing ? 'slideOutToRight 0.3s ease-out forwards' : 'slideInFromRight 0.4s ease-out',
        transition: 'transform 0.2s ease, background 0.3s ease'
      }}>
        {/* Заголовок с иконкой и кнопкой закрытия */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: isDark 
                ? 'rgba(96, 165, 250, 0.2)' 
                : 'rgba(96, 165, 250, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiShield size={18} color="var(--accent-blue)" />
            </div>
            <h4 style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0
            }}>
              Мы используем куки
            </h4>
          </div>
          
          <button
            onClick={handleClose}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-tertiary)',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'var(--surface-tertiary)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
          >
            <FiX size={16} />
          </button>
        </div>
        
        {/* Текст */}
        <p style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          margin: '0 0 16px 0',
          lineHeight: 1.5,
          textAlign: 'left'
        }}>
          Мы используем файлы cookie для авторизации и сохранения ваших настроек. 
          Продолжая использовать сайт, вы соглашаетесь с этим.
        </p>
        
        {/* Кнопки на всю ширину */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <button
            onClick={handleAccept}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
              border: 'none',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              color: 'white',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'scale(1.01)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Принять
          </button>
          
          <button
            onClick={handleDecline}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'transparent',
              border: '1px solid var(--border-medium)',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'var(--surface-tertiary)';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'var(--accent-blue)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-medium)';
            }}
          >
            Отклонить
          </button>
        </div>
      </div>
    </>
  );
};

export default CookieBanner;