import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import NeuralCards from '../components/NeuralCards';
import { FiHeart, FiLock, FiArrowRight } from 'react-icons/fi';

// ========== СКЕЛЕТОН КАРТОЧКИ ==========
const NeuralCardSkeleton = () => (
  <div style={{
    background: 'var(--surface-secondary)',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid var(--border-medium)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: '280px',
    animation: 'pulse 1.5s ease-in-out infinite'
  }}>
    {/* Верхняя часть: логотип + название + избранное */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--surface-tertiary)' }} />
      <div style={{ flex: 1, height: '16px', background: 'var(--surface-tertiary)', borderRadius: '8px' }} />
      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--surface-tertiary)' }} />
    </div>
    
    {/* Описание */}
    <div style={{ marginBottom: '12px' }}>
      <div style={{ height: '13px', background: 'var(--surface-tertiary)', borderRadius: '6px', marginBottom: '6px' }} />
      <div style={{ height: '13px', background: 'var(--surface-tertiary)', borderRadius: '6px', marginBottom: '6px' }} />
      <div style={{ height: '13px', background: 'var(--surface-tertiary)', borderRadius: '6px', width: '70%' }} />
    </div>
    
    {/* Теги */}
    <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
      <div style={{ width: '60px', height: '24px', background: 'var(--surface-tertiary)', borderRadius: '16px' }} />
      <div style={{ width: '80px', height: '24px', background: 'var(--surface-tertiary)', borderRadius: '16px' }} />
      <div style={{ width: '40px', height: '24px', background: 'var(--surface-tertiary)', borderRadius: '16px' }} />
    </div>
    
    {/* Характеристики */}
    <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '12px' }}>
      <div style={{ width: '70px', height: '11px', background: 'var(--surface-tertiary)', borderRadius: '6px' }} />
      <div style={{ width: '60px', height: '11px', background: 'var(--surface-tertiary)', borderRadius: '6px' }} />
      <div style={{ width: '40px', height: '11px', background: 'var(--surface-tertiary)', borderRadius: '6px' }} />
    </div>
  </div>
);

// ========== СЕТКА СКЕЛЕТОНОВ ==========
const NeuralCardsSkeleton = ({ count = 6 }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '24px'
  }}>
    {[...Array(count)].map((_, i) => (
      <NeuralCardSkeleton key={i} />
    ))}
  </div>
);

const FavoritesPage = ({ user }) => {
  const [favorites, setFavorites] = useState([]);
  const [favoriteNets, setFavoriteNets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth <= 768;

  const isLoggedIn = user?.isLoggedIn || false;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadFavorites();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const favIds = await api.getFavorites();
      setFavorites(favIds);
      
      const nets = await Promise.all(favIds.map(id => api.getNeuralNetById(id)));
      setFavoriteNets(nets);
    } catch (error) {
      console.error('Ошибка загрузки избранного:', error);
    }
    setLoading(false);
  };

  const handleToggleFavorite = async (id) => {
    const wasFavorite = favorites.includes(id);
    const currentFavoriteNets = [...favoriteNets];
    
    setFavorites(favorites.filter(f => f !== id));
    setFavoriteNets(favoriteNets.filter(net => net.id !== id));
    
    try {
      await api.removeFromFavorites(id);
    } catch (error) {
      console.error('Ошибка при удалении из избранного:', error);
      setFavorites([...favorites, id]);
      setFavoriteNets(currentFavoriteNets);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '80px' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      
      {/* Hero секция */}
      <div className="hero" style={{ marginBottom: '40px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: isMobile ? '10px' : '16px',
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            width: isMobile ? '48px' : '72px',
            height: isMobile ? '48px' : '72px',
            borderRadius: '16px',
            background: 'var(--surface-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: isMobile ? 'translateY(8px)' : 'translateY(20px)',
            border: '1px solid var(--border-medium)'
          }}>
            <FiHeart 
              size={isMobile ? 28 : 40} 
              fill="var(--accent-red)"
              stroke="var(--accent-red)"
              strokeWidth={0}
            />
          </div>
          <h1 className="gradient-text" style={{ 
            marginBottom: 0,
            fontSize: isMobile ? '28px' : '48px',
            color: 'var(--accent-blue)'
          }}>
            Избранное
          </h1>
        </div>
        <p style={{ fontSize: isMobile ? '12px' : '16px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Ваши любимые нейросети всегда под рукой
        </p>
      </div>
      
      {!isLoggedIn ? (
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '60px 20px'
        }}>
          <div style={{ 
            fontSize: '64px', 
            marginBottom: '20px',
            color: 'var(--text-tertiary)',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <FiLock size={64} />
          </div>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 500,
            color: 'var(--text-primary)', 
            marginBottom: '12px'
          }}>
            Вы не вошли в аккаунт
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: 'var(--text-tertiary)',
            maxWidth: '320px'
          }}>
            Войдите в аккаунт, чтобы сохранять нейросети в избранное
          </div>
        </div>
      ) : loading ? (
        <div className="results-section">
          <div className="results-header" style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0 0 20px 0',
            borderBottom: '1px solid var(--border-medium)',
            marginBottom: '20px'
          }}>
            <div style={{ 
              width: '150px', 
              height: '20px', 
              background: 'var(--surface-tertiary)', 
              borderRadius: '10px',
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />
          </div>
          <NeuralCardsSkeleton count={6} />
        </div>
      ) : favoriteNets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ fontSize: '64px' }}>
            <FiHeart 
              size={64} 
              stroke="var(--text-tertiary)"
              strokeWidth={1.5}
            />
          </div>
          <div className="empty-state-text">
            У вас пока нет избранных нейросетей
          </div>
          <a href="/" style={{ 
            color: 'var(--accent-blue)', 
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '16px',
            padding: '8px 20px',
            borderRadius: '30px',
            background: 'var(--surface-tertiary)',
            border: '1px solid var(--border-medium)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-blue)';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.borderColor = 'var(--accent-blue)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--surface-tertiary)';
            e.currentTarget.style.color = 'var(--accent-blue)';
            e.currentTarget.style.borderColor = 'var(--border-medium)';
          }}>
            <FiArrowRight size={16} />
            <span>Перейти на главную</span>
          </a>
        </div>
      ) : (
        <div className="results-section">
          <div className="results-header" style={{ 
            padding: '0 0 20px 0',
            borderBottom: '1px solid var(--border-medium)',
            marginBottom: '20px'
          }}>
            <span style={{ fontWeight: 500 }}>Всего нейросетей: {favoriteNets.length}</span>
          </div>
          <NeuralCards
            neuralNets={favoriteNets}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            isLoggedIn={user.isLoggedIn} 
          />
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;