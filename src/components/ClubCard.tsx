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
      className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleKnowMore}
    >
      <CardContent className="p-6">
        <div className="relative">
          <h3 className="text-xl font-bold text-primary mb-2 group-hover:text-primary/80 transition-colors">
            {club.name}
          </h3>
          
          <div className={`transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}>
            {club.short_description && (
              <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                {club.short_description}
              </p>
            )}
            
            <Button 
              variant="default" 
              size="sm"
              className="bg-primary hover:bg-primary/90"
              onClick={(e) => {
                e.stopPropagation();
                handleKnowMore();
              }}
            >
              Know More
            </Button>
          </div>
          
          {!isHovered && club.short_description && (
            <p className="text-muted-foreground text-sm absolute top-8 transition-all duration-300">
              {club.short_description.substring(0, 50)}...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};