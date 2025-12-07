import { Instagram, Youtube, Facebook, Linkedin, Twitter } from 'lucide-react';
import { Club } from '@/types/club';

interface SocialMediaIconsProps {
  club: Club;
  className?: string;
  iconSize?: 'sm' | 'md' | 'lg';
}

const SOCIAL_PLATFORMS = [
  { key: 'instagram_url', icon: Instagram, label: 'Instagram', color: 'hover:text-pink-500' },
  { key: 'youtube_url', icon: Youtube, label: 'YouTube', color: 'hover:text-red-500' },
  { key: 'facebook_url', icon: Facebook, label: 'Facebook', color: 'hover:text-blue-600' },
  { key: 'linkedin_url', icon: Linkedin, label: 'LinkedIn', color: 'hover:text-blue-700' },
  { key: 'twitter_url', icon: Twitter, label: 'X (Twitter)', color: 'hover:text-foreground' },
] as const;

type SocialKey = typeof SOCIAL_PLATFORMS[number]['key'];

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export const SocialMediaIcons = ({ club, className = '', iconSize = 'md' }: SocialMediaIconsProps) => {
  const activePlatforms = SOCIAL_PLATFORMS.filter(
    ({ key }) => club[key as SocialKey]?.trim()
  );

  if (activePlatforms.length === 0) return null;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {activePlatforms.map(({ key, icon: Icon, label, color }) => (
        <a
          key={key}
          href={club[key as SocialKey] as string}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-muted-foreground ${color} transition-colors duration-200`}
          title={label}
          aria-label={`Visit our ${label} page`}
        >
          <Icon className={iconSizes[iconSize]} />
        </a>
      ))}
    </div>
  );
};
