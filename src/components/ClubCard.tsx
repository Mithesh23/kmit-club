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
      className="group relative overflow-hidden bg-gradient-card border-0 shadow-lg hover:shadow-elegant transition-all duration-500 hover:-translate-y-3 cursor-pointer backdrop-blur-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleKnowMore}
    >
      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
      
      {/* Card Content */}
      <CardContent className="relative p-8">
        {/* Club Icon */}
        <div className="w-16 h-16 bg-gradient-primary rounded-2xl mb-6 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {club.name.charAt(0)}
        </div>

        {/* Club Name */}
        <h3 className="text-2xl font-display font-bold text-foreground mb-3 group-hover:text-gradient transition-all duration-300">
          {club.name}
        </h3>
        
        {/* Description */}
        <div className="relative min-h-[60px]">
          {/* Always visible short description */}
          {club.short_description && (
            <p className={`text-muted-foreground leading-relaxed transition-all duration-300 ${
              isHovered ? 'opacity-0 transform -translate-y-2' : 'opacity-100 transform translate-y-0'
            }`}>
              {club.short_description.length > 80 
                ? `${club.short_description.substring(0, 80)}...` 
                : club.short_description
              }
            </p>
          )}
          
          {/* Hover content */}
          <div className={`absolute inset-0 transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            {club.short_description && (
              <p className="text-muted-foreground leading-relaxed mb-6">
                {club.short_description}
              </p>
            )}
            
            <Button 
              variant="default" 
              size="sm"
              className="btn-gradient shadow-lg w-full group/btn"
              onClick={(e) => {
                e.stopPropagation();
                handleKnowMore();
              }}
            >
              <span className="group-hover/btn:scale-105 transition-transform duration-200">
                Explore Club
              </span>
            </Button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            club.registration_open 
              ? 'bg-success/10 text-success border border-success/20' 
              : 'bg-muted text-muted-foreground border border-border'
          }`}>
            {club.registration_open ? '🟢 Open' : '⭕ Closed'}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-gradient-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
        <div className="absolute -top-2 -left-2 w-12 h-12 bg-gradient-secondary/10 rounded-full group-hover:scale-125 transition-transform duration-500" />
      </CardContent>
    </Card>
  );
};