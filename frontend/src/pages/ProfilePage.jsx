import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getApiBase } from '../services/api';
import { useToast } from '../context/ToastContext';
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
  FiAward,
  FiAlertCircle,
  FiRefreshCw
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

// ========== СТИЛИ ==========
const styles = {
  container: (isMobile) => ({
    minHeight: '100vh',
    background: 'var(--surface-primary)',
    padding: isMobile ? '80px 16px 32px' : '100px 24px 40px'
  }),
  contentWrapper: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: (isMobile) => ({
    background: 'linear-gradient(135deg, var(--surface-secondary) 0%, var(--surface-tertiary) 100%)',
    borderRadius: '24px',
    border: '1px solid var(--border-medium)',
    padding: isMobile ? '20px' : '32px',
    marginBottom: '24px',
    transition: 'opacity 0.4s ease'
  }),
  statsGrid: (isMobile) => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
    gap: isMobile ? '12px' : '16px',
    marginBottom: '24px'
  }),
  chartsGrid: (isMobile) => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: isMobile ? '16px' : '24px',
    marginBottom: isMobile ? '16px' : '24px'
  }),
  guestBlock: (isMobile) => ({
    background: 'var(--surface-tertiary)',
    borderRadius: '20px',
    padding: isMobile ? '32px 20px' : '48px 32px',
    border: '1px solid var(--border-subtle)',
    textAlign: 'center'
  }),
  footer: {
    textAlign: 'center',
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    padding: '32px 0 16px',
    marginTop: '32px',
    borderTop: '1px solid var(--border-subtle)'
  },
  errorContainer: {
    minHeight: '100vh',
    background: 'var(--surface-primary)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '100px 24px 40px'
  },
  errorContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    textAlign: 'center',
    maxWidth: '400px'
  },
  loadingContainer: (isMobile) => ({
    minHeight: '100vh',
    background: 'var(--surface-primary)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? '80px 16px 32px' : '100px 24px 40px'
  })
};

// ========== СКЕЛЕТОНЫ ==========
const StatCardSkeleton = memo(() => (
  <div style={{
    background: 'var(--surface-tertiary)',
    borderRadius: '20px',
    padding: '20px',
    border: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    animation: 'pulse 1.5s ease-in-out infinite'
  }}>
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--surface-secondary)', marginBottom: '16px' }} />
    <div style={{ width: '60px', height: '32px', background: 'var(--surface-secondary)', borderRadius: '8px', marginBottom: '4px' }} />
    <div style={{ width: '100px', height: '13px', background: 'var(--surface-secondary)', borderRadius: '6px' }} />
  </div>
));

const ChartSkeleton = memo(({ isMobile }) => (
  <div style={{
    background: 'var(--surface-tertiary)',
    borderRadius: '20px',
    padding: isMobile ? '16px' : '24px',
    border: '1px solid var(--border-subtle)',
    animation: 'pulse 1.5s ease-in-out infinite'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: 'var(--surface-secondary)' }} />
      <div>
        <div style={{ width: '160px', height: '16px', background: 'var(--surface-secondary)', borderRadius: '8px', marginBottom: '4px' }} />
        <div style={{ width: '120px', height: '13px', background: 'var(--surface-secondary)', borderRadius: '6px' }} />
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '12px', paddingTop: '8px' }}>
      {[...Array(7)].map((_, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '100%', height: isMobile ? '60px' : '100px', background: 'var(--surface-secondary)', borderRadius: '8px' }} />
          <div style={{ width: '24px', height: '10px', background: 'var(--surface-secondary)', borderRadius: '4px' }} />
        </div>
      ))}
    </div>
  </div>
));

const RecentActivitySkeleton = memo(({ isMobile }) => (
  <div style={{
    background: 'var(--surface-tertiary)',
    borderRadius: '20px',
    padding: isMobile ? '16px' : '24px',
    border: '1px solid var(--border-subtle)',
    animation: 'pulse 1.5s ease-in-out infinite'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: 'var(--surface-secondary)' }} />
        <div style={{ width: '140px', height: '16px', background: 'var(--surface-secondary)', borderRadius: '8px' }} />
      </div>
    </div>
    {[...Array(3)].map((_, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--surface-secondary)' }} />
          <div style={{ flex: 1, height: '13px', background: 'var(--surface-secondary)', borderRadius: '6px' }} />
        </div>
        <div style={{ width: '50px', height: '11px', background: 'var(--surface-secondary)', borderRadius: '6px' }} />
      </div>
    ))}
  </div>
));

