export const getApiBase = () => {
  const hostname = window.location.hostname;
  // Если открыто не через localhost (телефон или другой компьютер)
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:8080`;
  }
  return 'http://localhost:8080';
};

const API_BASE = getApiBase();

console.log('API_BASE:', API_BASE);

export const getToken = () => {
  return localStorage.getItem('access_token');
};

export const setToken = (token) => {
  console.log("setToken called with:", token ? "token present" : "null");
  
  if (token) {
    localStorage.setItem('access_token', token);
    console.log("Token saved to localStorage");
  } else {
    localStorage.removeItem('access_token');
    console.log("Token removed from localStorage");
  }
};

export const clearToken = () => {
  localStorage.removeItem('access_token');
  console.log("Token cleared");
};

export const getUserFromToken = () => {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (e) {
    console.error("Error parsing token:", e);
    return null;
  }
};

const authFetch = async (url, options = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  
  if (response.status === 401) {
    clearToken();
  }
  
  return response;
};

export const api = {
  // ========== GOOGLE OAuth ==========
  googleLogin: () => {
    window.location.href = `${API_BASE}/auth/google/login`;
  },

  getCurrentUser: async () => {
    try {
      const token = getToken();
      if (!token) return null;
      
      const response = await authFetch('/auth/me');
      if (!response.ok) return null;
      
      return await response.json();
    } catch (error) {
      console.error('Ошибка получения пользователя:', error);
      return null;
    }
  },

  logout: async () => {
    try {
      await authFetch('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Ошибка выхода:', error);
    }
    clearToken();
  },

  // ========== Нейросети ==========
  getNeuralNets: async (limit = 50, skip = 0) => {
    try {
      const response = await fetch(`${API_BASE}/neural_nets/list?limit=${limit}&skip=${skip}`);
      if (!response.ok) {
        console.error('Ошибка загрузки нейросетей:', response.status);
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Ошибка:', error);
      return [];
    }
  },

  filterByTags: async (tags) => {
    const response = await fetch(`${API_BASE}/neural_nets/filter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    });
    return response.json();
  },

  filterByWeightedTags: async (weightedTags) => {
    try {
      const response = await fetch(`${API_BASE}/neural_nets/filter_weighted`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: weightedTags })
      });
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Ошибка фильтрации по весам:', error);
      return [];
    }
  },

  getNeuralNetById: async (id) => {
    const response = await fetch(`${API_BASE}/neural_nets/${id}`);
    return response.json();
  },

  getAllTags: async () => {
    const response = await fetch(`${API_BASE}/neural_nets/tags`);
    return response.json();
  },

  // ========== Избранное ==========
  getFavorites: async () => {
    try {
      const token = getToken();
      if (!token) return [];
      
      const response = await authFetch('/favorites/');
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Ошибка загрузки избранного:', error);
      return [];
    }
  },

  addToFavorites: async (id) => {
    const response = await authFetch(`/favorites/${id}`, { method: 'POST' });
    return response.json();
  },

  removeFromFavorites: async (id) => {
    const response = await authFetch(`/favorites/${id}`, { method: 'DELETE' });
    return response.json();
  },

  // ========== Ollama ==========
  extractTags: async (query) => {
    try {
      const response = await fetch(`${API_BASE}/internal/extract_tags_weighted?query=${encodeURIComponent(query)}`);
      if (!response.ok) return { tags: {} };
      const data = await response.json();
      return { tags: data.tags || {} };
    } catch (error) {
      console.error('Ошибка извлечения тегов:', error);
      return { tags: {} };
    }
  },

  // ========== Чаты ==========
  saveChat: async (mode, query, filters, results) => {
    console.log("=== saveChat called ===");
    
    const token = localStorage.getItem('access_token');
    console.log("Token from localStorage:", token ? "present" : "null");
    
    if (!token) {
      console.log('❌ Нет токена, чат не сохранен');
      return { id: -1, mode, query, filters, results, created_at: new Date().toISOString() };
    }
    
    try {
      const response = await fetch(`${API_BASE}/chats/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mode, query, filters, results }),
        credentials: 'include',
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Ошибка:', response.status, errorText);
        return null;
      }
      
      const data = await response.json();
      console.log("✅ Чат сохранен, id:", data.id);
      return data;
    } catch (error) {
      console.error('❌ Ошибка:', error);
      return null;
    }
  },

  getChats: async (page = 1, limit = 50) => {
    try {
      const token = getToken();
      if (!token) return { chats: [], total: 0, page: 1, total_pages: 0 };
      
      const response = await authFetch(`/chats/?page=${page}&limit=${limit}`);
      if (!response.ok) return { chats: [], total: 0, page: 1, total_pages: 0 };
      return await response.json();
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
      return { chats: [], total: 0, page: 1, total_pages: 0 };
    }
  },

  // Для графика - получаем все чаты
  getAllChatsForStats: async () => {
    try {
      const token = getToken();
      if (!token) return [];
      
      const response = await authFetch('/chats/all');
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      return [];
    }
  },

  getChatById: async (id) => {
    const token = getToken();
    if (!token) return null;
    
    const response = await authFetch(`/chats/${id}`);
    if (!response.ok) return null;
    return response.json();
  },

  deleteChat: async (id) => {
    const token = getToken();
    if (!token) return { message: 'Чат не удален', deleted: false };
    
    const response = await authFetch(`/chats/${id}`, { method: 'DELETE' });
    return response.json();
  },
};