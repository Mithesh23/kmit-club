import { useClubs } from '@/hooks/useClubs';
import { ClubCard } from '@/components/ClubCard';
import { ClubLoginDialog } from '@/components/ClubLoginDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ChevronRight } from 'lucide-react';
import heroImage from '@/assets/kmit-campus-hero.jpg';

const Home = () => {
  const { data: clubs, isLoading, error } = useClubs();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Clubs</h2>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  // Get featured clubs (first 3 clubs)
  const featuredClubs = clubs?.slice(0, 3) || [];
  // Get remaining clubs for carousel
  const exploreClubs = clubs?.slice(3) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <header className="relative bg-white border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-bold text-foreground">KMIT CLUBS HUB</span>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-primary font-medium border-b-2 border-primary pb-1">
                Home
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Clubs
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Events
              </Link>
            </nav>
            
            {/* Login Button */}
            <ClubLoginDialog />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="relative h-[600px] bg-cover bg-center bg-no-repeat flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${heroImage})`
        }}
      >
        <div className="text-center text-white space-y-6 max-w-4xl mx-auto px-6">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            One Hub for Every Club
          </h1>
          <p className="text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto">
            Discover, join, manage, and celebrate KMIT's vibrant clubs & events—
            <br />
            centralized, real-time, and audit-ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button 
              size="lg" 
              className="bg-white text-foreground hover:bg-gray-100 px-8 py-3 text-lg font-medium"
              onClick={() => navigate('#featured')}
            >
              Explore Clubs
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-foreground px-8 py-3 text-lg font-medium"
            >
              View Events
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Clubs Section */}
      <section id="featured" className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-2">Featured Clubs</h2>
              <div className="w-16 h-1 bg-primary"></div>
            </div>
            <Button variant="outline" className="text-primary hover:bg-primary hover:text-white">
              See all
            </Button>
          </div>
          
          {featuredClubs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredClubs.map((club, index) => (
                <div 
                  key={club.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <ClubCard club={club} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No clubs available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Explore More Clubs Carousel Section */}
      {exploreClubs.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-foreground mb-2">Explore More Clubs</h2>
              <div className="w-16 h-1 bg-primary mx-auto"></div>
            </div>
            
            <div className="max-w-6xl mx-auto">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {exploreClubs.map((club) => (
                    <CarouselItem key={club.id} className="pl-4 md:basis-1/2 lg:basis-1/4">
                      <Card 
                        className="cursor-pointer hover:shadow-lg transition-all duration-300 group"
                        onClick={() => navigate(`/club/${club.id}`)}
                      >
                        <CardContent className="flex flex-col items-center p-6 space-y-4">
                          {/* Circular Club Logo */}
                          <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-105 transition-transform duration-300">
                            {club.name.charAt(0)}
                          </div>
                          
                          {/* Club Name */}
                          <h3 className="text-lg font-semibold text-center text-foreground group-hover:text-primary transition-colors">
                            {club.name}
                          </h3>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex" />
                <CarouselNext className="hidden md:flex" />
              </Carousel>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-border py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-muted-foreground">
            © 2025 Keshav Memorial Institute of Technology. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
