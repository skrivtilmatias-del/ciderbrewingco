import { useState, useEffect, useCallback } from 'react';

export interface RecentAction {
  id: string;
  label: string;
  icon: string;
  timestamp: number;
  batchId: string;
  batchName: string;
}

const STORAGE_KEY = 'cidertrack_recent_actions';
const MAX_ACTIONS = 3;
const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

/**
 * useRecentActions - Track and manage recent batch actions
 * 
 * Stores recent actions in localStorage with automatic cleanup
 * Shows last 3 actions, expires after 24 hours
 * 
 * @param userId - Current user ID
 * @returns Object with recent actions and tracking function
 */
export const useRecentActions = (userId: string | undefined) => {
  const [recentActions, setRecentActions] = useState<RecentAction[]>([]);

  // Load recent actions from localStorage
  useEffect(() => {
    if (!userId) return;

    const loadActions = () => {
      try {
        const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
        if (!stored) {
          setRecentActions([]);
          return;
        }

        const actions: RecentAction[] = JSON.parse(stored);
        const now = Date.now();

        // Filter out expired actions
        const validActions = actions.filter(
          action => now - action.timestamp < EXPIRY_TIME
        );

        setRecentActions(validActions);

        // Update storage if we filtered anything out
        if (validActions.length !== actions.length) {
          localStorage.setItem(
            `${STORAGE_KEY}_${userId}`,
            JSON.stringify(validActions)
          );
        }
      } catch (error) {
        console.error('Failed to load recent actions:', error);
        setRecentActions([]);
      }
    };

    loadActions();
  }, [userId]);

  /**
   * Track a new action
   */
  const trackAction = useCallback((action: Omit<RecentAction, 'timestamp'>) => {
    if (!userId) return;

    setRecentActions(prev => {
      const now = Date.now();
      
      // Remove existing action with same ID
      const filtered = prev.filter(a => a.id !== action.id);
      
      // Add new action at the beginning
      const updated = [
        { ...action, timestamp: now },
        ...filtered
      ].slice(0, MAX_ACTIONS); // Keep only MAX_ACTIONS

      // Save to localStorage
      try {
        localStorage.setItem(
          `${STORAGE_KEY}_${userId}`,
          JSON.stringify(updated)
        );
      } catch (error) {
        console.error('Failed to save recent actions:', error);
      }

      return updated;
    });
  }, [userId]);

  /**
   * Clear all recent actions
   */
  const clearActions = useCallback(() => {
    if (!userId) return;

    setRecentActions([]);
    try {
      localStorage.removeItem(`${STORAGE_KEY}_${userId}`);
    } catch (error) {
      console.error('Failed to clear recent actions:', error);
    }
  }, [userId]);

  return {
    recentActions,
    trackAction,
    clearActions,
  };
};
