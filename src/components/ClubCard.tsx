import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Club } from '@/types/club';
import { useNavigate } from 'react-router-dom';
import watermarkImage from '@/assets/club-watermark.jpg';

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
      className="group relative overflow-hidden bg-white border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleKnowMore}
    >
      {/* Clean Background with subtle watermark */}
      <div 
        className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
        style={{
          backgroundImage: `url(${watermarkImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Clean Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
      
      {/* Card Content */}
      <CardContent className="relative p-6 h-full flex flex-col">
        {/* Clean Club Icon/Logo */}
        {club.logo_url ? (
          <div className="w-16 h-16 rounded-2xl overflow-hidden mb-6 shadow-md group-hover:scale-105 transition-transform duration-300">
            <img 
              src={club.logo_url} 
              alt={`${club.name} logo`}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl mb-6 flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-md group-hover:scale-105 transition-transform duration-300">
            {club.name.charAt(0)}
          </div>
        )}

        {/* Club Name */}
        <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4 group-hover:text-gradient transition-all duration-300 leading-tight">
          {club.name}
        </h3>
        
        {/* Clean Description */}
        <div className="relative flex-1 min-h-[60px]">
          {/* Always visible description */}
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
          
          {/* Clean Hover content */}
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
              size="default"
              className="w-full group/btn font-medium"
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

        {/* Clean Status Badge */}
        <div className="absolute top-4 right-4">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            club.registration_open 
              ? 'bg-success/10 text-success border border-success/20' 
              : 'bg-muted text-muted-foreground border border-border'
          }`}>
            {club.registration_open ? '● OPEN' : '○ CLOSED'}
          </div>
        </div>

        {/* Subtle Decorative Elements */}
        <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-primary/5 rounded-full group-hover:scale-125 group-hover:bg-gradient-primary/10 transition-all duration-300 blur-sm" />
        <div className="absolute -top-2 -left-2 w-12 h-12 bg-accent/5 rounded-full group-hover:scale-110 group-hover:bg-accent/10 transition-all duration-300 blur-sm" />
      </CardContent>
    </Card>
  );
};