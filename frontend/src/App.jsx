import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { api, getToken, setToken } from './services/api';
import Sidebar from './components/Sidebar';
import CookieBanner from './components/CookieBanner';
import MainPage from './pages/MainPage';
import FavoritesPage from './pages/FavoritesPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import { FiUser, FiMenu } from 'react-icons/fi';
import './styles/global.css';

// Компонент для обработки callback от Google
function AuthCallback() {
  const navigate = useNavigate();
  const toast = useToast();
  const [processed, setProcessed] = useState(false);
  const processingRef = useRef(false);

  useEffect(() => {
    if (processed || processingRef.current) return;
    processingRef.current = true;
    
    console.log("=== AuthCallback ===");
    console.log("Full URL:", window.location.href);
    
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    
    console.log("Token from URL:", token ? "получен" : "не получен");
    console.log("Error from URL:", error || "нет");
    
    // Обработка ошибки блокировки аккаунта
    if (error === 'account_disabled') {
      toast.error('Ваш аккаунт заблокирован или удалён');
      setProcessed(true);
      setTimeout(() => navigate('/'), 100);
      return;
    }
    
    if (token) {
      console.log("Token found, saving...");
      setToken(token);
      setProcessed(true);
      toast.success('Вы успешно вошли в аккаунт');
      
      // Очищаем URL от токена
      window.history.replaceState({}, document.title, window.location.pathname);
      
      setTimeout(() => {
        navigate('/');
      }, 500);
    } else {
      if (window.location.pathname === '/auth/callback' && !processed) {
        console.log("Токен не найден, перенаправление на главную");
        setProcessed(true);
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    }
  }, [navigate, toast]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'var(--surface-primary)',
      gap: '20px'
    }}>
      <div className="spinner"></div>
      <p style={{ color: 'var(--text-secondary)' }}>Выполняется вход...</p>
    </div>
  );
}

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();
  const isMobile = windowWidth <= 768;
  const location = useLocation();

  const [user, setUser] = useState({
    isLoggedIn: false,
    name: 'Гость',
    email: '',
    avatar: null,
    id: null
  });

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Функция для получения только имени (без фамилии)
  const getFirstName = (fullName) => {
    if (!fullName || fullName === 'Гость') return fullName;
    const nameParts = fullName.trim().split(/\s+/);
    return nameParts[0];
  };

  const loadUser = async () => {
    const token = getToken();
    if (!token) {
      setUser({
        isLoggedIn: false,
        name: 'Гость',
        email: '',
        avatar: null,
        id: null
      });
      return;
    }
    
    try {
      const userData = await api.getCurrentUser();
      if (userData) {
        setUser({
          isLoggedIn: true,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar,
          id: userData.id
        });
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователя:', error);
      setToken(null);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser({
          ...parsedUser,
          isLoggedIn: true
        });
      } catch (e) {
        console.error('Ошибка загрузки пользователя из localStorage:', e);
      }
    }
    loadUser();
  }, []);

  const handleLogin = () => {
    api.googleLogin();
  };

  const handleLogout = async () => {
    await api.logout();
    setUser({
      isLoggedIn: false,
      name: 'Гость',
      email: '',
      avatar: null,
      id: null
    });
    localStorage.removeItem('user');
  };

  // Общая высота для обоих блоков
  const blockHeight = isMobile ? '52px' : '56px';
  const avatarSize = isMobile ? '32px' : '36px';
  const logoSize = isMobile ? '36px' : '40px';
  const buttonSize = isMobile ? '36px' : '40px';
  const fontSize = isMobile ? '14px' : '16px';
  const gap = isMobile ? '12px' : '14px';

  // Отображаемое имя (только имя)
  const displayName = getFirstName(user.name);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Левый блок: логотип + бургер-меню */}
      <div style={{
        position: 'fixed',
        top: isMobile ? '16px' : '24px',
        left: isMobile ? '16px' : '24px',
        display: 'flex',
        alignItems: 'center',
        gap: gap,
        zIndex: 200,
        background: 'var(--surface-secondary)',
        backdropFilter: 'blur(12px)',
        padding: isMobile ? '0 16px 0 12px' : '0 20px 0 14px',
        borderRadius: '50px',
        border: '1px solid var(--border-medium)',
        boxShadow: 'var(--shadow-md)',
        height: blockHeight
      }}>
        <img 
          src="/logo.png"
          alt="Logo"
          style={{
            width: logoSize,
            height: logoSize,
            borderRadius: '12px',
            objectFit: 'contain'
          }}
        />
        
        <button
          onClick={() => setIsSidebarOpen(true)}
          style={{
            width: buttonSize,
            height: buttonSize,
            borderRadius: '12px',
            background: 'var(--surface-tertiary)',
            border: '1px solid var(--border-medium)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            color: 'var(--text-primary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(96, 165, 250, 0.2)';
            e.currentTarget.style.borderColor = 'var(--accent-blue)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--surface-tertiary)';
            e.currentTarget.style.borderColor = 'var(--border-medium)';
          }}
        >
          <FiMenu size={isMobile ? 18 : 20} />
        </button>
      </div>

      {/* Правый блок: профиль пользователя */}
      <Link to="/profile" style={{ textDecoration: 'none' }}>
        <div style={{
          position: 'fixed',
          top: isMobile ? '16px' : '24px',
          right: isMobile ? '16px' : '24px',
          display: 'flex',
          alignItems: 'center',
          gap: gap,
          zIndex: 200,
          background: 'var(--surface-secondary)',
          backdropFilter: 'blur(12px)',
          padding: isMobile ? '0 16px 0 12px' : '0 20px 0 14px',
          borderRadius: '50px',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-md)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          height: blockHeight
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-blue)';
          e.currentTarget.style.background = 'rgba(96, 165, 250, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-medium)';
          e.currentTarget.style.background = 'var(--surface-secondary)';
        }}>
          <span style={{
            color: 'var(--text-primary)',
            fontSize: fontSize,
            fontWeight: 500,
            transform: 'translateX(6px)',
            whiteSpace: 'nowrap'
          }}>
            {displayName}
          </span>
          
          <div style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'translateX(3px)',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt="Avatar"
                referrerPolicy="no-referrer"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: user.isLoggedIn 
                  ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))'
                  : 'var(--surface-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: user.isLoggedIn ? 'none' : '1px solid var(--border-medium)'
              }}>
                {user.isLoggedIn ? (
                  <span style={{
                    color: 'white',
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: 600
                  }}>
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <FiUser 
                    size={isMobile ? 18 : 20} 
                    color="var(--text-primary)"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </Link>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <Routes>
        <Route path="/" element={<MainPage user={user} />} />
        <Route path="/favorites" element={<FavoritesPage user={user} />} />
        <Route path="/history" element={<HistoryPage user={user} />} />
        <Route path="/profile" element={<ProfilePage user={user} onLogin={handleLogin} onLogout={handleLogout} />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
      
      {/* Куки-баннер */}
      <CookieBanner />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;