// ========== КОМПОНЕНТ ОШИБКИ ==========
const ErrorComponent = memo(({ message, onRetry }) => (
  <div style={styles.errorContainer}>
    <div style={styles.errorContent}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '24px',
        background: 'rgba(239, 68, 68, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <FiAlertCircle size={40} color="#ef4444" />
      </div>
      <h3 style={{
        fontSize: '20px',
        fontWeight: 600,
        color: 'var(--text-primary)',
        margin: 0
      }}>
        Не удалось загрузить данные
      </h3>
      <p style={{
        fontSize: '14px',
        color: 'var(--text-tertiary)',
        margin: 0
      }}>
        {message || 'Проверьте подключение к интернету и попробуйте снова'}
      </p>
      <button
        onClick={onRetry}
        style={{
          marginTop: '16px',
          padding: '12px 24px',
          background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
          border: 'none',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
      >
        <FiRefreshCw size={16} />
        Повторить попытку
      </button>
    </div>
  </div>
));

// ========== STAT CARD ==========
const StatCard = memo(({ icon: Icon, label, value, color = 'var(--accent-blue)', subtitle, delay = 0, showContent }) => (
  <div style={{
    background: 'var(--surface-tertiary)',
    borderRadius: '20px',
    padding: '20px',
    border: '1px solid var(--border-subtle)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    opacity: showContent ? 1 : 0,
    transform: showContent ? 'translateY(0) scale(1)' : 'translateY(25px) scale(0.95)',
    transition: `opacity 0.45s cubic-bezier(0.2, 0.9, 0.4, 1) ${delay}ms, transform 0.55s cubic-bezier(0.2, 0.9, 0.4, 1) ${delay}ms`,
    willChange: 'opacity, transform'
  }}>
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
));

// ========== ACTIVITY CHART ==========
const ActivityChart = memo(({ stats, isMobile, showContent }) => {
  const maxCount = Math.max(...stats.weeklyActivity.map(d => d.count), 1);
  const todayIndex = (new Date().getDay() + 6) % 7;
  const totalThisWeek = stats.weeklyActivity.reduce((sum, d) => sum + d.count, 0);
  
  return (
    <div style={{
      background: 'var(--surface-tertiary)',
      borderRadius: '20px',
      padding: isMobile ? '16px' : '24px',
      border: '1px solid var(--border-subtle)',
      opacity: showContent ? 1 : 0,
      transform: showContent ? 'translateY(0) scale(1)' : 'translateY(25px) scale(0.95)',
      transition: 'opacity 0.45s cubic-bezier(0.2, 0.9, 0.4, 1) 120ms, transform 0.55s cubic-bezier(0.2, 0.9, 0.4, 1) 120ms',
      willChange: 'opacity, transform'
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
          <div style={{ textAlign: 'left' }}>
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
              {totalThisWeek} {totalThisWeek === 1 ? 'запрос' : totalThisWeek >= 2 && totalThisWeek <= 4 ? 'запроса' : 'запросов'} за 7 дней
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
                      boxShadow: isToday && day.count > 0 ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none',
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
});

// ========== POPULAR TAGS ==========
const PopularTags = memo(({ stats, isMobile, showContent, getTagDisplayName }) => {
  if (!stats.popularTags.length) return null;
  
  return (
    <div style={{
      background: 'var(--surface-tertiary)',
      borderRadius: '20px',
      padding: isMobile ? '16px' : '24px',
      border: '1px solid var(--border-subtle)',
      opacity: showContent ? 1 : 0,
      transform: showContent ? 'translateX(0) scale(1)' : 'translateX(-25px) scale(0.95)',
      transition: 'opacity 0.45s cubic-bezier(0.2, 0.9, 0.4, 1) 220ms, transform 0.55s cubic-bezier(0.2, 0.9, 0.4, 1) 220ms',
      willChange: 'opacity, transform'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
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
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          Популярные фильтры
        </h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {stats.popularTags.map((item, idx) => (
          <div key={idx}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  width: '24px', height: '24px', borderRadius: '8px',
                  background: idx === 0 ? 'rgba(251, 191, 36, 0.2)' : idx === 1 ? 'rgba(156, 163, 175, 0.2)' : idx === 2 ? 'rgba(180, 83, 9, 0.2)' : 'rgba(100, 116, 139, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 600,
                  color: idx === 0 ? '#fbbf24' : idx === 1 ? '#9ca3af' : idx === 2 ? '#b45309' : 'var(--text-tertiary)',
                  flexShrink: 0
                }}>
                  {idx + 1}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {getTagDisplayName(item.tag)}
                </span>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {item.count}
              </span>
            </div>
            
            {/* Полоска прогресса с анимацией слева направо */}
            <div style={{
              width: '100%', 
              height: '6px',
              background: 'linear-gradient(90deg, transparent 0%, var(--surface-secondary) 100%)',
              borderRadius: '3px', 
              overflow: 'hidden'
            }}>
              <div style={{
                width: showContent ? `${(item.count / stats.popularTags[0].count) * 100}%` : '0%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.5) 50%, #8b5cf6 100%)',
                borderRadius: '3px',
                transition: showContent ? `width 0.6s cubic-bezier(0.2, 0.9, 0.4, 1) ${280 + idx * 25}ms` : 'none',
                willChange: 'width'
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// ========== RECENT ACTIVITY ==========
const RecentActivity = memo(({ stats, isMobile, showContent, formatTimeAgo, navigate }) => {
  if (!stats.recentActivity.length) return null;
  
  return (
    <div style={{
      background: 'var(--surface-tertiary)',
      borderRadius: '20px',
      padding: isMobile ? '16px' : '24px',
      border: '1px solid var(--border-subtle)',
      opacity: showContent ? 1 : 0,
      transform: showContent ? 'translateY(0) scale(1)' : 'translateY(25px) scale(0.95)',
      transition: 'opacity 0.45s cubic-bezier(0.2, 0.9, 0.4, 1) 320ms, transform 0.55s cubic-bezier(0.2, 0.9, 0.4, 1) 320ms',
      willChange: 'opacity, transform'
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
            width: '40px', height: '40px', borderRadius: '14px',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <FiClock size={20} color="#10b981" />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Недавние запросы
          </h3>
        </div>
        
        <button
          onClick={() => navigate('/history')}
          style={{
            background: 'none', border: 'none', color: 'var(--accent-blue)',
            fontSize: '13px', cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: '4px', padding: '6px 12px',
            borderRadius: '20px', transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
        >
          Все <FiChevronRight size={14} />
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {stats.recentActivity.map((activity, idx) => (
          <div key={idx} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px', borderRadius: '12px', transition: 'all 0.2s',
            cursor: 'pointer', flexWrap: isMobile ? 'wrap' : 'nowrap', gap: isMobile ? '8px' : '0'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-secondary)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          onClick={() => navigate('/history')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: activity.mode === 'fast' ? '#3b82f6' : '#8b5cf6',
                flexShrink: 0
              }} />
              <span style={{
                fontSize: '13px', color: 'var(--text-primary)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                {activity.query?.substring(0, isMobile ? 20 : 30) || 'Без запроса'}
                {activity.query?.length > (isMobile ? 20 : 30) ? '...' : ''}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px', flexShrink: 0 }}>
              <span style={{
                fontSize: '11px', color: 'var(--text-tertiary)',
                background: 'var(--surface-secondary)', padding: '4px 8px', borderRadius: '12px'
              }}>
                {activity.resultsCount} рез.
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                {formatTimeAgo(activity.date)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// ========== MAIN COMPONENT ==========
const ProfilePage = ({ user, onLogin, onLogout }) => {
  const navigate = useNavigate();
  const toast = useToast();
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
  const [error, setError] = useState(null);
  const [showContent, setShowContent] = useState(false);
  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    setError(null);
    setShowContent(false);
    
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
        totalNets,
        totalTags: Array.isArray(allTags) ? allTags.length : 0,
        userChatsCount: userChats.length,
        userFavoritesCount: userFavorites.length,
        weeklyActivity: activity,
        popularTags,
        recentActivity
      });
      
      setLoadingStats(false);
      
      setTimeout(() => {
        requestAnimationFrame(() => {
          setShowContent(true);
        });
      }, 100);
    } catch (err) {
      console.error('Ошибка загрузки статистики:', err);
      setError(err.message || 'Неизвестная ошибка');
      setLoadingStats(false);
    }
  }, [user.isLoggedIn]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

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
        chat.filters.forEach(filter => { tagCount[filter] = (tagCount[filter] || 0) + 1; });
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

  const handleGoogleLogin = () => api.googleLogin();

  const handleLogout = () => {
    onLogout();
    toast.info('Вы вышли из аккаунта');
    navigate('/');
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'только что';
    const utcDate = new Date(date);
    if (isNaN(utcDate.getTime())) return 'только что';
    const offset = new Date().getTimezoneOffset();
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
    
    return localDate.toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  };

  const getTagDisplayName = (tag) => {
    const names = {
      'free': 'Бесплатно', 'freemium': 'Подписка', 'paid': 'Платно',
      'has_api': 'API', 'low': 'Низкая сложность', 'medium': 'Средняя сложность', 'high': 'Высокая сложность'
    };
    return names[tag] || tag;
  };

  // ========== RENDER ==========
  if (error) {
    return <ErrorComponent message={error} onRetry={loadStats} />;
  }

  if (loadingStats) {
    return (
      <div style={styles.loadingContainer(isMobile)}>
        <div style={styles.contentWrapper}>
          {/* Header Skeleton */}
          <div style={{
            ...styles.header(isMobile),
            background: 'var(--surface-tertiary)',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '28px', background: 'var(--surface-secondary)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: '200px', height: '28px', background: 'var(--surface-secondary)', borderRadius: '8px', marginBottom: '8px' }} />
                <div style={{ width: '300px', height: '14px', background: 'var(--surface-secondary)', borderRadius: '6px' }} />
              </div>
            </div>
          </div>
          
          {/* Stats Grid Skeletons */}
          <div style={styles.statsGrid(isMobile)}>
            {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
          
          {/* Charts Skeletons */}
          <div style={styles.chartsGrid(isMobile)}>
            <ChartSkeleton isMobile={isMobile} />
            <ChartSkeleton isMobile={isMobile} />
          </div>
          
          {/* Recent Activity Skeleton */}
          <RecentActivitySkeleton isMobile={isMobile} />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container(isMobile)}>
      <div style={styles.contentWrapper}>
        {/* Profile Header */}
        <div style={{ ...styles.header(isMobile), opacity: showContent ? 1 : 0 }}>
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
                    style={{ width: '100%', height: '100%', borderRadius: '25px', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{
                    fontSize: isMobile ? '36px' : '48px',
                    fontWeight: 600,
                    color: user.isLoggedIn ? 'white' : 'var(--text-primary)'
                  }}>
                    {user.isLoggedIn ? user.name?.charAt(0).toUpperCase() : <FiUser size={48} style={{ transform: 'translateY(6px)' }} />}
                  </span>
                )}
              </div>
            </div>
            
            {/* User Info */}
            <div style={{ flex: 1, minWidth: 0, textAlign: isMobile ? 'center' : 'left' }}>
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'center' : 'center',
                justifyContent: isMobile ? 'center' : 'flex-start',
                gap: isMobile ? '6px' : '12px',
                marginBottom: '8px',
                flexWrap: 'wrap'
              }}>
                <h1 style={{
                  fontSize: isMobile ? '22px' : '28px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0,
                  textAlign: isMobile ? 'center' : 'left'
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
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap'
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
                    <button onClick={() => navigate('/favorites')} style={{
                      padding: '10px 20px', background: 'var(--surface-secondary)',
                      border: '1px solid var(--border-medium)', borderRadius: '12px',
                      fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                      color: 'var(--text-primary)', transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '8px', flex: 1
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-secondary)'; e.currentTarget.style.borderColor = 'var(--border-medium)'; }}>
                      <FiHeart size={14} /> Избранное
                    </button>
                    
                    <button onClick={() => navigate('/history')} style={{
                      padding: '10px 20px', background: 'var(--surface-secondary)',
                      border: '1px solid var(--border-medium)', borderRadius: '12px',
                      fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                      color: 'var(--text-primary)', transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '8px', flex: 1
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-secondary)'; e.currentTarget.style.borderColor = 'var(--border-medium)'; }}>
                      <FiClock size={14} /> История
                    </button>
                  </div>
                  
                  <button onClick={handleLogout} style={{
                    padding: '10px 20px', background: 'transparent',
                    border: '1px solid var(--border-medium)', borderRadius: '12px',
                    fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                    color: '#ef4444', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '8px', transition: 'all 0.2s',
                    width: isMobile ? '100%' : 'auto'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = '#ef4444'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border-medium)'; }}>
                    <FiLogOut size={14} /> Выйти
                  </button>
                </>
              ) : (
                <button onClick={handleGoogleLogin} style={{
                  padding: '12px 20px', background: 'var(--surface-secondary)',
                  border: '1px solid var(--border-medium)', borderRadius: '12px',
                  fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                  color: 'var(--text-primary)', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '8px', width: '100%'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-secondary)'; e.currentTarget.style.borderColor = 'var(--border-medium)'; }}>
                  <FcGoogle size={18} />
                  <span>Войти через Google</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid - 4 cards */}
        <div style={styles.statsGrid(isMobile)}>
          <StatCard icon={FiDatabase} label="Нейросетей в базе" value={stats.totalNets || 300} color="#3b82f6" subtitle="+15 за неделю" delay={0} showContent={showContent} />
          <StatCard icon={FiTag} label="Уникальных тегов" value={stats.totalTags || 50} color="#10b981" subtitle="Категории и фильтры" delay={40} showContent={showContent} />
          {user.isLoggedIn ? (
            <>
              <StatCard icon={FiHeart} label="В избранном" value={stats.userFavoritesCount} color="#ef4444" subtitle="Сохранённых моделей" delay={80} showContent={showContent} />
              <StatCard icon={FiSearch} label="Всего запросов" value={stats.userChatsCount} color="#8b5cf6" subtitle="За всё время" delay={120} showContent={showContent} />
            </>
          ) : (
            <>
              <StatCard icon={FiHeart} label="В избранном" value="—" color="#ef4444" subtitle="Войдите для просмотра" delay={80} showContent={showContent} />
              <StatCard icon={FiSearch} label="Всего запросов" value="—" color="#8b5cf6" subtitle="Войдите для просмотра" delay={120} showContent={showContent} />
            </>
          )}
        </div>

        {/* Charts and Activity Section */}
        {user.isLoggedIn ? (
          <>
            <div style={styles.chartsGrid(isMobile)}>
              <ActivityChart stats={stats} isMobile={isMobile} showContent={showContent} />
              <PopularTags stats={stats} isMobile={isMobile} showContent={showContent} getTagDisplayName={getTagDisplayName} />
            </div>
            <RecentActivity stats={stats} isMobile={isMobile} showContent={showContent} formatTimeAgo={formatTimeAgo} navigate={navigate} />
          </>
        ) : (
          <div style={{
            ...styles.guestBlock(isMobile),
            opacity: showContent ? 1 : 0,
            transform: showContent ? 'translateY(0) scale(1)' : 'translateY(25px) scale(0.95)',
            transition: 'opacity 0.45s cubic-bezier(0.2, 0.9, 0.4, 1) 160ms, transform 0.55s cubic-bezier(0.2, 0.9, 0.4, 1) 160ms',
            willChange: 'opacity, transform'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '20px',
              background: 'rgba(139, 92, 246, 0.1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
            }}>
              <FiActivity size={32} color="#8b5cf6" opacity={0.7} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              Войдите в аккаунт
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', margin: 0 }}>
              Чтобы видеть статистику активности и историю запросов
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
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