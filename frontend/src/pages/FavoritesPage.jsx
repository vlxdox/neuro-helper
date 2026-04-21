import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import NeuralCards from '../components/NeuralCards';
import { FiHeart, FiLock, FiArrowRight } from 'react-icons/fi';

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
            background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(139, 92, 246, 0.15))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: isMobile ? 'translateY(8px)' : 'translateY(20px)'
          }}>
            <FiHeart 
              size={isMobile ? 28 : 40} 
              fill="var(--accent-blue)"
              stroke="var(--accent-blue)"
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
        <div className="loader">
          <div className="spinner"></div>
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
            background: 'rgba(96, 165, 250, 0.15)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(96, 165, 250, 0.15)';
            e.currentTarget.style.color = 'var(--accent-blue)';
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