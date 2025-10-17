import { cn } from "@/lib/utils";
import { getColorForProgress } from "@/lib/progressUtils";

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  showText?: boolean;
  className?: string;
}

/**
 * CircularProgress - SVG-based circular progress indicator with gradient
 * 
 * Features:
 * - Smooth animated fill
 * - Gradient colors based on progress
 * - Customizable size and stroke width
 * - Optional center text
 */
export const CircularProgress = ({
  progress,
  size = 80,
  strokeWidth = 8,
  showText = true,
  className,
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  const colors = getColorForProgress(progress);

  return (
    <div className={cn("relative inline-flex", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted opacity-20"
        />

        {/* Progress circle with gradient */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#progressGradient-${size})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient
            id={`progressGradient-${size}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" style={{ stopColor: colors.start }} />
            <stop offset="100%" style={{ stopColor: colors.end }} />
          </linearGradient>
        </defs>
      </svg>

      {/* Center text */}
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold", colors.textClass)}>
            {size >= 60 ? (
              <>
                <span className="text-2xl">{Math.round(progress)}</span>
                <span className="text-sm">%</span>
              </>
            ) : (
              <span className="text-sm">{Math.round(progress)}%</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
};
