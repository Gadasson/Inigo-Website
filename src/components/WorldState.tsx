'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useWorldStateContext } from '../contexts/WorldStateContext';

export default function WorldState() {
  const t = useTranslations('worldState');
  const tExplainer = useTranslations('worldStateExplainer');
  const { worldState, loading, error, refetch } = useWorldStateContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const lastRefreshTime = useRef<number>(0);
  
  const MIN_REFRESH_INTERVAL = 30000; // 30 seconds minimum between refreshes (silent blocking)
  const DISAPPEAR_DELAY = 1500; // 1.5 seconds delay before hiding loading indicators

  // When loading becomes true, show loading indicators immediately
  useEffect(() => {
    if (loading) {
      setShowLoading(true);
    }
  }, [loading]);

  // When loading becomes false, wait a bit before hiding loading indicators
  useEffect(() => {
    if (!loading && showLoading) {
      const timer = setTimeout(() => {
        setShowLoading(false);
        setIsRefreshing(false);
      }, DISAPPEAR_DELAY);
      return () => clearTimeout(timer);
    }
  }, [loading, showLoading]);

  // Reset cooldown after minimum interval (separate from UI state)
  useEffect(() => {
    if (cooldown) {
      const timer = setTimeout(() => {
        setCooldown(false);
      }, MIN_REFRESH_INTERVAL);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleRefresh = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime.current;
    
    // Prevent spam clicks - silently block if within cooldown period
    if (cooldown || isRefreshing || timeSinceLastRefresh < MIN_REFRESH_INTERVAL) {
      // Still show loading state to user, but don't make API call
      setIsRefreshing(true);
      setShowLoading(true);
      
      // Simulate loading delay then hide
      setTimeout(() => {
        setShowLoading(false);
        setIsRefreshing(false);
      }, DISAPPEAR_DELAY);
      return;
    }

    setIsRefreshing(true);
    setCooldown(true);
    setShowLoading(true);
    lastRefreshTime.current = now;

    try {
      await refetch();
    } catch (err) {
      console.error('Error refreshing:', err);
    }
    // Note: isRefreshing will be set to false by useEffect when loading becomes false
  }, [cooldown, isRefreshing, refetch]);

  // Helper function to translate with parameter interpolation
  const translateWithParams = (key: string, params?: Record<string, string | number>) => {
    if (!params) {
      return t(key as keyof typeof t);
    }
    return t(key as keyof typeof t, params);
  };

  // Find matching state definition using order_index (with fallback to name matching for backward compatibility)
  const currentStateDef = worldState?.state_definitions?.find(
    def => def.order_index === worldState?.state_info?.main_state_number || 
           def.name === worldState?.state_info?.main_state
  ) ?? null;

  // Format minutes to next state
  const formatMinutesToNext = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Get icon emoji from icon name
  const getIconEmoji = (iconName: string) => {
    const iconMap: Record<string, string> = {
      'seedling': '🌱',
      'tree': '🌳',
      'forest': '🌲',
      'mountain': '⛰️',
      'sun': '☀️',
      'moon': '🌙',
      'moon-waning-crescent': '🌙',
      'star': '⭐',
      'heart': '❤️',
      'lotus': '🪷',
      'sparkles': '✨',
      'flash': '⚡',
      'sprout': '🌱',
      'meditation': '🧘',
      'weather-sunny': '☀️',
    };
    return iconMap[iconName.toLowerCase()] || '✨';
  };

  return (
    <section id="world-state" className="world-state-section">
      <div className="container">
        <div className="section-header">
          <h2>{tExplainer('title')}</h2>
          <p>{tExplainer('description')}</p>
          <p className="world-state-microcopy">{tExplainer('microcopy')}</p>
        </div>

        {/* World State Display - Skeleton Placeholder */}
        {loading && !worldState && (
          <div className="world-state-display">
            <div className="current-state-card skeleton-card">
              <div className="skeleton-header">
                <div className="skeleton-icon"></div>
                <div className="skeleton-title"></div>
                <div className="skeleton-subtitle"></div>
              </div>
              <div className="skeleton-description">
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
              </div>
              <div className="progress-wrap">
                <div className="bar skeleton-bar">
                  <div className="skeleton-progress"></div>
                </div>
                <div className="progress-meta skeleton-meta">
                  <div className="skeleton-meta-item"></div>
                  <div className="skeleton-meta-item"></div>
                  <div className="skeleton-meta-item"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && !worldState && (
          <div className="world-state-display">
            <p style={{ color: '#e74c3c' }}>
              {t('error')}
              {process.env.NODE_ENV === 'development' && (
                <span style={{ display: 'block', fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.8 }}>
                  Error: {error.message}
                </span>
              )}
            </p>
          </div>
        )}

        {worldState && (
          <div className="world-state-display">
            {/* Current State */}
            <div className={`current-state-card ${isRefreshing ? 'refreshing' : ''}`} style={{ animation: 'fadeIn 0.5s ease-in' }}>
              {/* Refresh Button with Loading Text - Inside card top */}
              <div className="refresh-button-container">
                <span 
                  className={`refresh-loading-text ${showLoading ? 'visible' : 'hidden'}`}
                >
                  {t('loading')}
                </span>
                <button
                  className={`refresh-button ${showLoading ? 'refreshing' : ''}`}
                  onClick={handleRefresh}
                  disabled={showLoading}
                  title={t('refresh')}
                  aria-label={t('refresh')}
                  type="button"
                  tabIndex={0}
                >
                  <span className="refresh-icon">↻</span>
                </button>
              </div>
              {currentStateDef && (
                <div className="state-header" style={{ color: currentStateDef.color }}>
                  <span className="state-icon">{getIconEmoji(currentStateDef.icon)}</span>
                  <h3 className="state-name">
                    {worldState?.state_info?.main_state_key 
                      ? translateWithParams(worldState.state_info.main_state_key)
                      : (worldState?.state_info?.main_state ?? 'Unknown State')}
                  </h3>
                  <p className="sub-state-name">
                    {worldState?.state_info?.sub_state_key
                      ? translateWithParams(worldState.state_info.sub_state_key)
                      : (worldState?.state_info?.sub_state ?? '')}
                  </p>
                </div>
              )}
              
              {currentStateDef && (
                <p className="state-description">
                  {worldState?.state_info?.main_state_key && currentStateDef.description_key
                    ? translateWithParams(currentStateDef.description_key)
                    : (currentStateDef.description || '')}
                </p>
              )}

              {/* Status Message */}
              {worldState?.status_code && (
                <div className="status-message">
                  {translateWithParams(worldState.status_code, {
                    current: worldState.state_info?.current_minutes ?? 0,
                    target: worldState.target_minutes_today ?? 0,
                    overflow: worldState.state_info?.progress_percentage > 100 
                      ? Math.round(worldState.state_info.progress_percentage - 100)
                      : 0
                  })}
                </div>
              )}

              {/* Progress Bar */}
              <div className="progress-wrap">
                <div className="bar">
                  <div 
                    className="fill" 
                    style={{ 
                      width: `${worldState?.state_info?.progress_percentage ?? 0}%`,
                      backgroundColor: currentStateDef?.color || 'var(--inigo-green)'
                    }}
                  />
                </div>
                <div className="progress-meta">
                  <span>
                    <strong>{(worldState?.state_info?.progress_percentage ?? 0).toFixed(1)}%</strong> {t('complete')}
                  </span>
                  <span>
                    <strong>{(worldState?.state_info?.current_minutes ?? 0).toLocaleString()}</strong> {t('minutes')}
                  </span>
                  <span>
                    <strong>{worldState?.state_info?.active_users ?? 0}</strong> {t('activeUsers')}
                  </span>
                </div>
              </div>

              {/* Next State Info */}
              {(worldState?.state_info?.next_sub_state_key || worldState?.state_info?.next_sub_state) && (
                <div className="next-state-info">
                  <p>
                    <strong>{formatMinutesToNext(worldState.state_info.minutes_to_next ?? 0)}</strong> {t('until')}{' '}
                    <strong>
                      {worldState.state_info.next_sub_state_key
                        ? translateWithParams(worldState.state_info.next_sub_state_key)
                        : (worldState.state_info.next_sub_state ?? '')}
                    </strong>
                  </p>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="world-state-features">
              {(t.raw('bullets') as string[]).map((bullet, index) => (
                <div key={index} className="feature-item">
                  <div className="feature-icon">✨</div>
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
