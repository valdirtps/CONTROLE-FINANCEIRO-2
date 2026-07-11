'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from './FirebaseProvider';
import { toast } from 'sonner';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const INACTIVITY_LIMIT = 60 * 1000; // 1 minuto
const WARNING_THRESHOLD = 10 * 1000; // Aviso faltando 10 segundos
const CHECK_INTERVAL = 1000; // Verificar a cada segundo
const STORAGE_KEY = 'finance_pro_last_activity_ts';

export function InactivityHandler() {
  const { user } = useAuth();
  
  const userRef = useRef(user);
  const isProcessingLogout = useRef(false);
  const warningShown = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    userRef.current = user;
    if (user) {
      isProcessingLogout.current = false;
      warningShown.current = false;
    }
  }, [user]);

  const updateActivity = useCallback(() => {
    if (userRef.current && !isProcessingLogout.current) {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }
  }, []);

  useEffect(() => {
    if (!user) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    updateActivity();

    const checkInactivity = async () => {
      if (!userRef.current || isProcessingLogout.current) return;

      const lastActivityStr = localStorage.getItem(STORAGE_KEY);
      if (!lastActivityStr) return;

      const lastActivity = parseInt(lastActivityStr, 10);
      const now = Date.now();
      const diff = now - lastActivity;

      // Log para depuração (pode ser visto no F12)
      if (Math.floor(diff / 1000) % 10 === 0) {
        console.log(`Tempo de inatividade: ${Math.floor(diff / 1000)}s / 60s`);
      }

      if (diff >= (INACTIVITY_LIMIT - WARNING_THRESHOLD) && diff < INACTIVITY_LIMIT) {
        if (!warningShown.current) {
          warningShown.current = true;
          toast.warning('Aviso de Inatividade', {
            description: 'Sua sessão expirará em 10 segundos.',
            duration: 5000,
          });
        }
      }

      if (diff >= INACTIVITY_LIMIT) {
        isProcessingLogout.current = true;
        console.warn('Limite de 1 minuto atingido. Deslogando...');
        
        try {
          await signOut(auth);
          localStorage.removeItem(STORAGE_KEY);
          window.location.href = '/'; // Forçar redirecionamento
        } catch (error) {
          console.error('Erro no logout automático:', error);
          isProcessingLogout.current = false;
        }
      }
    };

    const intervalId = setInterval(checkInactivity, CHECK_INTERVAL);

    // Ignorar movimentos de mouse insignificantes (comuns em automações)
    const handleMouseMove = (e: MouseEvent) => {
      const dist = Math.abs(e.clientX - lastMousePos.current.x) + Math.abs(e.clientY - lastMousePos.current.y);
      if (dist > 10) { // Só conta se mover mais de 10 pixels
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        updateActivity();
      }
    };

    const handleOtherActivity = () => updateActivity();

    window.addEventListener('mousemove', handleMouseMove, true);
    window.addEventListener('mousedown', handleOtherActivity, true);
    window.addEventListener('keydown', handleOtherActivity, true);
    window.addEventListener('scroll', handleOtherActivity, true);
    window.addEventListener('touchstart', handleOtherActivity, true);
    window.addEventListener('click', handleOtherActivity, true);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkInactivity();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('mousemove', handleMouseMove, true);
      window.removeEventListener('mousedown', handleOtherActivity, true);
      window.removeEventListener('keydown', handleOtherActivity, true);
      window.removeEventListener('scroll', handleOtherActivity, true);
      window.removeEventListener('touchstart', handleOtherActivity, true);
      window.removeEventListener('click', handleOtherActivity, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, updateActivity]);

  return null;
}
