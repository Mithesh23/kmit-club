import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Club } from '@/types/club';
import { useNavigate } from 'react-router-dom';

interface ClubCardProps {
  club: Club;
}

export const ClubCard = ({ club }: ClubCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const handleKnowMore = () => {
    navigate(`/club/${club.id}`);
  };

  return (
    <Card 
      className="group relative overflow-hidden card-neon transition-all duration-500 hover:-translate-y-4 cursor-pointer backdrop-blur-sm h-full glow-primary hover:glow-accent"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleKnowMore}
    >
      {/* Professional Hover Glow Effect */}
      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-xl" />
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/50 rounded-xl transition-colors duration-500" />
      
      {/* Card Content */}
      <CardContent className="relative p-8 h-full flex flex-col">
        {/* Professional Club Icon */}
        <div className="w-20 h-20 bg-gradient-primary rounded-3xl mb-8 flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-glow group-hover:scale-110 transition-transform duration-300">
          {club.name.charAt(0)}
        </div>

        {/* Club Name */}
        <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6 group-hover:text-gradient transition-all duration-300 leading-tight">
          {club.name}
        </h3>
        
        {/* Professional Description */}
        <div className="relative flex-1 min-h-[80px]">
          {/* Always visible description */}
          {club.short_description && (
            <p className={`text-muted-foreground leading-relaxed text-lg transition-all duration-300 ${
              isHovered ? 'opacity-0 transform -translate-y-3' : 'opacity-100 transform translate-y-0'
            }`}>
              {club.short_description.length > 90 
                ? `${club.short_description.substring(0, 90)}...` 
                : club.short_description
              }
            </p>
          )}
          
          {/* Professional Hover content */}
          <div className={`absolute inset-0 transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}>
            {club.short_description && (
              <p className="text-muted-foreground leading-relaxed mb-8 text-lg">
                {club.short_description}
              </p>
            )}
            
            <Button 
              variant="default" 
              size="lg"
              className="btn-neon w-full group/btn text-lg font-semibold py-4"
              onClick={(e) => {
                e.stopPropagation();
                handleKnowMore();
              }}
            >
              <span className="group-hover/btn:scale-105 transition-transform duration-300">
                Explore Club →
              </span>
            </Button>
          </div>
        </div>

        {/* Professional Status Badge */}
        <div className="absolute top-6 right-6">
          <div className={`px-4 py-2 rounded-full text-sm font-bold ${
            club.registration_open 
              ? 'bg-success/20 text-success border-2 border-success/30 glow-accent' 
              : 'bg-muted/50 text-muted-foreground border-2 border-border'
          }`}>
            {club.registration_open ? '● OPEN' : '○ CLOSED'}
          </div>
        </div>

        {/* Enhanced Decorative Elements */}
        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-primary/10 rounded-full group-hover:scale-150 group-hover:bg-gradient-primary/20 transition-all duration-500 blur-sm" />
        <div className="absolute -top-4 -left-4 w-16 h-16 bg-accent/10 rounded-full group-hover:scale-125 group-hover:bg-accent/20 transition-all duration-500 blur-sm" />
        
        {/* Professional Grid Pattern */}
        <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
          <svg className="w-full h-full" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="card-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#card-grid)" />
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};