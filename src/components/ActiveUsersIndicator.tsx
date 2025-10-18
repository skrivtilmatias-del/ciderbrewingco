import { Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePresence } from '@/hooks/usePresence';

export const ActiveUsersIndicator = () => {
  const { activeUsers } = usePresence();

  if (activeUsers.length === 0) return null;

  // Remove duplicates based on user_id
  const uniqueUsers = activeUsers.filter((user, index, self) => 
    index === self.findIndex((u) => u.user_id === user.user_id)
  );

  const displayUsers = uniqueUsers.slice(0, 3);
  const remainingCount = Math.max(0, uniqueUsers.length - 3);

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <div className="flex -space-x-2">
          {displayUsers.map((user) => (
            <Tooltip key={user.user_id}>
              <TooltipTrigger>
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">Online now</p>
              </TooltipContent>
            </Tooltip>
          ))}
          {remainingCount > 0 && (
            <Tooltip key="remaining-users">
              <TooltipTrigger>
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarFallback className="bg-muted text-xs">
                    +{remainingCount}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{remainingCount} more user{remainingCount !== 1 ? 's' : ''} online</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
