import { useState, useEffect, useCallback } from 'react';
import { OmniAPI } from '../services/api.js';

export function useBackendStatus() {
  const [status, setStatus] = useState('connecting'); // 'connecting' | 'online' | 'offline'

  const check = useCallback(async () => {
    try {
      await OmniAPI.healthCheck();
      setStatus('online');
    } catch {
      setStatus('offline');
    }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, [check]);

  return { status, retry: check };
}

export function useCurrentTime() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('omnimed-theme') || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('omnimed-theme', theme);
  }, [theme]);
  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  return { theme, toggle };
}

export function useAuditLog(maxEntries = 25) {
  const [entries, setEntries] = useState([]);
  const add = useCallback((text, color = 'cyan') => {
    const time = new Date().toTimeString().slice(0, 8);
    setEntries(prev => [{ text, color, time, id: Date.now() + Math.random() }, ...prev].slice(0, maxEntries));
  }, [maxEntries]);
  return { entries, add };
}

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  return { toasts, show };
}
