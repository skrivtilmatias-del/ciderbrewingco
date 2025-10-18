import { Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { usePresence } from '@/hooks/usePresence';

export const ActiveUsersIndicator = () => {
  const { activeUsers } = usePresence();

  if (activeUsers.length === 0) return null;

  const displayUsers = activeUsers.slice(0, 3);
  const remainingCount = Math.max(0, activeUsers.length - 3);

  return (
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-muted-foreground" />
      <div className="flex -space-x-2">
        {displayUsers.map((user) => (
          <Avatar 
            key={user.user_id} 
            className="h-8 w-8 border-2 border-background"
            title={`${user.name} • Online now`}
          >
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
        {remainingCount > 0 && (
          <Avatar 
            className="h-8 w-8 border-2 border-background"
            title={`${remainingCount} more user${remainingCount !== 1 ? 's' : ''} online`}
          >
            <AvatarFallback className="bg-muted text-xs">
              +{remainingCount}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
};
