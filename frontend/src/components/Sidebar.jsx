import React, { useEffect, useState, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FiHome, FiHeart, FiClock, FiSun, FiMoon } from 'react-icons/fi';

const Sidebar = memo(({ isOpen, onClose }) => {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
    } else if (shouldRender) {
      // Запускаем анимацию закрытия
      setIsClosing(true);
      document.body.style.overflow = '';
      
      // Ждём окончания анимации перед удалением из DOM
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 200);
      
      return () => clearTimeout(timer);
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  const menuItems = [
    { path: '/', icon: <FiHome size={20} />, label: 'Главная' },
    { path: '/favorites', icon: <FiHeart size={20} />, label: 'Избранное' },
    { path: '/history', icon: <FiClock size={20} />, label: 'История' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <style>
        {`
          @keyframes sidebarSlideIn {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
          }
          @keyframes sidebarSlideOut {
            from { transform: translateX(0); }
            to { transform: translateX(-100%); }
          }
          @keyframes overlayFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes overlayFadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }
        `}
      </style>

      {/* Оверлей */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 998,
          animation: isClosing ? 'overlayFadeOut 0.2s ease-out forwards' : 'overlayFadeIn 0.2s ease-out'
        }}
      />

      {/* Боковая панель */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: '280px',
        maxWidth: '85%',
        background: 'var(--surface-secondary)',
        zIndex: 999,
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border-medium)',
        animation: isClosing ? 'sidebarSlideOut 0.2s ease-out forwards' : 'sidebarSlideIn 0.2s ease-out'
      }}>
        {/* Заголовок с логотипом */}
        <div style={{
          padding: '28px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <img 
            src="/logo.png"
            alt="Logo"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              objectFit: 'contain'
            }}
          />
          <h2 style={{
            color: 'var(--text-primary)',
            margin: 0,
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '-0.3px'
          }}>
            Нейро.Помощник
          </h2>
        </div>

        {/* Меню навигации */}
        <nav style={{ flex: 1, padding: '0 12px' }}>
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 16px',
                margin: '4px 0',
                borderRadius: '12px',
                color: isActive(item.path) ? 'var(--accent-blue)' : 'var(--text-secondary)',
                background: isActive(item.path) ? 'rgba(96, 165, 250, 0.15)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s',
                fontSize: '15px',
                fontWeight: isActive(item.path) ? 600 : 500,
                border: isActive(item.path) ? '1px solid var(--accent-blue)' : '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = 'var(--surface-tertiary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.borderColor = 'var(--border-medium)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Кнопка переключения темы */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid var(--border-subtle)',
          marginTop: 'auto'
        }}>
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              width: '100%',
              padding: '12px 16px',
              background: 'var(--surface-tertiary)',
              border: '1px solid var(--border-medium)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(96, 165, 250, 0.15)';
              e.currentTarget.style.borderColor = 'var(--accent-blue)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--surface-tertiary)';
              e.currentTarget.style.borderColor = 'var(--border-medium)';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>
              {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
            </span>
            <span>{isDark ? 'Светлая тема' : 'Тёмная тема'}</span>
          </button>
          
          {/* Версия */}
          <div style={{
            textAlign: 'center',
            marginTop: '16px',
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            opacity: 0.7
          }}>
            v1.0.0
          </div>
        </div>
      </div>
    </>
  );
});

export default Sidebar;