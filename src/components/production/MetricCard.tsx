import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  trendLabel?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  onClick?: () => void;
}

export const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  trendLabel,
  variant = 'default',
  onClick,
}: MetricCardProps) => {
  const variantStyles = {
    default: 'border-border',
    success: 'border-green-500/50 bg-green-50 dark:bg-green-950/20',
    warning: 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20',
    destructive: 'border-red-500/50 bg-red-50 dark:bg-red-950/20',
  };

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        variantStyles[variant],
        onClick && 'cursor-pointer hover:scale-[1.02]'
      )}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold mt-2 mb-1">{value}</h3>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>

          <div
            className={cn(
              'p-3 rounded-full',
              variant === 'success' &&
                'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
              variant === 'warning' &&
                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
              variant === 'destructive' &&
                'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
              variant === 'default' && 'bg-primary/10 text-primary'
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>

        {trend && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
            {trend === 'stable' && <Minus className="w-4 h-4 text-muted-foreground" />}
            <span
              className={cn(
                'text-sm font-medium',
                trend === 'up' && 'text-green-600',
                trend === 'down' && 'text-red-600',
                trend === 'stable' && 'text-muted-foreground'
              )}
            >
              {trendValue}
            </span>
            {trendLabel && (
              <span className="text-sm text-muted-foreground">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
