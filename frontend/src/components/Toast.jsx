import React, { useState, useEffect, useRef } from 'react';
import { FiCheckCircle, FiXCircle, FiX, FiInfo } from 'react-icons/fi';

const Toast = ({ id, type = 'success', message, duration = 4000, onClose }) => {
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  
  const timerRef = useRef(null);
  const remainingTimeRef = useRef(duration);
  const frameRef = useRef(null);
  const isPausedRef = useRef(false);

  // Синхронизируем ref с state
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const handleClose = () => {
    setIsLeaving(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const startCloseTimer = (time) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(() => {
      handleClose();
    }, time);
  };

  const startProgressAnimation = (startProgress = 100) => {
    const startTime = Date.now();
    const initialProgress = startProgress;
    
    const animate = () => {
      // Используем ref для актуального значения паузы
      if (isPausedRef.current) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      const now = Date.now();
      const elapsed = now - startTime;
      const newProgress = Math.max(0, initialProgress - (elapsed / duration) * 100);
      
      setProgress(newProgress);
      
      if (newProgress > 0) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    
    frameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    startCloseTimer(duration);
    startProgressAnimation(100);
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    console.log('🖱️ PAUSE, current progress:', progress);
    
    // Очищаем таймер закрытия
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // Сохраняем оставшееся время
    const elapsed = (100 - progress) / 100 * duration;
    remainingTimeRef.current = Math.max(0, duration - elapsed);
    
    console.log('⏸️ Remaining time:', remainingTimeRef.current);
    
    // Устанавливаем паузу
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    console.log('▶️ RESUME, remaining:', remainingTimeRef.current);
    
    // Снимаем паузу
    setIsPaused(false);
    
    // Останавливаем старую анимацию
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    
    // Запускаем новую анимацию с текущего прогресса
    startProgressAnimation(progress);
    
    // Запускаем таймер с оставшимся временем
    startCloseTimer(remainingTimeRef.current);
  };

  const config = {
    success: { icon: <FiCheckCircle size={20} />, bgColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981', iconColor: '#10b981', progressColor: '#10b981', title: 'Успешно' },
    error: { icon: <FiXCircle size={20} />, bgColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444', iconColor: '#ef4444', progressColor: '#ef4444', title: 'Ошибка' },
    warning: { icon: <FiInfo size={20} />, bgColor: 'rgba(251, 191, 36, 0.15)', borderColor: '#fbbf24', iconColor: '#fbbf24', progressColor: '#fbbf24', title: 'Внимание' },
    info: { icon: <FiInfo size={20} />, bgColor: 'rgba(59, 130, 246, 0.15)', borderColor: '#3b82f6', iconColor: '#3b82f6', progressColor: '#3b82f6', title: 'Информация' }
  };

  const { icon, bgColor, borderColor, iconColor, progressColor, title } = config[type] || config.info;

  return (
    <div 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave} 
      style={{
        position: 'fixed', top: '90px', right: '20px', maxWidth: '380px', width: 'calc(100% - 40px)',
        background: 'var(--surface-secondary)', backdropFilter: 'blur(12px)', borderRadius: '14px',
        boxShadow: 'var(--shadow-lg)', border: `1px solid ${borderColor}`, zIndex: 10000,
        animation: isLeaving ? 'slideOut 0.3s ease-out forwards' : 'slideIn 0.3s ease-out',
        pointerEvents: 'auto', overflow: 'hidden'
      }}>
      <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes slideOut{from{transform:translateX(0);opacity:1}to{transform:translateX(100%);opacity:0}}`}</style>
      
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: iconColor }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>{title}</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4, wordBreak: 'break-word' }}>{message}</p>
        </div>
        <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px', borderRadius: '6px', flexShrink: 0 }}>
          <FiX size={16} />
        </button>
      </div>
      
      {/* Полоска прогресса */}
      <div style={{ 
        width: '100%', 
        height: '3px', 
        background: 'rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ 
          width: `${progress}%`, 
          height: '100%', 
          background: progressColor, 
          transition: 'none',
          borderRadius: progress > 98 ? '0 14px 14px 0' : '0'
        }} />
      </div>
    </div>
  );
};

export default Toast;