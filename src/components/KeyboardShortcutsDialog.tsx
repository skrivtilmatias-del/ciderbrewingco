import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Keyboard, 
  Search, 
  Zap, 
  Navigation, 
  MousePointer, 
  Filter,
  Lightbulb,
  Command,
  Apple,
  Monitor
} from 'lucide-react';
import { getAllShortcuts } from '@/hooks/useKeyboardShortcuts';

/**
 * KeyboardShortcutsDialog - Beautiful modal showing all keyboard shortcuts
 * 
 * Features:
 * - Categorized shortcuts (Global, Navigation, Batch Actions, Filters)
 * - Search functionality
 * - Pro tips
 * - Platform-specific display (Mac/Windows)
 * - Responsive design
 */
export const KeyboardShortcutsDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const shortcuts = getAllShortcuts();

  // Detect platform for displaying correct modifier keys
  const isMac = navigator.platform.toLowerCase().includes('mac');
  const modifierKey = isMac ? '⌘' : 'Ctrl';

  /**
   * Filter shortcuts based on search query
   */
  const filteredShortcuts = Object.entries(shortcuts).reduce((acc, [category, items]) => {
    if (!searchQuery) {
      acc[category] = items;
      return acc;
    }

    const query = searchQuery.toLowerCase();
    const filtered = items.filter(
      (item) =>
        item.description.toLowerCase().includes(query) ||
        item.keys.toLowerCase().includes(query)
    );

    if (filtered.length > 0) {
      acc[category] = filtered;
    }

    return acc;
  }, {} as Record<string, typeof shortcuts[keyof typeof shortcuts]>);

  /**
   * Format shortcut keys for display
   */
  const formatKeys = (keys: string) => {
    return keys
      .replace('Ctrl/⌘', modifierKey)
      .replace('Ctrl', modifierKey)
      .split('+')
      .map((k) => k.trim());
  };

  /**
   * Pro tips for power users
   */
  const proTips = [
    'Use J/K to navigate lists without touching the mouse',
    'Press ? anytime to see all shortcuts',
    'Combine Space with arrow keys for quick multi-select',
    'Use Esc to quickly exit any modal or clear selection',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Keyboard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Keyboard Shortcuts</DialogTitle>
              <DialogDescription>
                Navigate and perform actions like a pro
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="gap-2">
              <Command className="h-3 w-3" />
              All
            </TabsTrigger>
            <TabsTrigger value="global" className="gap-2">
              <Zap className="h-3 w-3" />
              Global
            </TabsTrigger>
            <TabsTrigger value="navigation" className="gap-2">
              <Navigation className="h-3 w-3" />
              Nav
            </TabsTrigger>
            <TabsTrigger value="batch" className="gap-2">
              <MousePointer className="h-3 w-3" />
              Batch
            </TabsTrigger>
            <TabsTrigger value="filters" className="gap-2">
              <Filter className="h-3 w-3" />
              Filters
            </TabsTrigger>
          </TabsList>

          {/* All Shortcuts */}
          <TabsContent value="all" className="flex-1 overflow-y-auto space-y-6 mt-4">
            {Object.entries(filteredShortcuts).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  {category === 'Global' && <Zap className="h-4 w-4" />}
                  {category === 'Navigation' && <Navigation className="h-4 w-4" />}
                  {category === 'Batch Actions' && <MousePointer className="h-4 w-4" />}
                  {category === 'Filters' && <Filter className="h-4 w-4" />}
                  {category}
                </h3>
                <div className="space-y-2">
                  {items.map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm text-muted-foreground">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {formatKeys(shortcut.keys).map((key, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <kbd className="px-2 py-1 text-xs font-semibold bg-background border rounded shadow-sm">
                              {key}
                            </kbd>
                            {i < formatKeys(shortcut.keys).length - 1 && (
                              <span className="text-xs text-muted-foreground">+</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {Object.keys(filteredShortcuts).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No shortcuts found matching "{searchQuery}"</p>
              </div>
            )}
          </TabsContent>

          {/* Category-specific tabs */}
          {['global', 'navigation', 'batch', 'filters'].map((tab) => {
            const categoryMap: Record<string, string> = {
              global: 'Global',
              navigation: 'Navigation',
              batch: 'Batch Actions',
              filters: 'Filters',
            };
            const category = categoryMap[tab];
            const items = filteredShortcuts[category] || [];

            return (
              <TabsContent key={tab} value={tab} className="flex-1 overflow-y-auto mt-4">
                <div className="space-y-2">
                  {items.map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm text-muted-foreground">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {formatKeys(shortcut.keys).map((key, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <kbd className="px-2 py-1 text-xs font-semibold bg-background border rounded shadow-sm">
                              {key}
                            </kbd>
                            {i < formatKeys(shortcut.keys).length - 1 && (
                              <span className="text-xs text-muted-foreground">+</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>

        <Separator />

        {/* Pro Tips */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Pro Tips
          </div>
          <div className="grid grid-cols-2 gap-2">
            {proTips.map((tip, idx) => (
              <div
                key={idx}
                className="text-xs text-muted-foreground p-2 rounded bg-muted/30 border border-dashed"
              >
                {tip}
              </div>
            ))}
          </div>
        </div>

        {/* Platform indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          {isMac ? (
            <>
              <Apple className="h-3 w-3" />
              macOS shortcuts
            </>
          ) : (
            <>
              <Monitor className="h-3 w-3" />
              Windows/Linux shortcuts
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
