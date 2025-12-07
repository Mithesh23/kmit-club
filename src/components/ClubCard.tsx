import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Club } from '@/types/club';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import watermarkImage from '@/assets/club-watermark.jpg';
import { transformImageUrl } from '@/lib/utils';

interface ClubCardProps {
  club: Club;
}

export const ClubCard = ({ club }: ClubCardProps) => {
  const navigate = useNavigate();

  const handleKnowMore = () => {
    navigate(`/club/${club.id}`);
  };

  return (
    <Card 
      className="group relative overflow-hidden bg-white border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer h-full"
      onClick={handleKnowMore}
    >
      {/* Background with subtle watermark */}
      <div 
        className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
        style={{
          backgroundImage: `url(${watermarkImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
      
      {/* Card Content */}
      <CardContent className="relative p-6 h-full flex flex-col items-center text-center">
        {/* Club Icon/Logo */}
        {club.logo_url ? (
          <div className="w-16 h-16 rounded-2xl overflow-hidden mb-4 shadow-md group-hover:scale-105 transition-transform duration-300">
            <img 
              src={transformImageUrl(club.logo_url)} 
              alt={`${club.name} logo`}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl mb-4 flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-md group-hover:scale-105 transition-transform duration-300">
            {club.name.charAt(0)}
          </div>
        )}

        {/* Club Name */}
        <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-3 group-hover:text-gradient transition-all duration-300 leading-tight">
          {club.name}
        </h3>
        
        {/* Description */}
        {club.short_description && (
          <p className="text-muted-foreground leading-relaxed text-sm mb-4 flex-1">
            {club.short_description.length > 100 
              ? `${club.short_description.substring(0, 100)}...` 
              : club.short_description
            }
          </p>
        )}

        {/* Explore Button - Appears on hover */}
        <Button 
          variant="outline" 
          size="sm"
          className="mt-auto opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
          onClick={(e) => {
            e.stopPropagation();
            handleKnowMore();
          }}
        >
          Explore Club
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
        </Button>

        {/* Status Badge - Only show when registrations are open */}
        {club.registration_open && (
          <div className="absolute top-4 right-4">
            <div className="px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
              ● Open
            </div>
          </div>
        )}

        {/* Subtle Decorative Elements */}
        <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-primary/5 rounded-full group-hover:scale-125 group-hover:bg-gradient-primary/10 transition-all duration-300 blur-sm" />
        <div className="absolute -top-2 -left-2 w-12 h-12 bg-accent/5 rounded-full group-hover:scale-110 group-hover:bg-accent/10 transition-all duration-300 blur-sm" />
      </CardContent>
    </Card>
  );
};
