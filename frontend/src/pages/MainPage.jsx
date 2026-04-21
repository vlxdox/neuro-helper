import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import FilterChips from '../components/FilterChips';
import NeuralCards from '../components/NeuralCards';
import { 
  FiTag, 
  FiFilter, 
  FiSearch, 
  FiZap, 
  FiCpu,
  FiLoader, 
  FiX, 
  FiChevronDown, 
  FiChevronUp,
  FiTarget,
  FiList,
  FiDollarSign,
  FiLink,
  FiBarChart2,
  FiSearch as FiSearchIcon
} from 'react-icons/fi';

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
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--surface-tertiary)' }} />
      <div style={{ flex: 1, height: '16px', background: 'var(--surface-tertiary)', borderRadius: '8px' }} />
      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--surface-tertiary)' }} />
    </div>
    <div style={{ marginBottom: '12px' }}>
      <div style={{ height: '13px', background: 'var(--surface-tertiary)', borderRadius: '6px', marginBottom: '6px' }} />
      <div style={{ height: '13px', background: 'var(--surface-tertiary)', borderRadius: '6px', marginBottom: '6px' }} />
      <div style={{ height: '13px', background: 'var(--surface-tertiary)', borderRadius: '6px', width: '70%' }} />
    </div>
    <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
      <div style={{ width: '60px', height: '24px', background: 'var(--surface-tertiary)', borderRadius: '16px' }} />
      <div style={{ width: '80px', height: '24px', background: 'var(--surface-tertiary)', borderRadius: '16px' }} />
      <div style={{ width: '40px', height: '24px', background: 'var(--surface-tertiary)', borderRadius: '16px' }} />
    </div>
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

