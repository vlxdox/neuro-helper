import React from 'react';

const NeuralTable = ({ neuralNets, favorites, onToggleFavorite }) => {
  const getComplexityText = (complexity) => {
    const map = { low: 'Низкая', medium: 'Средняя', high: 'Высокая' };
    return map[complexity] || complexity;
  };

  const getPriceText = (priceType) => {
    const map = { free: 'Бесплатно', freemium: 'Подписка', paid: 'Платно' };
    return map[priceType] || priceType;
  };

  return (
    <div className="table-wrapper" style={{
      background: 'var(--surface-secondary)',
      borderRadius: '20px',
      overflow: 'hidden',
      border: '1px solid var(--border-light)'
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--surface-tertiary)' }}>
            <th style={{ padding: '16px 20px', textAlign: 'left', color: 'var(--text-secondary)' }}>Название</th>
            <th style={{ padding: '16px 20px', textAlign: 'left', color: 'var(--text-secondary)' }}>Описание</th>
            <th style={{ padding: '16px 20px', textAlign: 'left', color: 'var(--text-secondary)' }}>Теги</th>
            <th style={{ padding: '16px 20px', textAlign: 'left', color: 'var(--text-secondary)' }}>Цена</th>
            <th style={{ padding: '16px 20px', textAlign: 'left', color: 'var(--text-secondary)' }}>Сложность</th>
            <th style={{ padding: '16px 20px', textAlign: 'left', color: 'var(--text-secondary)' }}>Избранное</th>
          </tr>
        </thead>
        <tbody>
          {neuralNets.map((net) => (
            <tr key={net.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '16px 20px' }}>
                <a href={net.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-pink)', textDecoration: 'none' }}>
                  {net.name}
                </a>
              </td>
              <td style={{ padding: '16px 20px', maxWidth: '300px', color: 'var(--text-secondary)' }}>
                {net.description.substring(0, 100)}...
              </td>
              <td style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {net.tags.slice(0, 3).map(tag => (
                    <span key={tag} style={{
                      background: 'var(--accent-pink-light)',
                      color: 'var(--accent-pink)',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '11px'
                    }}>{tag}</span>
                  ))}
                  {net.tags.length > 3 && <span style={{
                    background: 'var(--surface-tertiary)',
                    color: 'var(--text-muted)',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px'
                  }}>+{net.tags.length - 3}</span>}
                </div>
              </td>
              <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{getPriceText(net.price_type)}</td>
              <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{getComplexityText(net.complexity)}</td>
              <td style={{ padding: '16px 20px' }}>
                <button
                  onClick={() => onToggleFavorite(net.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    opacity: favorites.includes(net.id) ? 1 : 0.4,
                    transition: 'opacity 0.2s'
                  }}
                >
                  {favorites.includes(net.id) ? '❤️' : '🤍'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default NeuralTable;