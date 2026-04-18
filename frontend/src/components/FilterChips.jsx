import React from 'react';
import { FiX, FiActivity } from 'react-icons/fi';

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
    'low': '#10b981',      // зелёный
    'medium': '#f59e0b',   // жёлтый/оранжевый
    'high': '#ef4444'      // красный
  };
  return colorMap[tag] || 'var(--text-secondary)';
};

const FilterChips = ({ tags, onRemove }) => {
  if (!tags || tags.length === 0) return null;
  
  return (
    <div className="chips-container">
      {tags.map((tag, index) => {
        const isComplexity = tag === 'low' || tag === 'medium' || tag === 'high';
        
        return (
          <div key={index} className="chip">
            {isComplexity && (
              <FiActivity 
                size={12} 
                style={{ 
                  marginRight: '4px',
                  color: getComplexityColor(tag)
                }} 
              />
            )}
            {getDisplayTagName(tag)}
            <span className="chip-remove" onClick={() => onRemove(tag)}>
              <FiX size={16} />
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default FilterChips;