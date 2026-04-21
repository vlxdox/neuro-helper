import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  FiClock, 
  FiLock, 
  FiSearch, 
  FiX, 
  FiChevronDown, 
  FiChevronUp,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiTrash2,
  FiZap,
  FiCpu,
  FiLink,
  FiInbox,
  FiActivity,
  FiDollarSign,
  FiFilter,
  FiBox
} from 'react-icons/fi';

// ========== СКЕЛЕТОН ЗАПРОСА ==========
const ChatItemSkeleton = () => (
  <div style={{
    background: 'var(--surface-secondary)',
    borderRadius: '20px',
    padding: '20px',
    border: '1px solid var(--border-medium)',
    animation: 'pulse 1.5s ease-in-out infinite'
  }}>
    {/* Верхняя строка: иконка + текст + кнопки */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
        {/* Иконка режима */}
        <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'var(--surface-tertiary)' }} />
        <div style={{ flex: 1 }}>
          {/* Заголовок запроса */}
          <div style={{ height: '20px', background: 'var(--surface-tertiary)', borderRadius: '10px', marginBottom: '10px', width: '80%' }} />
          {/* Метки */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '80px', height: '24px', background: 'var(--surface-tertiary)', borderRadius: '30px' }} />
            <div style={{ width: '100px', height: '13px', background: 'var(--surface-tertiary)', borderRadius: '6px' }} />
            <div style={{ width: '90px', height: '24px', background: 'var(--surface-tertiary)', borderRadius: '30px' }} />
          </div>
        </div>
      </div>
      {/* Кнопки */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--surface-tertiary)' }} />
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--surface-tertiary)' }} />
      </div>
    </div>
  </div>
);

