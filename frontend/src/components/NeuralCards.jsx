import React, { useState, useEffect, memo } from 'react';
import { FiHeart, FiCpu, FiZap, FiBox, FiDollarSign } from 'react-icons/fi';

const NeuralCards = memo(({ neuralNets, favorites, onToggleFavorite, isLoggedIn }) => {
  const [visibleCount, setVisibleCount] = useState(() => Math.min(6, neuralNets.length));
  const [imageErrors, setImageErrors] = useState({});
  const hasMore = visibleCount < neuralNets.length;

  useEffect(() => {
    setVisibleCount(Math.min(6, neuralNets.length));
    setImageErrors({});
  }, [neuralNets.length]);

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 6, neuralNets.length));
  };

  const getComplexityInfo = (complexity) => {
    const map = {
      low: { text: 'Низкая', color: 'var(--accent-green)' },
      medium: { text: 'Средняя', color: 'var(--accent-yellow)' },
      high: { text: 'Высокая', color: 'var(--accent-red)' }
    };
    return map[complexity] || { text: complexity, color: 'var(--text-tertiary)' };
  };

  const getPriceInfo = (priceType) => {
    const map = {
      free: { text: 'Бесплатно', color: 'var(--accent-green)' },
      freemium: { text: 'Подписка', color: 'var(--accent-purple)' },
      paid: { text: 'Платно', color: 'var(--accent-yellow)' }
    };
    return map[priceType] || { text: priceType, color: 'var(--text-tertiary)' };
  };

  const getRelevantTags = (tags, searchQuery = '') => {
    if (!searchQuery) return tags;
    
    const queryLower = searchQuery.toLowerCase();
    return [...tags].sort((a, b) => {
      const aRelevant = queryLower.includes(a.toLowerCase()) ? 1 : 0;
      const bRelevant = queryLower.includes(b.toLowerCase()) ? 1 : 0;
      return bRelevant - aRelevant;
    });
  };

  const getLogoUrl = (netName, netId) => {
    const nameMap = {
      'ChatGPT': 'chatgpt',
      'Claude AI': 'claude',
      'DeepSeek': 'deepseek',
      'Gemini': 'gemini',
      'Perplexity AI': 'perplexity',
      'Midjourney': 'midjourney',
      'Stable Diffusion': 'stable-diffusion',
      'DALL·E 3': 'dalle',
      'GitHub Copilot': 'github-copilot',
      'GigaChat': 'gigachat',
    };
    
    const logoName = nameMap[netName] || netName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `/logos/${logoName}.png`;
  };

  const handleImageError = (netId) => {
    setImageErrors(prev => ({ ...prev, [netId]: true }));
  };

  const visibleNets = neuralNets.slice(0, visibleCount);

  if (neuralNets.length === 0) {
    return null;
  }

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {visibleNets.map((net, index) => {
          const complexity = getComplexityInfo(net.complexity);
          const price = getPriceInfo(net.price_type);
          const isFavorite = favorites.includes(net.id);
          const showLogo = !imageErrors[net.id];
          
          const maxVisibleTags = 2;
          const relevantTags = getRelevantTags(net.tags, '');
          const visibleTags = relevantTags.slice(0, maxVisibleTags);
          const remainingCount = net.tags.length - visibleTags.length;

          return (
            <div
              key={net.id}
              className="neural-card"
              style={{
                background: 'var(--surface-secondary)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.25s ease',
                border: '1px solid var(--border-medium)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                e.currentTarget.style.borderColor = 'var(--accent-blue)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.borderColor = 'var(--border-medium)';
              }}
            >
              {/* Верхняя часть: логотип + название + кнопка избранного */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                marginBottom: '12px',
                flexShrink: 0
              }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'var(--surface-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: '1px solid var(--border-subtle)',
                  overflow: 'hidden'
                }}>
                  {showLogo ? (
                    <img
                      src={getLogoUrl(net.name, net.id)}
                      alt={net.name}
                      style={{
                        width: '32px',
                        height: '32px',
                        objectFit: 'contain'
                      }}
                      onError={() => handleImageError(net.id)}
                    />
                  ) : (
                    <span style={{
                      fontSize: '20px',
                      fontWeight: 600,
                      color: 'var(--accent-blue)'
                    }}>
                      {net.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                <a
                  href={net.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    flex: 1,
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--accent-blue)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                >
                  {net.name}
                </a>
                
                {isLoggedIn ? (
                  <button
                    onClick={() => onToggleFavorite(net.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      padding: '4px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: isFavorite ? '#ef4444' : 'var(--text-tertiary)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.background = 'rgba(96, 165, 250, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <FiHeart 
                      size={22} 
                      fill={isFavorite ? '#ef4444' : 'none'}
                      stroke={isFavorite ? '#ef4444' : 'currentColor'}
                      strokeWidth={isFavorite ? 0 : 2}
                    />
                  </button>
                ) : (
                  <div style={{
                    opacity: 0.3,
                    cursor: 'not-allowed',
                    padding: '4px',
                    flexShrink: 0,
                    color: 'var(--text-tertiary)'
                  }}>
                    <FiHeart size={22} />
                  </div>
                )}
              </div>

              {/* Описание */}
              <p style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: '1.5',
                margin: 0,
                marginBottom: '12px',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textAlign: 'left'
              }}>
                {net.description.length > 100
                  ? net.description.substring(0, 100) + '...'
                  : net.description}
              </p>

              {/* Теги */}
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                alignItems: 'center',
                gap: '6px', 
                marginBottom: '12px',
                flexShrink: 0
              }}>
                {visibleTags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      background: 'rgba(96, 165, 250, 0.1)',
                      color: 'var(--accent-blue)',
                      padding: '3px 10px',
                      borderRadius: '16px',
                      fontSize: '10px',
                      fontWeight: 500,
                      border: '1px solid rgba(96, 165, 250, 0.2)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {tag}
                  </span>
                ))}
                {remainingCount > 0 && (
                  <span style={{
                    background: 'var(--surface-tertiary)',
                    color: 'var(--text-tertiary)',
                    padding: '3px 10px',
                    borderRadius: '16px',
                    fontSize: '10px',
                    fontWeight: 500,
                    border: '1px solid var(--border-subtle)',
                    whiteSpace: 'nowrap'
                  }}>
                    +{remainingCount}
                  </span>
                )}
              </div>

              {/* Характеристики */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '12px',
                marginTop: 'auto',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '11px',
                color: 'var(--text-tertiary)',
                flexShrink: 0
              }}>
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  color: price.color 
                }}>
                  <FiDollarSign size={12} />
                  <span>{price.text}</span>
                </span>
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  color: complexity.color 
                }}>
                  <FiZap size={12} />
                  <span>{complexity.text}</span>
                </span>
                {net.has_api && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiCpu size={12} />
                    <span>Есть API</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
          <button
            onClick={loadMore}
            className="show-more-btn"
            style={{
              padding: '10px 28px',
              background: 'var(--surface-tertiary)',
              border: '1px solid var(--border-medium)',
              borderRadius: '40px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontFamily: 'Montserrat, sans-serif',
              transition: 'all 0.2s cubic-bezier(0.2, 0.9, 0.4, 1.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--surface-tertiary)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-medium)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Показать ещё ({neuralNets.length - visibleCount})
          </button>
        </div>
      )}

      <div style={{
        textAlign: 'center',
        marginTop: '16px',
        fontSize: '12px',
        color: 'var(--text-tertiary)',
        fontFamily: 'Montserrat, sans-serif'
      }}>
        {visibleCount} из {neuralNets.length} нейросетей
      </div>
    </div>
  );
});

export default NeuralCards;