const MainPage = ({ user }) => {
  const [mode, setMode] = useState('fast');
  const [query, setQuery] = useState('');
  const [manualTags, setManualTags] = useState([]);
  const [autoTags, setAutoTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [neuralNets, setNeuralNets] = useState([]);
  const [originalNets, setOriginalNets] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const [showManualFilterMenu, setShowManualFilterMenu] = useState(false);
  const [showResultFilterMenu, setShowResultFilterMenu] = useState(false);
  
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  const [resultFilters, setResultFilters] = useState([]);
  const [tempResultFilters, setTempResultFilters] = useState([]);
  const [tempManualTags, setTempManualTags] = useState([]);
  
  const [expandedSection, setExpandedSection] = useState(null);
  const [expandedResultSection, setExpandedResultSection] = useState(null);
  
  const [smartQuestions, setSmartQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [smartAnswers, setSmartAnswers] = useState({});
  
  const manualFilterMenuRef = useRef(null);
  const manualFilterButtonRef = useRef(null);
  const resultFilterMenuRef = useRef(null);
  const resultFilterButtonRef = useRef(null);
  const inputRef = useRef(null);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (showManualFilterMenu) setTempManualTags([...manualTags]);
  }, [showManualFilterMenu, manualTags]);

  useEffect(() => {
    if (showResultFilterMenu) setTempResultFilters([...resultFilters]);
  }, [showResultFilterMenu, resultFilters]);

  const getDisplayTagName = (tag) => {
    const displayMap = {
      'free': 'Бесплатно', 'freemium': 'Подписка', 'paid': 'Платно',
      'has_api': 'Есть API', 'no_api': 'Нет API',
      'low': 'Низкая', 'medium': 'Средняя', 'high': 'Высокая'
    };
    return displayMap[tag] || tag;
  };

  const getOriginalTagFromDisplay = (displayTag) => {
    const originalMap = {
      'Бесплатно': 'free', 'Freemium': 'freemium', 'Платно': 'paid',
      'Есть API': 'has_api', 'Нет API': 'no_api',
      'Низкая': 'low', 'Средняя': 'medium', 'Высокая': 'high'
    };
    return originalMap[displayTag] || displayTag;
  };

  const saveCurrentChat = async (queryText, appliedFilters, results, modeType) => {
    if (!queryText && appliedFilters.length === 0) return;
    if (!results || results.length === 0) return;
    
    try {
      const savedResults = results.map(net => ({
        id: net.id, name: net.name, description: net.description, url: net.url,
        price_type: net.price_type, complexity: net.complexity, has_api: net.has_api, tags: net.tags || []
      }));
      await api.saveChat(modeType, queryText, appliedFilters, savedResults);
    } catch (error) {
      console.error('❌ Ошибка сохранения чата:', error);
    }
  };

  const toggleSection = (section) => setExpandedSection(prev => prev === section ? null : section);
  const toggleResultSection = (section) => setExpandedResultSection(prev => prev === section ? null : section);

  const tagCategories = {
    taskTypes: {
      title: <span><FiList size={14} style={{ marginRight: '6px' }} />Тип задач</span>,
      tags: ['генерация текста', 'написание кода', 'анализ данных', 'генерация изображений', 'генерация видео', 'создание презентаций', 'генерация музыки', 'озвучка текста', '3d моделирование', 'обучение', 'математика']
    },
    price: {
      title: <span><FiDollarSign size={14} style={{ marginRight: '6px' }} />Цена</span>,
      tags: ['free', 'freemium', 'paid'],
      isSingleSelect: true,
      displayNames: { free: 'Бесплатно', freemium: 'Подписка', paid: 'Платно' }
    },
    api: {
      title: <span><FiLink size={14} style={{ marginRight: '6px' }} />API</span>,
      tags: ['has_api', 'no_api'],
      isSingleSelect: true,
      displayNames: { has_api: 'Есть', no_api: 'Нет' }
    },
    complexity: {
      title: <span><FiBarChart2 size={14} style={{ marginRight: '6px' }} />Сложность</span>,
      tags: ['low', 'medium', 'high'],
      isSingleSelect: true,
      displayNames: { low: 'Низкая', medium: 'Средняя', high: 'Высокая' }
    }
  };

  useEffect(() => { loadTags(); loadFavorites(); }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (manualFilterMenuRef.current && !manualFilterMenuRef.current.contains(event.target) &&
          manualFilterButtonRef.current && !manualFilterButtonRef.current.contains(event.target)) {
        setShowManualFilterMenu(false);
      }
    };
    if (showManualFilterMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showManualFilterMenu]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resultFilterMenuRef.current && !resultFilterMenuRef.current.contains(event.target) &&
          resultFilterButtonRef.current && !resultFilterButtonRef.current.contains(event.target)) {
        setShowResultFilterMenu(false);
      }
    };
    if (showResultFilterMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showResultFilterMenu]);

  useEffect(() => {
    document.body.style.overflow = (showManualFilterMenu || showResultFilterMenu) ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [showManualFilterMenu, showResultFilterMenu]);

  const loadTags = async () => {
    try { setAvailableTags(await api.getAllTags()); } catch (error) { console.error('Ошибка загрузки тегов:', error); }
  };

  const loadFavorites = async () => {
    try { setFavorites(await api.getFavorites()); } catch (error) { console.error('Ошибка загрузки избранного:', error); }
  };

  // ========== ФУНКЦИИ ДЛЯ РУЧНЫХ ТЕГОВ ==========
  const addTempManualTag = (tag) => {
    if (tempManualTags.includes(tag)) return;
    if (['free', 'freemium', 'paid'].includes(tag)) {
      setTempManualTags([...tempManualTags.filter(t => !['free', 'freemium', 'paid'].includes(t)), tag]);
    } else if (['has_api', 'no_api'].includes(tag)) {
      setTempManualTags([...tempManualTags.filter(t => t !== 'has_api' && t !== 'no_api'), tag]);
    } else if (['low', 'medium', 'high'].includes(tag)) {
      setTempManualTags([...tempManualTags.filter(t => !['low', 'medium', 'high'].includes(t)), tag]);
    } else {
      setTempManualTags([...tempManualTags, tag]);
    }
  };

  const removeTempManualTag = (tag) => setTempManualTags(tempManualTags.filter(t => t !== tag));
  const applyManualTags = () => {
    setManualTags([...tempManualTags]);
    setSelectedTags([...autoTags, ...tempManualTags]);
    setShowManualFilterMenu(false);
  };
  const resetManualTags = () => {
    setTempManualTags([]);
    setManualTags([]);
    setSelectedTags(autoTags);
    setShowManualFilterMenu(false);
  };

  // ========== ФУНКЦИИ ДЛЯ ФИЛЬТРОВ РЕЗУЛЬТАТОВ ==========
  const addTempResultFilter = (tag) => {
    if (tempResultFilters.includes(tag)) return;
    if (['free', 'freemium', 'paid'].includes(tag)) {
      setTempResultFilters([...tempResultFilters.filter(t => !['free', 'freemium', 'paid'].includes(t)), tag]);
    } else if (['has_api', 'no_api'].includes(tag)) {
      setTempResultFilters([...tempResultFilters.filter(t => t !== 'has_api' && t !== 'no_api'), tag]);
    } else if (['low', 'medium', 'high'].includes(tag)) {
      setTempResultFilters([...tempResultFilters.filter(t => !['low', 'medium', 'high'].includes(t)), tag]);
    } else {
      setTempResultFilters([...tempResultFilters, tag]);
    }
  };

  const removeTempResultFilter = (tag) => setTempResultFilters(tempResultFilters.filter(t => t !== tag));

  const applyResultFilters = () => {
    if (originalNets.length === 0) return;
    let filtered = [...originalNets];
    
    if (tempResultFilters.includes('free')) filtered = filtered.filter(n => n.price_type === 'free');
    else if (tempResultFilters.includes('freemium')) filtered = filtered.filter(n => n.price_type === 'freemium');
    else if (tempResultFilters.includes('paid')) filtered = filtered.filter(n => n.price_type === 'paid');
    
    if (tempResultFilters.includes('has_api')) filtered = filtered.filter(n => n.has_api === true);
    else if (tempResultFilters.includes('no_api')) filtered = filtered.filter(n => n.has_api === false);
    
    if (tempResultFilters.includes('low')) filtered = filtered.filter(n => n.complexity === 'low');
    else if (tempResultFilters.includes('medium')) filtered = filtered.filter(n => n.complexity === 'medium');
    else if (tempResultFilters.includes('high')) filtered = filtered.filter(n => n.complexity === 'high');
    
    const taskTags = tempResultFilters.filter(t => !['free', 'freemium', 'paid', 'has_api', 'no_api', 'low', 'medium', 'high'].includes(t));
    if (taskTags.length > 0) filtered = filtered.filter(n => taskTags.some(tag => n.tags && n.tags.includes(tag)));
    
    setResultFilters([...tempResultFilters]);
    setNeuralNets(filtered);
    setShowResultFilterMenu(false);
  };

  const resetResultFilters = () => {
    setTempResultFilters([]);
    setResultFilters([]);
    setNeuralNets(originalNets);
    setShowResultFilterMenu(false);
  };

  const removeResultFilter = (tag) => {
    const newFilters = resultFilters.filter(t => t !== tag);
    setResultFilters(newFilters);
    setTempResultFilters(newFilters);
    
    let filtered = [...originalNets];
    if (newFilters.includes('free')) filtered = filtered.filter(n => n.price_type === 'free');
    else if (newFilters.includes('freemium')) filtered = filtered.filter(n => n.price_type === 'freemium');
    else if (newFilters.includes('paid')) filtered = filtered.filter(n => n.price_type === 'paid');
    
    if (newFilters.includes('has_api')) filtered = filtered.filter(n => n.has_api === true);
    else if (newFilters.includes('no_api')) filtered = filtered.filter(n => n.has_api === false);
    
    if (newFilters.includes('low')) filtered = filtered.filter(n => n.complexity === 'low');
    else if (newFilters.includes('medium')) filtered = filtered.filter(n => n.complexity === 'medium');
    else if (newFilters.includes('high')) filtered = filtered.filter(n => n.complexity === 'high');
    
    const taskTags = newFilters.filter(t => !['free', 'freemium', 'paid', 'has_api', 'no_api', 'low', 'medium', 'high'].includes(t));
    if (taskTags.length > 0) filtered = filtered.filter(n => taskTags.some(tag => n.tags && n.tags.includes(tag)));
    
    setNeuralNets(filtered);
  };

  const handleFastSubmit = async () => {
    setResultFilters([]); setTempResultFilters([]);
    const currentManualTags = manualTags;
    if (!query.trim() && currentManualTags.length === 0) return;
    setLoading(true);
    
    if (query.trim() && isGreetingOrSmallTalk(query.trim())) { setNeuralNets([]); setOriginalNets([]); setShowResults(true); setLoading(false); return; }
    if (query.trim() && isGibberish(query.trim()) && currentManualTags.length === 0) { setNeuralNets([]); setOriginalNets([]); setShowResults(true); setLoading(false); return; }
    
    try {
      let weightedTags = {}, autoTagList = [];
      if (query.trim()) {
        try {
          const result = await api.extractTags(query);
          weightedTags = result.tags || {};
          autoTagList = Object.keys(weightedTags);
          setAutoTags(autoTagList);
          if (Object.keys(weightedTags).length === 0 && currentManualTags.length === 0) { setNeuralNets([]); setOriginalNets([]); setShowResults(true); setLoading(false); return; }
        } catch (e) {}
      }
      setSelectedTags([...currentManualTags, ...autoTagList]);
      
      let results = [];
      if (Object.keys(weightedTags).length > 0) results = await api.filterByWeightedTags(weightedTags);
      else if (autoTagList.length > 0) results = await api.filterByTags(autoTagList);
      else results = await api.getNeuralNets(500);
      
      let filteredResults = [...results];
      if (currentManualTags.includes('free')) filteredResults = filteredResults.filter(n => n.price_type === 'free');
      if (currentManualTags.includes('freemium')) filteredResults = filteredResults.filter(n => n.price_type === 'freemium');
      if (currentManualTags.includes('paid')) filteredResults = filteredResults.filter(n => n.price_type === 'paid');
      if (currentManualTags.includes('has_api')) filteredResults = filteredResults.filter(n => n.has_api === true);
      if (currentManualTags.includes('no_api')) filteredResults = filteredResults.filter(n => n.has_api === false);
      if (currentManualTags.includes('low')) filteredResults = filteredResults.filter(n => n.complexity === 'low');
      else if (currentManualTags.includes('medium')) filteredResults = filteredResults.filter(n => n.complexity === 'medium');
      else if (currentManualTags.includes('high')) filteredResults = filteredResults.filter(n => n.complexity === 'high');
      
      const taskTags = currentManualTags.filter(t => !['free', 'freemium', 'paid', 'has_api', 'no_api', 'low', 'medium', 'high'].includes(t));
      if (taskTags.length > 0) filteredResults = filteredResults.filter(n => taskTags.some(tag => n.tags && n.tags.includes(tag)));
      
      setOriginalNets(filteredResults);
      setNeuralNets(filteredResults);
      setShowResults(true);
      if (filteredResults.length > 0) await saveCurrentChat(query, currentManualTags, filteredResults, mode);
    } catch (error) { console.error('Ошибка:', error); }
    setLoading(false);
  };

  const handleSmartSubmit = async () => {
    if (!query.trim()) return;
    setResultFilters([]); setTempResultFilters([]);
    setLoading(true);
    try {
      const result = await api.extractTags(query);
      const weightedTags = result.tags || {};
      const extractedTags = Object.keys(weightedTags);
      if (extractedTags.length === 0) { setNeuralNets([]); setOriginalNets([]); setShowResults(true); setLoading(false); return; }
      setAutoTags(extractedTags); setSelectedTags(extractedTags);
      const results = await api.filterByWeightedTags(weightedTags);
      const filteredResults = Array.isArray(results) ? results : [];
      setOriginalNets(filteredResults); setNeuralNets(filteredResults);
      if (filteredResults.length > 0) {
        setSmartQuestions([
          { id: 'budget', text: 'Какой у вас бюджет?', options: ['Бесплатные', 'Подписка', 'Платные', 'Не важно'] },
          { id: 'complexity', text: 'Какой уровень сложности вам подходит?', options: ['Низкий', 'Средний', 'Высокий', 'Не важно'] },
          { id: 'api', text: 'Нужен ли API для интеграции?', options: ['Да', 'Нет', 'Не важно'] },
        ]);
        setCurrentQuestionIndex(0); setSmartAnswers({});
      }
      setShowResults(true);
    } catch (error) { console.error('Ошибка в умном режиме:', error); setNeuralNets([]); setOriginalNets([]); setShowResults(true); }
    setLoading(false);
  };

  const handleSmartAnswer = async (questionId, answer) => {
    const newAnswers = { ...smartAnswers, [questionId]: answer };
    setSmartAnswers(newAnswers);
    if (currentQuestionIndex + 1 < smartQuestions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      const filtered = applySmartFilters(originalNets, newAnswers);
      setNeuralNets(filtered);
      if (filtered.length > 0) await saveCurrentChat(query, manualTags, filtered, 'smart');
      setSmartQuestions([]);
    }
  };

  const applySmartFilters = (nets, answers) => {
    let filtered = [...nets];
    if (answers.budget && answers.budget !== 'Не важно') {
      if (answers.budget === 'Бесплатные') filtered = filtered.filter(n => n.price_type === 'free');
      else if (answers.budget === 'Freemium') filtered = filtered.filter(n => n.price_type === 'freemium');
      else if (answers.budget === 'Платные') filtered = filtered.filter(n => n.price_type === 'paid');
    }
    if (answers.complexity && answers.complexity !== 'Не важно') {
      if (answers.complexity === 'Низкий') filtered = filtered.filter(n => n.complexity === 'low');
      else if (answers.complexity === 'Средний') filtered = filtered.filter(n => n.complexity === 'medium');
      else if (answers.complexity === 'Высокий') filtered = filtered.filter(n => n.complexity === 'high');
    }
    if (answers.api && answers.api !== 'Не важно') filtered = filtered.filter(n => n.has_api === (answers.api === 'Да'));
    return filtered;
  };

  const isGreetingOrSmallTalk = (text) => {
    const greetings = ["привет", "здравствуй", "здравствуйте", "добрый день", "доброе утро", "добрый вечер", "доброй ночи", "hi", "hello", "hey", "good morning", "good afternoon", "good evening", "как дела", "как ты", "что делаешь", "как жизнь", "как сам", "как настроение", "чё делаешь", "пока", "до свидания", "bye", "goodbye", "спасибо", "благодарю", "thanks", "thank you", "пожалуйста", "извините", "простите"];
    const textLower = text.toLowerCase().trim();
    for (const g of greetings) if (textLower === g || textLower.startsWith(g)) return true;
    return textLower.length < 5 && !textLower.includes(' ');
  };

  const isGibberish = (text) => {
    if (!text || text.length < 3) return true;
    const cleanText = text.toLowerCase();
    const meaningfulWords = ["создать", "сделать", "написать", "разработать", "помоги", "нужно", "хочу", "проанализировать", "проверить", "нарисовать", "сгенерировать", "смоделировать", "объяснить", "научить", "решить", "посчитать", "сверстать", "подключить", "настроить", "собрать", "построить", "составить", "подготовить", "обработать", "сайт", "приложение", "бота", "программу", "код", "скрипт", "дизайн", "логотип", "баннер", "визитку", "презентацию", "отчет", "видео", "ролик", "анимацию", "музыку", "песню", "трек", "озвучку", "3d", "модель", "персонажа", "урок", "курс", "обучение", "лендинг", "crm", "форму", "придумать", "стих", "поздравление", "тост", "рассказ", "историю", "сценарий", "план", "идею", "название", "слоган"];
    for (const w of meaningfulWords) if (cleanText.includes(w)) return false;
    return true;
  };

  const handleAddTag = (tag) => { if (!manualTags.includes(tag)) { const newTags = [...manualTags, tag]; setManualTags(newTags); setSelectedTags([...autoTags, ...newTags]); } };
  const handleRemoveTag = (tag) => { const newTags = manualTags.filter(t => t !== tag); setManualTags(newTags); setSelectedTags([...autoTags, ...newTags]); };

  const handleToggleFavorite = async (id) => {
    const wasFavorite = favorites.includes(id);
    setFavorites(wasFavorite ? favorites.filter(f => f !== id) : [...favorites, id]);
    try { wasFavorite ? await api.removeFromFavorites(id) : await api.addToFavorites(id); }
    catch (error) { setFavorites(wasFavorite ? [...favorites, id] : favorites.filter(f => f !== id)); }
  };

  const handleReset = () => {
    setQuery(''); setManualTags([]); setAutoTags([]); setSelectedTags([]); setShowResults(false);
    setSmartQuestions([]); setNeuralNets([]); setOriginalNets([]); setShowManualFilterMenu(false);
    setShowResultFilterMenu(false); setResultFilters([]); setTempResultFilters([]); setTempManualTags([]);
  };

  // ========== RENDER ==========
  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: showResults ? 'auto' : '100vh', paddingTop: showResults ? '48px' : '0' }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      
      {/* Hero */}
      <div className="hero" style={{ marginBottom: showResults ? '32px' : '46px' }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '0' : '16px' }}>
          <div style={{ width: isMobile ? '48px' : '72px', height: isMobile ? '48px' : '72px', borderRadius: '16px', background: 'var(--surface-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: !isMobile ? 'translateY(14px)' : 'translateY(0)', border: '1px solid var(--border-medium)', marginBottom: isMobile ? '5px' : '0' }}>
            <img src="/logo.png" alt="Logo" style={{ width: isMobile ? '32px' : '52px', height: isMobile ? '32px' : '52px', borderRadius: '10px', objectFit: 'contain' }} />
          </div>
          <h1 className="gradient-text" style={{ marginBottom: 0, fontSize: isMobile ? '28px' : '48px', color: 'var(--accent-blue)', textAlign: 'center' }}>Нейро.Помощник</h1>
        </div>
        <p style={{ fontSize: isMobile ? '12px' : '16px', color: 'var(--text-secondary)', textAlign: 'center' }}>Навигатор по миру нейросетей</p>
      </div>
      
      {/* Чипсы */}
      {mode === 'fast' && manualTags.length > 0 && (
        <FilterChips tags={manualTags.map(t => getDisplayTagName(t))} onRemove={(d) => handleRemoveTag(getOriginalTagFromDisplay(d))} />
      )}
      
      {/* Поисковая строка */}
      <div className="input-card">
        <div className="input-row" style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '12px', flexWrap: 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-tertiary)', borderRadius: '40px', padding: '3px', marginRight: isMobile ? '0' : '8px', marginLeft: '-4px', position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: '3px', left: mode === 'fast' ? '3px' : 'calc(50% + 3px)', width: 'calc(50% - 6px)', height: 'calc(100% - 6px)', background: 'var(--accent-blue)', borderRadius: '32px', transition: 'left 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1)', pointerEvents: 'none', zIndex: 0 }} />
            <button onClick={() => { setMode('fast'); handleReset(); }} disabled={loading} style={{ position: 'relative', zIndex: 1, padding: isMobile ? '6px 0' : '8px 16px', borderRadius: '32px', border: 'none', background: 'transparent', color: mode === 'fast' ? 'white' : 'var(--text-secondary)', cursor: loading ? 'not-allowed' : 'pointer', fontSize: isMobile ? '12px' : '14px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '0' : '4px', opacity: loading ? 0.5 : 1, whiteSpace: 'nowrap', width: isMobile ? '36px' : 'auto', minWidth: isMobile ? '36px' : 'auto' }}>
              <FiZap size={isMobile ? 14 : 16} style={{ marginRight: !isMobile ? '2px' : '0', transform: !isMobile ? 'translateX(-5px)' : 'translateX(-2px)' }} />{!isMobile && <span style={{ transform: !isMobile ? 'translateX(-5px)' : 'none' }}>Быстрый</span>}
            </button>
            <button onClick={() => { setMode('smart'); handleReset(); }} disabled={loading} style={{ position: 'relative', zIndex: 1, padding: isMobile ? '6px 0' : '8px 16px', borderRadius: '32px', border: 'none', background: 'transparent', color: mode === 'smart' ? 'white' : 'var(--text-secondary)', cursor: loading ? 'not-allowed' : 'pointer', fontSize: isMobile ? '12px' : '14px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '0' : '6px', opacity: loading ? 0.5 : 1, whiteSpace: 'nowrap', width: isMobile ? '36px' : 'auto', minWidth: isMobile ? '36px' : 'auto' }}>
              <FiCpu size={isMobile ? 14 : 16} style={{ marginRight: !isMobile ? '2px' : '0', transform: isMobile ? 'translateX(2px)' : 'none' }} />{!isMobile && <span>Умный</span>}
            </button>
          </div>
          
          <input ref={inputRef} type="text" className="input-field" placeholder={!isMobile ? "Опишите вашу задачу..." : "Опишите задачу..."} value={query} onChange={(e) => setQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !loading && (mode === 'fast' ? handleFastSubmit() : handleSmartSubmit())} disabled={loading} style={{ opacity: loading ? 0.6 : 1, flex: 1, minWidth: 0, fontSize: isMobile ? '14px' : '16px', padding: isMobile ? '12px 4px' : '16px 8px' }} />
          
          {mode === 'fast' && (
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button ref={manualFilterButtonRef} className="round-btn filter-btn" onClick={() => setShowManualFilterMenu(!showManualFilterMenu)} title="Выбрать теги" disabled={loading} style={{ opacity: loading ? 0.5 : 1, width: isMobile ? '36px' : '48px', height: isMobile ? '36px' : '48px', fontSize: isMobile ? '16px' : '20px' }}>
                <FiTag size={isMobile ? 16 : 20} />
              </button>
            </div>
          )}
          
          <button className="round-btn primary" onClick={mode === 'fast' ? handleFastSubmit : handleSmartSubmit} disabled={loading} style={{ opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer', flexShrink: 0, width: isMobile ? '36px' : '48px', height: isMobile ? '36px' : '48px', fontSize: isMobile ? '16px' : '20px', boxShadow: 'none' }}>
            {loading ? <FiLoader size={isMobile ? 16 : 20} /> : <FiSearch size={isMobile ? 16 : 20} />}
          </button>
        </div>
      </div>
      
      {/* Загрузка */}
      {loading && (
        <div className="results-section" style={{ marginTop: '24px' }}>
          <div className="results-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0 20px 0', borderBottom: '1px solid var(--border-medium)', marginBottom: '20px' }}>
            <div style={{ width: '150px', height: '20px', background: 'var(--surface-tertiary)', borderRadius: '10px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ width: '100px', height: '20px', background: 'var(--surface-tertiary)', borderRadius: '10px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
          <NeuralCardsSkeleton count={6} />
        </div>
      )}
      
      {/* Умный режим */}
      {mode === 'smart' && smartQuestions.length > 0 && currentQuestionIndex < smartQuestions.length && (
        <div className="assistant-card">
          <div className="assistant-question"><FiCpu size={28} style={{ marginRight: '8px' }} />{smartQuestions[currentQuestionIndex].text}</div>
          <div className="assistant-options">{smartQuestions[currentQuestionIndex].options.map(opt => <button key={opt} className="assistant-option" onClick={() => handleSmartAnswer(smartQuestions[currentQuestionIndex].id, opt)}>{opt}</button>)}</div>
        </div>
      )}
      
      {/* Результаты */}
      {showResults && !loading && (
        <div className="results-section">
          <div className="results-header" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 0 20px 0', borderBottom: '1px solid var(--border-medium)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span style={{ fontWeight: 500 }}>Найдено нейросетей: {neuralNets.length}</span>
              {mode === 'fast' && (
                <button ref={resultFilterButtonRef} onClick={() => setShowResultFilterMenu(!showResultFilterMenu)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: resultFilters.length > 0 ? 'var(--accent-blue)' : 'var(--surface-tertiary)', border: '1px solid var(--border-medium)', borderRadius: '30px', fontSize: '13px', cursor: 'pointer', color: resultFilters.length > 0 ? 'white' : 'var(--text-secondary)', transition: 'all 0.2s', flexShrink: 0 }}>
                  <FiFilter size={14} /><span>Фильтры {resultFilters.length > 0 && `(${resultFilters.length})`}</span>
                </button>
              )}
            </div>
            {resultFilters.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignSelf: 'flex-start' }}>
                {resultFilters.map(filter => (
                  <span key={filter} style={{ background: 'var(--accent-blue)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {getDisplayTagName(filter)}<span onClick={() => removeResultFilter(filter)} style={{ cursor: 'pointer', fontSize: '14px' }}><FiX size={12} /></span>
                  </span>
                ))}
              </div>
            )}
          </div>
          {neuralNets.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon"><FiSearchIcon size={48} strokeWidth={1.5} /></div><div className="empty-state-text">Ничего не найдено. Попробуйте изменить запрос или фильтры.</div></div>
          ) : (
            <NeuralCards neuralNets={neuralNets} favorites={favorites} onToggleFavorite={handleToggleFavorite} isLoggedIn={user.isLoggedIn} />
          )}
        </div>
      )}

      {/* Модалка ручных фильтров */}
      {showManualFilterMenu && (
        <>
          <div onClick={() => setShowManualFilterMenu(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999998 }} />
          <div ref={manualFilterMenuRef} style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--surface-secondary)', borderRadius: '24px', padding: '24px', boxShadow: 'var(--shadow-lg)', width: isMobile ? '90%' : '450px', maxWidth: '500px', maxHeight: '80vh', overflow: 'auto', border: '1px solid var(--border-medium)', zIndex: 9999999 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-medium)' }}>
              <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}><FiTarget size={18} />Выбор тегов</h4>
              <button onClick={() => setShowManualFilterMenu(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}><FiX size={18} /></button>
            </div>
            {tempManualTags.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Выбрано:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {tempManualTags.map(tag => (
                    <span key={tag} style={{ background: 'rgba(90, 156, 255, 0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)' }}>
                      {getDisplayTagName(tag)}<span onClick={() => removeTempManualTag(tag)} style={{ cursor: 'pointer' }}><FiX size={10} /></span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {(() => {
              const renderSection = (sectionKey, section) => {
                const isExpanded = expandedSection === sectionKey;
                const filters = tempManualTags;
                
                if (section.isSingleSelect) {
                  return (
                    <div style={{ marginBottom: '12px' }}>
                      <div onClick={() => toggleSection(sectionKey)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 500, fontSize: '14px' }}>
                        <span>{section.title}</span><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isExpanded ? <FiChevronDown size={12} /> : <FiChevronUp size={12} />}</span>
                      </div>
                      {isExpanded && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', marginBottom: '8px', paddingLeft: '8px' }}>
                          {section.tags.map(tag => {
                            const displayName = section.displayNames?.[tag] || tag;
                            const isActive = filters.includes(tag);
                            return (
                              <button key={tag} onClick={() => { if (isActive) removeTempManualTag(tag); else { if (section.isSingleSelect) section.tags.forEach(t => { if (filters.includes(t)) removeTempManualTag(t); }); addTempManualTag(tag); } }} style={{ padding: '6px 14px', background: isActive ? 'var(--accent-blue)' : 'var(--surface-tertiary)', border: 'none', borderRadius: '30px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', color: isActive ? 'white' : 'var(--text-secondary)' }}>
                                {displayName}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
                
                return (
                  <div style={{ marginBottom: '12px' }}>
                    <div onClick={() => toggleSection(sectionKey)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 500, fontSize: '14px' }}>
                      <span>{section.title}</span><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isExpanded ? <FiChevronDown size={12} /> : <FiChevronUp size={12} />}</span>
                    </div>
                    {isExpanded && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', marginBottom: '8px', paddingLeft: '8px' }}>
                        {section.tags.map(tag => {
                          const isActive = filters.includes(tag);
                          return <button key={tag} onClick={() => isActive ? removeTempManualTag(tag) : addTempManualTag(tag)} style={{ padding: '6px 14px', background: isActive ? 'var(--accent-blue)' : 'var(--surface-tertiary)', border: 'none', borderRadius: '30px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', color: isActive ? 'white' : 'var(--text-secondary)' }}>{tag}</button>;
                        })}
                      </div>
                    )}
                  </div>
                );
              };
              
              return (
                <>
                  {renderSection('taskTypes', tagCategories.taskTypes)}
                  {renderSection('price', tagCategories.price)}
                  {renderSection('api', tagCategories.api)}
                  {renderSection('complexity', tagCategories.complexity)}
                </>
              );
            })()}
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={resetManualTags} style={{ flex: 1, padding: '10px', background: 'none', border: '1px solid var(--border-medium)', borderRadius: '30px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-secondary)' }}>Сбросить</button>
              <button onClick={applyManualTags} style={{ flex: 1, padding: '10px', background: 'var(--accent-blue)', border: 'none', borderRadius: '30px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: 'white' }}>Применить</button>
            </div>
          </div>
        </>
      )}

      {/* Модалка фильтров результатов */}
      {showResultFilterMenu && (
        <>
          <div onClick={() => setShowResultFilterMenu(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999998 }} />
          <div ref={resultFilterMenuRef} style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--surface-secondary)', borderRadius: '24px', padding: '24px', boxShadow: 'var(--shadow-lg)', width: isMobile ? '90%' : '450px', maxWidth: '500px', maxHeight: '80vh', overflow: 'auto', border: '1px solid var(--border-medium)', zIndex: 9999999 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-medium)' }}>
              <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}><FiTarget size={18} />Фильтры результатов</h4>
              <button onClick={() => setShowResultFilterMenu(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}><FiX size={18} /></button>
            </div>
            {tempResultFilters.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Выбрано:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {tempResultFilters.map(tag => (
                    <span key={tag} style={{ background: 'rgba(90, 156, 255, 0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)' }}>
                      {getDisplayTagName(tag)}<span onClick={() => removeTempResultFilter(tag)} style={{ cursor: 'pointer' }}><FiX size={10} /></span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {(() => {
              const renderSection = (sectionKey, section) => {
                const isExpanded = expandedResultSection === sectionKey;
                const filters = tempResultFilters;
                
                if (section.isSingleSelect) {
                  return (
                    <div style={{ marginBottom: '12px' }}>
                      <div onClick={() => toggleResultSection(sectionKey)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 500, fontSize: '14px' }}>
                        <span>{section.title}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isExpanded ? <FiChevronDown size={12} /> : <FiChevronUp size={12} />}</span>
                      </div>
                      {isExpanded && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', marginBottom: '8px', paddingLeft: '8px' }}>
                          {section.tags.map(tag => {
                            const displayName = section.displayNames?.[tag] || tag;
                            const isActive = filters.includes(tag);
                            return (
                              <button 
                                key={tag} 
                                onClick={() => { 
                                  if (isActive) {
                                    removeTempResultFilter(tag); 
                                  } else { 
                                    if (section.isSingleSelect) {
                                      section.tags.forEach(t => { if (filters.includes(t)) removeTempResultFilter(t); });
                                    }
                                    addTempResultFilter(tag); 
                                  } 
                                }} 
                                style={{ 
                                  padding: '6px 14px', 
                                  background: isActive ? 'var(--accent-blue)' : 'var(--surface-tertiary)', 
                                  border: 'none', 
                                  borderRadius: '30px', 
                                  fontSize: '12px', 
                                  fontWeight: 500, 
                                  cursor: 'pointer', 
                                  transition: 'all 0.2s', 
                                  color: isActive ? 'white' : 'var(--text-secondary)' 
                                }}
                              >
                                {displayName}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
                
                return (
                  <div style={{ marginBottom: '12px' }}>
                    <div onClick={() => toggleResultSection(sectionKey)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 500, fontSize: '14px' }}>
                      <span>{section.title}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isExpanded ? <FiChevronDown size={12} /> : <FiChevronUp size={12} />}</span>
                    </div>
                    {isExpanded && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', marginBottom: '8px', paddingLeft: '8px' }}>
                        {section.tags.map(tag => {
                          const isActive = filters.includes(tag);
                          return (
                            <button 
                              key={tag} 
                              onClick={() => isActive ? removeTempResultFilter(tag) : addTempResultFilter(tag)} 
                              style={{ 
                                padding: '6px 14px', 
                                background: isActive ? 'var(--accent-blue)' : 'var(--surface-tertiary)', 
                                border: 'none', 
                                borderRadius: '30px', 
                                fontSize: '12px', 
                                fontWeight: 500, 
                                cursor: 'pointer', 
                                transition: 'all 0.2s', 
                                color: isActive ? 'white' : 'var(--text-secondary)' 
                              }}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              };
              
              return (
                <>
                  {renderSection('taskTypes', tagCategories.taskTypes)}
                  {renderSection('price', tagCategories.price)}
                  {renderSection('api', tagCategories.api)}
                  {renderSection('complexity', tagCategories.complexity)}
                </>
              );
            })()}
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={resetResultFilters} style={{ flex: 1, padding: '10px', background: 'none', border: '1px solid var(--border-medium)', borderRadius: '30px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-secondary)' }}>Сбросить</button>
              <button onClick={applyResultFilters} style={{ flex: 1, padding: '10px', background: 'var(--accent-blue)', border: 'none', borderRadius: '30px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: 'white' }}>Применить</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ РЕНДЕРА ==========
const renderManualFilterSection = (sectionKey, section, expandedSection, toggleSection, tempManualTags, addTempManualTag, removeTempManualTag) => {
  const isExpanded = expandedSection === sectionKey;
  const filters = tempManualTags;
  const addFilter = addTempManualTag;
  const removeFilter = removeTempManualTag;
  
  if (section.isSingleSelect) {
    return (
      <div style={{ marginBottom: '12px' }}>
        <div onClick={() => toggleSection(sectionKey)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 500, fontSize: '14px' }}>
          <span>{section.title}</span><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isExpanded ? <FiChevronDown size={12} /> : <FiChevronUp size={12} />}</span>
        </div>
        {isExpanded && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', marginBottom: '8px', paddingLeft: '8px' }}>
            {section.tags.map(tag => {
              const displayName = section.displayNames?.[tag] || tag;
              const isActive = filters.includes(tag);
              return (
                <button key={tag} onClick={() => { if (isActive) removeFilter(tag); else { if (section.isSingleSelect) section.tags.forEach(t => { if (filters.includes(t)) removeFilter(t); }); addFilter(tag); } }} style={{ padding: '6px 14px', background: isActive ? 'var(--accent-blue)' : 'var(--surface-tertiary)', border: 'none', borderRadius: '30px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', color: isActive ? 'white' : 'var(--text-secondary)' }}>
                  {displayName}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div style={{ marginBottom: '12px' }}>
      <div onClick={() => toggleSection(sectionKey)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 500, fontSize: '14px' }}>
        <span>{section.title}</span><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isExpanded ? <FiChevronDown size={12} /> : <FiChevronUp size={12} />}</span>
      </div>
      {isExpanded && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', marginBottom: '8px', paddingLeft: '8px' }}>
          {section.tags.map(tag => {
            const isActive = filters.includes(tag);
            return <button key={tag} onClick={() => isActive ? removeFilter(tag) : addFilter(tag)} style={{ padding: '6px 14px', background: isActive ? 'var(--accent-blue)' : 'var(--surface-tertiary)', border: 'none', borderRadius: '30px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', color: isActive ? 'white' : 'var(--text-secondary)' }}>{tag}</button>;
          })}
        </div>
      )}
    </div>
  );
};

const renderResultFilterSection = (sectionKey, section, expandedResultSection, toggleResultSection, tempResultFilters, addTempResultFilter, removeTempResultFilter) => {
  const isExpanded = expandedResultSection === sectionKey;
  const filters = tempResultFilters;
  const addFilter = addTempResultFilter;
  const removeFilter = removeTempResultFilter;
  
  if (section.isSingleSelect) {
    return (
      <div style={{ marginBottom: '12px' }}>
        <div onClick={() => toggleResultSection(sectionKey)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 500, fontSize: '14px' }}>
          <span>{section.title}</span><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isExpanded ? <FiChevronDown size={12} /> : <FiChevronUp size={12} />}</span>
        </div>
        {isExpanded && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', marginBottom: '8px', paddingLeft: '8px' }}>
            {section.tags.map(tag => {
              const displayName = section.displayNames?.[tag] || tag;
              const isActive = filters.includes(tag);
              return (
                <button key={tag} onClick={() => { if (isActive) removeFilter(tag); else { if (section.isSingleSelect) section.tags.forEach(t => { if (filters.includes(t)) removeFilter(t); }); addFilter(tag); } }} style={{ padding: '6px 14px', background: isActive ? 'var(--accent-blue)' : 'var(--surface-tertiary)', border: 'none', borderRadius: '30px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', color: isActive ? 'white' : 'var(--text-secondary)' }}>
                  {displayName}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div style={{ marginBottom: '12px' }}>
      <div onClick={() => toggleResultSection(sectionKey)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 500, fontSize: '14px' }}>
        <span>{section.title}</span><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isExpanded ? <FiChevronDown size={12} /> : <FiChevronUp size={12} />}</span>
      </div>
      {isExpanded && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', marginBottom: '8px', paddingLeft: '8px' }}>
          {section.tags.map(tag => {
            const isActive = filters.includes(tag);
            return <button key={tag} onClick={() => isActive ? removeFilter(tag) : addFilter(tag)} style={{ padding: '6px 14px', background: isActive ? 'var(--accent-blue)' : 'var(--surface-tertiary)', border: 'none', borderRadius: '30px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', color: isActive ? 'white' : 'var(--text-secondary)' }}>{tag}</button>;
          })}
        </div>
      )}
    </div>
  );
};

export default MainPage;