// ========== СЕТКА СКЕЛЕТОНОВ ==========
const ChatListSkeleton = ({ count = 5 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    {[...Array(count)].map((_, i) => (
      <ChatItemSkeleton key={i} />
    ))}
  </div>
);

const HistoryPage = ({ user }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedChat, setExpandedChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 50;
  
  const isMobile = windowWidth <= 768;
  const isLoggedIn = user?.isLoggedIn || false;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadChats();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, currentPage]);

  const loadChats = async () => {
    setLoading(true);
    try {
      const data = await api.getChats(currentPage, itemsPerPage);
      setChats(data.chats || []);
      setTotalPages(data.total_pages || 1);
      setTotalItems(data.total || 0);
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
    }
    setLoading(false);
  };

  const handleDeleteChat = async (id) => {
    if (window.confirm('Удалить этот запрос из истории?')) {
      await api.deleteChat(id);
      loadChats();
    }
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setExpandedChat(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Дата неизвестна';
    try {
      let date = new Date(dateString + 'Z');
      if (isNaN(date.getTime())) {
        date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Дата неизвестна';
      }
      
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Только что';
      if (diffMins < 60) return `${diffMins} мин назад`;
      if (diffHours < 24) return `${diffHours} ч назад`;
      if (diffDays < 7) return `${diffDays} дн назад`;
      
      return date.toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Дата неизвестна';
    }
  };

  const getModeIcon = (mode) => {
    return mode === 'fast' 
      ? <FiZap size={22} />
      : <FiCpu size={22} />;
  };

  const getModeText = (mode) => mode === 'fast' ? 'Быстрый' : 'Умный';

  const filteredChats = chats.filter(chat =>
    chat.query && chat.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDisplayTagName = (tag) => {
    const displayMap = {
      'free': 'Бесплатно',
      'freemium': 'Подписка',
      'paid': 'Платно',
      'has_api': 'Есть API',
      'no_api': 'Нет API',
      'low': 'Низкая',
      'medium': 'Средняя',
      'high': 'Высокая'
    };
    return displayMap[tag] || tag;
  };

  const getComplexityColor = (tag) => {
    const colorMap = {
      'low': '#10b981',
      'medium': '#f59e0b',
      'high': '#ef4444'
    };
    return colorMap[tag] || 'var(--text-tertiary)';
  };

  const getPriceIcon = (priceType) => {
    switch(priceType) {
      case 'free': return <FiDollarSign size={12} color="#10b981" />;
      case 'freemium': return <FiDollarSign size={12} color="#8b5cf6" />;
      case 'paid': return <FiDollarSign size={12} color="#f59e0b" />;
      default: return <FiDollarSign size={12} />;
    }
  };

  const Pagination = () => {
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
        marginTop: '32px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => goToPage(1)}
          disabled={currentPage === 1}
          style={{
            padding: '8px 12px',
            background: 'var(--surface-tertiary)',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage === 1 ? 0.5 : 1,
            color: 'var(--text-primary)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FiChevronsLeft size={16} />
        </button>
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '8px 12px',
            background: 'var(--surface-tertiary)',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage === 1 ? 0.5 : 1,
            color: 'var(--text-primary)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FiChevronLeft size={16} />
        </button>
        
        {pages.map(page => (
          <button
            key={page}
            onClick={() => goToPage(page)}
            style={{
              padding: '8px 14px',
              background: currentPage === page 
                ? 'var(--accent-blue)'
                : 'var(--surface-tertiary)',
              border: '1px solid var(--border-medium)',
              borderRadius: '8px',
              cursor: 'pointer',
              color: currentPage === page ? 'white' : 'var(--text-primary)',
              fontWeight: currentPage === page ? 600 : 400,
              transition: 'all 0.2s'
            }}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 12px',
            background: 'var(--surface-tertiary)',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage === totalPages ? 0.5 : 1,
            color: 'var(--text-primary)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FiChevronRight size={16} />
        </button>
        <button
          onClick={() => goToPage(totalPages)}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 12px',
            background: 'var(--surface-tertiary)',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage === totalPages ? 0.5 : 1,
            color: 'var(--text-primary)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FiChevronsRight size={16} />
        </button>
      </div>
    );
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
            <FiClock size={isMobile ? 28 : 40} color="var(--accent-blue)" />
          </div>
          <h1 className="gradient-text" style={{ 
            marginBottom: 0,
            fontSize: isMobile ? '28px' : '48px',
            color: 'var(--accent-blue)'
          }}>
            История
          </h1>
        </div>
        <p style={{ fontSize: isMobile ? '12px' : '16px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Все ваши предыдущие запросы и результаты
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
            Войдите в аккаунт, чтобы сохранять историю запросов
          </div>
        </div>
      ) : (
        <>
          {/* Поиск по истории */}
          <div style={{ marginBottom: '32px', maxWidth: '400px', margin: '0 auto' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--surface-tertiary)',
              borderRadius: '48px',
              padding: '4px 16px',
              border: '1px solid var(--border-medium)',
              transition: 'all 0.2s',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <FiSearch size={18} style={{ color: 'var(--text-tertiary)', marginRight: '12px' }} />
              <input
                type="text"
                placeholder={isMobile ? "Поиск..." : "Поиск по запросам..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  padding: '14px 0',
                  fontSize: '15px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-tertiary)',
                    fontSize: '18px',
                    padding: '4px',
                    borderRadius: '50%',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--accent-blue)';
                    e.currentTarget.style.background = 'var(--surface-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-tertiary)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <FiX size={16} />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="results-section">
              <div className="results-header" style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
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
                <div style={{ 
                  width: '100px', 
                  height: '13px', 
                  background: 'var(--surface-tertiary)', 
                  borderRadius: '6px',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }} />
              </div>
              <ChatListSkeleton count={5} />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FiInbox size={64} stroke="var(--text-tertiary)" strokeWidth={1.5} />
              </div>
              <div className="empty-state-text">
                {searchTerm ? 'Ничего не найдено' : 'История пока пуста'}
              </div>
              {!searchTerm && (
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
                  <FiChevronRight size={16} />
                  <span>Сделать первый запрос</span>
                </a>
              )}
            </div>
          ) : (
            <div className="results-section">
              <div className="results-header" style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '0 0 20px 0',
                borderBottom: '1px solid var(--border-medium)',
                marginBottom: '20px'
              }}>
                <span style={{ fontWeight: 500 }}>
                  Всего запросов: {totalItems}
                  {searchTerm && ` (найдено на этой странице: ${filteredChats.length})`}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                  Страница {currentPage} из {totalPages}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredChats.map((chat) => (
                  <div 
                    key={chat.id} 
                    style={{
                      background: 'var(--surface-secondary)',
                      borderRadius: '20px',
                      padding: '20px',
                      boxShadow: 'var(--shadow-sm)',
                      border: '1px solid var(--border-medium)',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-blue)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-medium)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }}
                    onClick={() => setExpandedChat(expandedChat === chat.id ? null : chat.id)}
                  >
                    {/* Основная информация */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start', 
                      flexWrap: 'wrap', 
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '14px',
                          background: chat.mode === 'fast' 
                            ? 'rgba(90, 156, 255, 0.15)'
                            : 'rgba(154, 140, 255, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: chat.mode === 'fast' ? 'var(--accent-blue)' : 'var(--accent-purple)',
                          border: '1px solid var(--border-medium)'
                        }}>
                          {getModeIcon(chat.mode)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontWeight: 600, 
                            color: 'var(--text-primary)', 
                            marginBottom: '8px',
                            fontSize: '16px',
                            lineHeight: '1.4',
                            textAlign: 'left'
                          }}>
                            {chat.query && chat.query.length > 80 ? chat.query.substring(0, 80) + '...' : chat.query || 'Без запроса'}
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            flexWrap: 'wrap'
                          }}>
                            <span style={{ 
                              fontSize: '12px', 
                              padding: '4px 12px', 
                              borderRadius: '30px',
                              background: chat.mode === 'fast' 
                                ? 'rgba(90, 156, 255, 0.15)'
                                : 'rgba(154, 140, 255, 0.15)',
                              color: chat.mode === 'fast' ? 'var(--accent-blue)' : 'var(--accent-purple)',
                              fontWeight: 500
                            }}>
                              {getModeText(chat.mode)}
                            </span>
                            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                              {formatDate(chat.created_at)}
                            </span>
                            {chat.results && (
                              <span style={{ 
                                fontSize: '12px', 
                                color: 'var(--text-tertiary)',
                                background: 'var(--surface-tertiary)',
                                padding: '4px 10px',
                                borderRadius: '30px',
                                border: '1px solid var(--border-subtle)'
                              }}>
                                {chat.results.length} результатов
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedChat(expandedChat === chat.id ? null : chat.id);
                          }}
                          style={{
                            background: 'var(--surface-tertiary)',
                            border: '1px solid var(--border-medium)',
                            cursor: 'pointer',
                            color: 'var(--text-tertiary)',
                            padding: '8px',
                            borderRadius: '10px',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--surface-secondary)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                            e.currentTarget.style.borderColor = 'var(--accent-blue)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--surface-tertiary)';
                            e.currentTarget.style.color = 'var(--text-tertiary)';
                            e.currentTarget.style.borderColor = 'var(--border-medium)';
                          }}
                        >
                          {expandedChat === chat.id ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(chat.id);
                          }}
                          style={{
                            background: 'var(--surface-tertiary)',
                            border: '1px solid var(--border-medium)',
                            cursor: 'pointer',
                            color: 'var(--text-tertiary)',
                            padding: '8px',
                            borderRadius: '10px',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--accent-red)';
                            e.currentTarget.style.background = 'rgba(224, 96, 96, 0.1)';
                            e.currentTarget.style.borderColor = 'var(--accent-red)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--text-tertiary)';
                            e.currentTarget.style.background = 'var(--surface-tertiary)';
                            e.currentTarget.style.borderColor = 'var(--border-medium)';
                          }}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Фильтры (если были) */}
                    {chat.filters && chat.filters.length > 0 && (
                      <div style={{ 
                        marginTop: '14px', 
                        paddingTop: '14px', 
                        borderTop: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-tertiary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <FiFilter size={12} />
                          <span>Фильтры:</span>
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {chat.filters.map((filter, idx) => {
                            const isComplexity = filter === 'low' || filter === 'medium' || filter === 'high';
                            return (
                              <span key={idx} style={{
                                background: 'var(--surface-tertiary)',
                                padding: '4px 12px',
                                borderRadius: '30px',
                                fontSize: '12px',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                border: '1px solid var(--border-subtle)'
                              }}>
                                {isComplexity && (
                                  <FiActivity size={10} color={getComplexityColor(filter)} />
                                )}
                                {getDisplayTagName(filter)}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Результаты (развёрнуто) */}
                    {expandedChat === chat.id && chat.results && chat.results.length > 0 && (
                      <div style={{ 
                        marginTop: '16px', 
                        paddingTop: '16px', 
                        borderTop: '1px solid var(--border-subtle)'
                      }}>
                        <div style={{ 
                          fontSize: '13px', 
                          fontWeight: 500,
                          color: 'var(--text-secondary)', 
                          marginBottom: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <FiBox size={14} />
                          <span>Найденные нейросети:</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {chat.results.slice(0, 5).map((net, idx) => (
                            <div key={idx} style={{
                              padding: '12px 16px',
                              background: 'var(--surface-tertiary)',
                              borderRadius: '14px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '10px',
                              transition: 'all 0.2s',
                              border: '1px solid var(--border-subtle)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--surface-secondary)';
                              e.currentTarget.style.borderColor = 'var(--accent-blue)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'var(--surface-tertiary)';
                              e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            }}>
                              <a 
                                href={net.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{
                                  color: 'var(--accent-blue)',
                                  textDecoration: 'none',
                                  fontWeight: 500,
                                  fontSize: '14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                              >
                                <FiLink size={14} />
                                {net.name}
                              </a>
                              <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                <span>{getPriceIcon(net.price_type)}</span>
                                <span>
                                  <FiActivity size={12} color={getComplexityColor(net.complexity)} />
                                </span>
                                {net.has_api && <FiCpu size={12} />}
                              </div>
                            </div>
                          ))}
                          {chat.results.length > 5 && (
                            <div style={{ 
                              fontSize: '12px', 
                              color: 'var(--text-tertiary)', 
                              textAlign: 'center',
                              padding: '10px',
                              background: 'var(--surface-tertiary)',
                              borderRadius: '14px',
                              border: '1px solid var(--border-subtle)'
                            }}>
                              + ещё {chat.results.length - 5} нейросетей
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Пагинация */}
              {totalPages > 1 && <Pagination />}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HistoryPage;