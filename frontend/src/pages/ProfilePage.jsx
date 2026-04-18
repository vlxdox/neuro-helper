import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getApiBase } from '../services/api';
import { 
  FiHeart, 
  FiClock, 
  FiLogOut, 
  FiDatabase, 
  FiTag, 
  FiUser, 
  FiMail, 
  FiSearch,
  FiChevronRight,
  FiActivity,
  FiTrendingUp,
  FiAward
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

const ProfilePage = ({ user, onLogin, onLogout }) => {
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [stats, setStats] = useState({
    totalNets: 0,
    totalTags: 0,
    userChatsCount: 0,
    userFavoritesCount: 0,
    weeklyActivity: [],
    popularTags: [],
    recentActivity: []
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadStats();
  }, [user.isLoggedIn]);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const countResponse = await fetch(`${getApiBase()}/neural_nets/count`);
      const countData = await countResponse.json();
      const totalNets = countData.count || 300;
      
      const allTags = await api.getAllTags();
      
      let userChats = [];
      let userFavorites = [];
      
      if (user.isLoggedIn) {
        userChats = await api.getAllChatsForStats();
        userFavorites = await api.getFavorites();
      }
      
      const activity = generateWeeklyActivity(userChats);
      const popularTags = generatePopularTags(userChats);
      const recentActivity = generateRecentActivity(userChats);
      
      setStats({
        totalNets: totalNets,
        totalTags: Array.isArray(allTags) ? allTags.length : 0,
        userChatsCount: userChats.length,
        userFavoritesCount: userFavorites.length,
        weeklyActivity: activity,
        popularTags: popularTags,
        recentActivity: recentActivity
      });
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      setStats({
        totalNets: '-',
        totalTags: '-',
        userChatsCount: 0,
        userFavoritesCount: 0,
        weeklyActivity: [],
        popularTags: [],
        recentActivity: []
      });
    }
    setLoadingStats(false);
  };

  const generateWeeklyActivity = (chats) => {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dayOfWeek = todayLocal.getDay();
    
    let mondayDate = new Date(todayLocal);
    if (dayOfWeek === 0) {
      mondayDate.setDate(todayLocal.getDate() - 6);
    } else {
      mondayDate.setDate(todayLocal.getDate() - (dayOfWeek - 1));
    }
    
    return days.map((day, i) => {
      const currentDate = new Date(mondayDate);
      currentDate.setDate(mondayDate.getDate() + i);
      
      const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
      
      const count = chats.filter(chat => {
        if (!chat.created_at) return false;
        const chatDate = new Date(chat.created_at);
        const chatDateLocal = new Date(chatDate.getFullYear(), chatDate.getMonth(), chatDate.getDate());
        return chatDateLocal >= startOfDay && chatDateLocal < endOfDay;
      }).length;
      
      return { day, date: currentDate, count };
    });
  };

  const generatePopularTags = (chats) => {
    const tagCount = {};
    chats.forEach(chat => {
      if (chat.filters) {
        chat.filters.forEach(filter => {
          tagCount[filter] = (tagCount[filter] || 0) + 1;
        });
      }
    });
    
    const sortedTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));
    
    if (sortedTags.length === 0) {
      return [
        { tag: 'free', count: 12 },
        { tag: 'генерация текста', count: 8 },
        { tag: 'has_api', count: 6 },
        { tag: 'low', count: 5 },
        { tag: 'генерация изображений', count: 4 }
      ];
    }
    
    return sortedTags;
  };

  const generateRecentActivity = (chats) => {
    return chats
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(chat => ({
        id: chat.id,
        query: chat.query,
        mode: chat.mode,
        date: new Date(chat.created_at),
        resultsCount: chat.results?.length || 0
      }));
  };

  const handleGoogleLogin = () => {
    api.googleLogin();
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'только что';
    
    // Преобразуем строку в дату
    const utcDate = new Date(date);
    
    // Проверяем, что дата валидна
    if (isNaN(utcDate.getTime())) return 'только что';
    
    // Получаем локальное смещение в минутах
    const offset = new Date().getTimezoneOffset();
    
    // Корректируем UTC время на локальное (UTC+3 = -180 минут, поэтому вычитаем отрицательное)
    const localDate = new Date(utcDate.getTime() - (offset * 60 * 1000));
    
    const now = new Date();
    const diffMs = now.getTime() - localDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    
    return localDate.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTagDisplayName = (tag) => {
    const names = {
      'free': 'Бесплатно',
      'freemium': 'Подписка',
      'paid': 'Платно',
      'has_api': 'API',
      'low': 'Низкая сложность',
      'medium': 'Средняя сложность',
      'high': 'Высокая сложность'
    };
    return names[tag] || tag;
  };

  const StatCard = ({ icon: Icon, label, value, color = 'var(--accent-blue)', subtitle }) => (
    <div style={{
      background: 'var(--surface-tertiary)',
      borderRadius: '20px',
      padding: '20px',
      transition: 'all 0.3s ease',
      border: '1px solid var(--border-subtle)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center'
    }}>
      {/* Декоративный полукруг на всю ширину блока */}
      <div style={{
        position: 'absolute',
        top: '-60px',
        left: '0',
        right: '0',
        width: '100%',
        height: '180px',
        background: `radial-gradient(ellipse at 50% 0%, ${color}25 0%, ${color}10 40%, transparent 70%)`,
        pointerEvents: 'none'
      }} />
      
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '16px',
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
        position: 'relative',
        zIndex: 1
      }}>
        <Icon size={24} color={color} />
      </div>
      
      <div style={{
        fontSize: '32px',
        fontWeight: 700,
        color: 'var(--text-primary)',
        lineHeight: 1.2,
        marginBottom: '4px',
        position: 'relative',
        zIndex: 1
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '13px',
        color: 'var(--text-tertiary)',
        fontWeight: 500,
        marginBottom: subtitle ? '8px' : '0',
        position: 'relative',
        zIndex: 1
      }}>
        {label}
      </div>
      {subtitle && (
        <div style={{
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          opacity: 0.7,
          position: 'relative',
          zIndex: 1
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );

  const ActivityChart = () => {
    const maxCount = Math.max(...stats.weeklyActivity.map(d => d.count), 1);
    const todayIndex = (new Date().getDay() + 6) % 7;
    const totalThisWeek = stats.weeklyActivity.reduce((sum, d) => sum + d.count, 0);
    
    return (
      <div style={{
        background: 'var(--surface-tertiary)',
        borderRadius: '20px',
        padding: isMobile ? '16px' : '24px',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isMobile ? '16px' : '24px',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: isMobile ? '12px' : '0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '14px',
              background: 'rgba(139, 92, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiActivity size={20} color="#8b5cf6" />
            </div>
            <div style={{textAlign: 'left'}}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
                marginBottom: '4px',
              }}>
                Активность за неделю
              </h3>
              <p style={{
                fontSize: '13px',
                color: 'var(--text-tertiary)',
                margin: 0
              }}>
                {totalThisWeek} {totalThisWeek === 1 ? 'запрос' : 
                  totalThisWeek >= 2 && totalThisWeek <= 4 ? 'запроса' : 'запросов'} за 7 дней
              </p>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: 'rgba(139, 92, 246, 0.1)',
            borderRadius: '20px'
          }}>
            <FiTrendingUp size={14} color="#8b5cf6" />
            <span style={{ fontSize: '12px', color: '#8b5cf6', fontWeight: 500 }}>
              {totalThisWeek > 0 ? '+' + totalThisWeek : '0'}
            </span>
          </div>
        </div>
        
        <div style={{ position: 'relative' }}>
          {/* Фоновая сетка */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            pointerEvents: 'none'
          }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{
                height: '1px',
                background: 'var(--border-subtle)',
                opacity: 0.5
              }} />
            ))}
          </div>
          
          {/* Столбцы */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            gap: isMobile ? '4px' : '12px',
            paddingTop: '8px'
          }}>
            {stats.weeklyActivity.map((day, idx) => {
              const heightPercent = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
              const isToday = idx === todayIndex;
              
              return (
                <div key={idx} style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  maxWidth: isMobile ? '35px' : '60px'
                }}>
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    {day.count > 0 && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: isToday ? '#8b5cf6' : 'var(--text-secondary)',
                        marginBottom: '4px'
                      }}>
                        {day.count}
                      </span>
                    )}
                    
                    <div style={{
                      width: '100%',
                      height: isMobile ? '100px' : '140px',
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center'
                    }}>
                      <div style={{
                        width: isMobile ? '28px' : '44px',
                        height: `${Math.max(heightPercent, 2)}%`,
                        minHeight: '4px',
                        background: isToday 
                          ? 'linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%)'
                          : day.count > 0
                            ? 'linear-gradient(180deg, #64748b 0%, #475569 100%)'
                            : 'var(--surface-tertiary)',
                        borderRadius: '8px 8px 4px 4px',
                        transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isToday && day.count > 0 
                          ? '0 4px 12px rgba(139, 92, 246, 0.3)' 
                          : 'none',
                        border: day.count === 0 ? '1px solid var(--border-subtle)' : 'none'
                      }} />
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: isMobile ? '10px' : '12px',
                      fontWeight: isToday ? 600 : 500,
                      color: isToday ? '#8b5cf6' : 'var(--text-secondary)'
                    }}>
                      {day.day}
                    </div>
                    {!isMobile && (
                      <div style={{
                        fontSize: '9px',
                        color: 'var(--text-tertiary)',
                        marginTop: '2px'
                      }}>
                        {day.date.getDate()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const PopularTags = () => {
    if (!user.isLoggedIn) return null;
    
    return (
      <div style={{
        background: 'var(--surface-tertiary)',
        borderRadius: '20px',
        padding: isMobile ? '16px' : '24px',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '14px',
            background: 'rgba(59, 130, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FiTag size={20} color="#3b82f6" />
          </div>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Популярные фильтры
          </h3>
        </div>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px'
        }}>
          {stats.popularTags.map((item, idx) => (
            <div key={idx}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '8px',
                    background: idx === 0 ? 'rgba(251, 191, 36, 0.2)' :
                               idx === 1 ? 'rgba(156, 163, 175, 0.2)' :
                               idx === 2 ? 'rgba(180, 83, 9, 0.2)' :
                               'rgba(100, 116, 139, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: idx === 0 ? '#fbbf24' :
                           idx === 1 ? '#9ca3af' :
                           idx === 2 ? '#b45309' :
                           'var(--text-tertiary)',
                    flexShrink: 0
                  }}>
                    {idx + 1}
                  </span>
                  <span style={{
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    fontWeight: 500
                  }}>
                    {getTagDisplayName(item.tag)}
                  </span>
                </div>
                
                <span style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)'
                }}>
                  {item.count}
                </span>
              </div>
              
              <div style={{
                width: '100%',
                height: '6px',
                background: 'linear-gradient(90deg, transparent 0%, var(--surface-secondary) 100%)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(item.count / stats.popularTags[0].count) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.5) 50%, #8b5cf6 100%)',
                  borderRadius: '3px',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const RecentActivity = () => {
    if (!user.isLoggedIn || stats.recentActivity.length === 0) return null;
    
    return (
      <div style={{
        background: 'var(--surface-tertiary)',
        borderRadius: '20px',
        padding: isMobile ? '16px' : '24px',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: isMobile ? '12px' : '0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '14px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiClock size={20} color="#10b981" />
            </div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0
            }}>
              Недавние запросы
            </h3>
          </div>
          
          <button
            onClick={() => navigate('/history')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-blue)',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '20px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            Все <FiChevronRight size={14} />
          </button>
        </div>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px'
        }}>
          {stats.recentActivity.map((activity, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              borderRadius: '12px',
              transition: 'all 0.2s',
              cursor: 'pointer',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
              gap: isMobile ? '8px' : '0'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            onClick={() => navigate('/history')}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flex: 1,
                minWidth: 0
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: activity.mode === 'fast' ? '#3b82f6' : '#8b5cf6',
                  flexShrink: 0
                }} />
                <span style={{
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {activity.query?.substring(0, isMobile ? 20 : 30) || 'Без запроса'}
                  {activity.query?.length > (isMobile ? 20 : 30) ? '...' : ''}
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '8px' : '16px',
                flexShrink: 0
              }}>
                <span style={{
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                  background: 'var(--surface-secondary)',
                  padding: '4px 8px',
                  borderRadius: '12px'
                }}>
                  {activity.resultsCount} рез.
                </span>
                <span style={{
                  fontSize: '11px',
                  color: 'var(--text-tertiary)'
                }}>
                  {formatTimeAgo(activity.date)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--surface-primary)',
      padding: isMobile ? '80px 16px 32px' : '100px 24px 40px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Profile Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--surface-secondary) 0%, var(--surface-tertiary) 100%)',
          borderRadius: '24px',
          border: '1px solid var(--border-medium)',
          padding: isMobile ? '20px' : '32px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '16px' : '24px',
            flexWrap: isMobile ? 'wrap' : 'nowrap'
          }}>
            {/* Avatar */}
            <div style={{ 
              flexShrink: 0,
              width: isMobile ? '100%' : 'auto',
              display: 'flex',
              justifyContent: isMobile ? 'center' : 'flex-start'
            }}>
              <div style={{
                width: isMobile ? '80px' : '100px',
                height: isMobile ? '80px' : '100px',
                borderRadius: '28px',
                background: user.isLoggedIn 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'var(--surface-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '3px solid var(--surface-secondary)'
              }}>
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt="Avatar"
                    referrerPolicy="no-referrer"
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '25px',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <span style={{
                    fontSize: isMobile ? '36px' : '48px',
                    fontWeight: 600,
                    color: user.isLoggedIn ? 'white' : 'var(--text-primary)'
                  }}>
                    {user.isLoggedIn ? user.name?.charAt(0).toUpperCase() : <FiUser size={48} style={{transform: 'translateY(6px)'}}/>}
                  </span>
                )}
              </div>
            </div>
            
            {/* User Info */}
            <div style={{ 
              flex: 1, 
              minWidth: 0,
              textAlign: isMobile ? 'center' : 'left'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isMobile ? 'center' : 'flex-start',
                gap: '12px',
                marginBottom: '8px',
                flexWrap: 'wrap'
              }}>
                <h1 style={{
                  fontSize: isMobile ? '22px' : '28px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  {user.isLoggedIn ? user.name : 'Гость'}
                </h1>
                
                {user.isLoggedIn && (
                  <span style={{
                    padding: '4px 12px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <FiAward size={12} />
                    Активный пользователь
                  </span>
                )}
              </div>
              
              <p style={{
                fontSize: '14px',
                color: 'var(--text-tertiary)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: isMobile ? 'center' : 'flex-start',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                {user.isLoggedIn ? (
                  <>
                    <FiMail size={14} />
                    {user.email}
                  </>
                ) : (
                  'Войдите в аккаунт, чтобы получить доступ ко всем функциям'
                )}
              </p>
            </div>
            
            {/* Buttons */}
            <div style={{ 
              flexShrink: 0,
              width: isMobile ? '100%' : 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {user.isLoggedIn ? (
                <>
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    flexDirection: isMobile ? 'column' : 'row',
                    width: '100%'
                  }}>
                    <button
                      onClick={() => navigate('/favorites')}
                      style={{
                        padding: '10px 20px',
                        background: 'var(--surface-secondary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        flex: 1
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.borderColor = '#ef4444';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--surface-secondary)';
                        e.currentTarget.style.borderColor = 'var(--border-medium)';
                      }}
                    >
                      <FiHeart size={14} />
                      Избранное
                    </button>
                    
                    <button
                      onClick={() => navigate('/history')}
                      style={{
                        padding: '10px 20px',
                        background: 'var(--surface-secondary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        flex: 1
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                        e.currentTarget.style.borderColor = '#3b82f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--surface-secondary)';
                        e.currentTarget.style.borderColor = 'var(--border-medium)';
                      }}
                    >
                      <FiClock size={14} />
                      История
                    </button>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    style={{
                      padding: '10px 20px',
                      background: 'transparent',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      color: '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                      width: isMobile ? '100%' : 'auto'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                      e.currentTarget.style.borderColor = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'var(--border-medium)';
                    }}
                  >
                    <FiLogOut size={14} />
                    Выйти
                  </button>
                </>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  style={{
                    padding: '12px 20px',
                    background: 'var(--surface-secondary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--surface-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border-medium)';
                  }}
                >
                  <FcGoogle size={18} />
                  <span>Войти через Google</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid - 4 cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '12px' : '16px',
          marginBottom: '24px'
        }}>
          <StatCard 
            icon={FiDatabase}
            label="Нейросетей в базе"
            value={stats.totalNets || 300}
            color="#3b82f6"
            subtitle="+15 за неделю"
          />
          <StatCard 
            icon={FiTag}
            label="Уникальных тегов"
            value={stats.totalTags || 50}
            color="#10b981"
            subtitle="Категории и фильтры"
          />
          {user.isLoggedIn ? (
            <>
              <StatCard 
                icon={FiHeart}
                label="В избранном"
                value={stats.userFavoritesCount}
                color="#ef4444"
                subtitle="Сохранённых моделей"
              />
              <StatCard 
                icon={FiSearch}
                label="Всего запросов"
                value={stats.userChatsCount}
                color="#8b5cf6"
                subtitle="За всё время"
              />
            </>
          ) : (
            <>
              <StatCard 
                icon={FiHeart}
                label="В избранном"
                value="—"
                color="#ef4444"
                subtitle="Войдите для просмотра"
              />
              <StatCard 
                icon={FiSearch}
                label="Всего запросов"
                value="—"
                color="#8b5cf6"
                subtitle="Войдите для просмотра"
              />
            </>
          )}
        </div>

        {/* Charts and Activity Section - показываем только для авторизованных */}
        {user.isLoggedIn ? (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? '16px' : '24px',
              marginBottom: isMobile ? '16px' : '24px'
            }}>
              <ActivityChart />
              <PopularTags />
            </div>

            <RecentActivity />
          </>
        ) : (
          <div style={{
            background: 'var(--surface-tertiary)',
            borderRadius: '20px',
            padding: isMobile ? '32px 20px' : '48px 32px',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'rgba(139, 92, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <FiActivity size={32} color="#8b5cf6" opacity={0.7} />
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: '0 0 8px 0'
            }}>
              Войдите в аккаунт
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-tertiary)',
              margin: 0
            }}>
              Чтобы видеть статистику активности и историю запросов
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--text-tertiary)',
          padding: '32px 0 16px',
          marginTop: '32px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>Нейро.Помощник</span> v1.0.0
          </div>
          <div>Навигатор по миру нейросетей • {new Date().getFullYear()}</div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;