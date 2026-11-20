import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function TeamAvatar({ initials }: { initials: string }) {
  return (
    <Avatar variant="portrait" className="aspect-portrait h-auto w-full">
      <AvatarFallback variant="portrait">{initials}</AvatarFallback>
    </Avatar>
  );
}
