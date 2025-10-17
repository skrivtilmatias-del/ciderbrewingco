import { useState, useEffect, useRef, useMemo, forwardRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface BatchSearchProps {
  /** Current search value */
  value: string;
  /** Callback when search value changes */
  onChange: (value: string) => void;
  /** Total number of batches (for "of X" display) */
  totalCount: number;
  /** Number of filtered results */
  resultCount: number;
  /** Whether search is actively filtering (debouncing) */
  isSearching?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Custom className */
  className?: string;
}

// Local storage key for recent searches
const RECENT_SEARCHES_KEY = 'batch-recent-searches';
const MAX_RECENT_SEARCHES = 5;

/**
 * BatchSearch - Advanced search component with debouncing, keyboard shortcuts, and recent searches
 * 
 * Features:
 * - Instant visual feedback (user sees typing immediately)
 * - Debounced search execution (prevents excessive filtering)
 * - Keyboard shortcut: Ctrl/Cmd + K to focus
 * - Recent searches stored in localStorage
 * - Search suggestions based on recent queries
 * - Clear button when input has value
 * - Result count display
 * - "Searching..." indicator during debounce
 * 
 * Performance Strategy:
 * - User input updates state immediately (no lag in UI)
 * - Debounced value triggers actual filtering after 300ms
 * - Parent component receives debounced value only
 * - Prevents re-rendering entire batch list on every keystroke
 */
export const BatchSearch = forwardRef<HTMLInputElement, BatchSearchProps>(({
  value,
  onChange,
  totalCount,
  resultCount,
  isSearching = false,
  placeholder = 'Search batches by name, variety, or stage...',
  className,
}, forwardedRef) => {
  // Local input state for instant visual feedback
  const [localValue, setLocalValue] = useState(value);
  
  // Debounce the local value before triggering actual search
  const debouncedValue = useDebounce(localValue, 300);
  
  // Recent searches state
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Use internal ref if no ref is forwarded
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = (forwardedRef as React.RefObject<HTMLInputElement>) || internalRef;

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }, []);

  // Save search to recent searches when user types and debounce completes
  useEffect(() => {
    if (debouncedValue && debouncedValue.trim().length >= 2) {
      setRecentSearches((prev) => {
        // Remove if already exists (we'll add it to the front)
        const filtered = prev.filter((s) => s !== debouncedValue);
        // Add to front and limit to MAX_RECENT_SEARCHES
        const updated = [debouncedValue, ...filtered].slice(0, MAX_RECENT_SEARCHES);
        
        // Save to localStorage
        try {
          localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        } catch (error) {
          console.error('Failed to save recent searches:', error);
        }
        
        return updated;
      });
    }
  }, [debouncedValue]);

  // Sync debounced value with parent component
  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  // Sync external value changes with local state
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Keyboard shortcut: Ctrl/Cmd + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setShowSuggestions(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle input change - updates local state immediately
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Show suggestions when user starts typing
    if (newValue.length > 0 && recentSearches.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle clear button click
  const handleClear = () => {
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
    setShowSuggestions(false);
  };

  // Handle selecting a recent search
  const handleSelectRecent = (search: string) => {
    setLocalValue(search);
    onChange(search);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  // Filter suggestions based on current input
  const suggestions = useMemo(() => {
    if (!localValue || localValue.length < 2) {
      return recentSearches;
    }
    
    // Filter recent searches that contain the current input
    return recentSearches.filter((search) =>
      search.toLowerCase().includes(localValue.toLowerCase())
    );
  }, [localValue, recentSearches]);

  // Determine if we're actively debouncing (user is typing but search hasn't executed)
  const isDebouncing = localValue !== debouncedValue;

  return (
    <div className={cn('relative', className)}>
      <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
        <PopoverTrigger asChild>
          <div className="relative">
            {/* Search icon */}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            
            {/* Search input */}
            <Input
              ref={inputRef}
              type="text"
              value={localValue}
              onChange={handleInputChange}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              placeholder={placeholder}
              className="pl-9 pr-24"
              aria-label="Search batches"
            />

            {/* Right side controls */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {/* Searching indicator */}
              {isDebouncing && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="hidden sm:inline">Searching...</span>
                </div>
              )}

              {/* Clear button */}
              {localValue && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-6 w-6 p-0 hover:bg-muted"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}

              {/* Keyboard shortcut hint */}
              {!localValue && (
                <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              )}
            </div>
          </div>
        </PopoverTrigger>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-2"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground px-2 py-1">
                {localValue.length < 2 ? 'Recent searches' : 'Suggestions'}
              </p>
              {suggestions.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectRecent(search)}
                  className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2"
                >
                  <Search className="h-3 w-3 text-muted-foreground" />
                  <span>{search}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        )}
      </Popover>

      {/* Result count */}
      {localValue && !isDebouncing && (
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Found {resultCount} of {totalCount} batches
          </Badge>
        </div>
      )}
    </div>
  );
});

BatchSearch.displayName = 'BatchSearch';
