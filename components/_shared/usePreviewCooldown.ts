"use client"
import { useState, useEffect } from 'react';

/* ========================================= */

const COOLDOWN_DURATION = 60;

/* ========================================= */

export function usePreviewCooldown(category: string) {
  const [cooldown, setCooldown] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const key = `pc_${category}`;
    const lastPreview = localStorage.getItem(key);
    if (lastPreview) {
      const elapsed = Math.floor((Date.now() - parseInt(lastPreview, 10)) / 1000);
      if (elapsed < COOLDOWN_DURATION) {
        const remaining = COOLDOWN_DURATION - elapsed;
        setCooldown(remaining);
        setIsBlocked(true);
      }
    }
  }, [category]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            setIsBlocked(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const startCooldown = () => {
    const key = `pc_${category}`;
    localStorage.setItem(key, Date.now().toString());
    setCooldown(COOLDOWN_DURATION);
    setIsBlocked(true);
  };

  const assertReady = () => {
    if (isBlocked) {
      return false;
    }
    return true;
  };

  const formatTimer = (s: number) => {
    const minutes = Math.floor(s / 60);
    const seconds = s % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return { cooldown, isBlocked, allowed: true, assertReady, startCooldown, formatTimer };
}
