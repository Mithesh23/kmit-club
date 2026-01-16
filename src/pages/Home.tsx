import { useState, useRef } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { useClubs } from '@/hooks/useClubs';
import { useHasNewNotices } from '@/hooks/useNoticeBoard';
import { ClubCard } from '@/components/ClubCard';
import { ClubLoginDialog } from '@/components/ClubLoginDialog';
import { HeroCarousel } from '@/components/HeroCarousel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ChevronRight, Megaphone } from 'lucide-react';
import heroImage from '@/assets/kmit-campus-hero.jpg';
import kmitCampusGroup from '@/assets/kmit-campus-group.jpeg';
import kmitCampusBuilding from '@/assets/kmit-campus-building.jpeg';
import kmitAuditorium from '@/assets/kmit-auditorium.jpg';
import kmitCampusExtra from '@/assets/kmit-campus-extra.avif';
import kmitLogo from '@/assets/kmit-logo.png';
import { transformImageUrl } from '@/lib/utils';
const Home = () => {
  const {
    data: clubs,
    isLoading,
    error
  } = useClubs();
  const hasNewNotices = useHasNewNotices();
  const navigate = useNavigate();
  const [showAllClubs, setShowAllClubs] = useState(false);
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Clubs</h2>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>;
  }

  // Filter only active clubs
  const activeClubs = clubs?.filter(club => club.is_active !== false) || [];
  // Get featured clubs (first 3 active clubs)
  const featuredClubs = activeClubs.slice(0, 3);
  // Get remaining clubs for carousel
  const exploreClubs = activeClubs.slice(3);
  // All clubs for "See All" view
  const allClubs = activeClubs;

  // Hero carousel images
  const heroImages = [
    heroImage,
    kmitCampusGroup,
    kmitCampusBuilding,
    kmitAuditorium,
    kmitCampusExtra,
  ];
  return <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-orange-50/20 relative overflow-hidden">
      {/* Modern Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float opacity-40" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-accent/8 rounded-full blur-3xl animate-float opacity-50" style={{
        animationDelay: '2s'
      }} />
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float opacity-30" style={{
        animationDelay: '4s'
      }} />
        
        {/* Subtle Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.02]">
          <svg className="w-full h-full" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="modern-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#modern-grid)" />
          </svg>
        </div>
      </div>

      {/* Modern Clean Header */}
      <header className="relative bg-white/80 backdrop-blur-lg border-b border-border shadow-lg">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-8">
            <div className="animate-fade-in flex items-center gap-3 lg:gap-4">
              <img 
                src={kmitLogo} 
                alt="KMIT Logo" 
                className="w-14 h-14 sm:w-20 sm:h-20 lg:w-[100px] lg:h-[100px] object-contain flex-shrink-0"
              />
              <div className="space-y-1 sm:space-y-2 lg:space-y-3">
                <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-display text-gradient font-bold whitespace-nowrap">
                  Keshav Memorial Institute of Technology
                </h1>
                <p className="text-muted-foreground text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-normal">
                  KMIT Clubs Hub 
                </p>
                <div className="w-16 sm:w-20 lg:w-24 h-1 bg-gradient-primary rounded-full"></div>
              </div>
            </div>

            <div className="animate-scale-in flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/notice-board')}
                className="border-amber-500/30 hover:bg-amber-500/10 text-amber-700 px-2 sm:px-4 py-2 text-xs sm:text-sm flex items-center whitespace-nowrap"
              >
                <Megaphone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Notice
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/student/login')}
                className="border-primary/30 hover:bg-primary/10 px-2 sm:px-4 py-2 text-xs sm:text-sm flex items-center whitespace-nowrap"
              >
                Student Login
              </Button>

              <ClubLoginDialog buttonSize="sm" />
            </div>


            
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <HeroCarousel images={heroImages} interval={5000} />
        <div className="relative z-10 text-center text-white space-y-6 max-w-4xl mx-auto px-6">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            One Hub for Every Club
          </h1>
          <p className="text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto">
            Discover, join, manage, and celebrate KMIT's vibrant clubs & events—
            <br />
            centralized, real-time, and audit-ready.
          </p>


          {/* <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button size="lg" className="bg-white text-foreground hover:bg-gray-100 px-8 py-3 text-lg font-medium" onClick={() => {
            const featuredSection = document.getElementById('featured');
            featuredSection?.scrollIntoView({
              behavior: 'smooth'
            });
          }}>
              Explore Clubs
            </Button>
          </div> */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
  
  {/* Explore Clubs Button */}
<Button
    size="lg"
    className="bg-white text-foreground hover:bg-gray-100 px-8 py-3 text-lg font-medium"
    onClick={() => {
      const featuredSection = document.getElementById("featured");
      featuredSection?.scrollIntoView({ behavior: "smooth" });
    }}
  >
    Explore Clubs
  </Button>

  {/* KMIT Events Button - Same Styling */}
  <Button
    size="lg"
    className="bg-white text-foreground hover:bg-gray-100 px-8 py-3 text-lg font-medium"
    onClick={() => navigate("/kmit-events")}
  >
    KMIT Events
  </Button>

</div>






        </div>
      </section>

      {/* Featured Clubs Section */}
      <section id="featured" className="py-20 bg-gray-50/50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-display font-bold">
                {showAllClubs ? 'All Clubs' : 'Featured Clubs'}
              </h2>
              <div className="w-20 h-1 bg-gradient-primary rounded-full" />
            </div>
            <Button variant="outline" className="text-primary hover:bg-primary hover:text-white" onClick={() => setShowAllClubs(!showAllClubs)}>
              {showAllClubs ? 'Show Featured' : 'See all'}
            </Button>
          </div>
          
          {(showAllClubs ? allClubs : featuredClubs).length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {(showAllClubs ? allClubs : featuredClubs).map((club, index) => <div key={club.id} className="animate-fade-in" style={{
            animationDelay: `${index * 150}ms`
          }}>
                  <ClubCard club={club} />
                </div>)}
            </div> : <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No clubs available at the moment.</p>
            </div>}
        </div>
      </section>

      {/* Explore More Clubs Carousel Section - Only show if not showing all clubs */}
      {!showAllClubs && exploreClubs.length > 0 && <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 animate-slide-up space-y-6">
              <div className="space-y-4">
                <h3 className="text-4xl md:text-5xl font-display font-bold">
                  Explore More <span className="text-gradient">Student Clubs</span>
                </h3>
                <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full" />
              </div>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Each club offers unique opportunities for growth, learning, and meaningful connections.
                <span className="block mt-3 text-primary font-semibold">
                  Find your community and accelerate your journey to excellence.
                </span>
              </p>
            </div>
            
            <div className="max-w-6xl mx-auto">
              <Carousel 
                opts={{
                  align: "start",
                  loop: true
                }} 
                plugins={[
                  Autoplay({
                    delay: 3000,
                    stopOnInteraction: false,
                    stopOnMouseEnter: true,
                  }),
                ]}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {exploreClubs.map(club => <CarouselItem key={club.id} className="pl-4 md:basis-1/2 lg:basis-1/4">
                      <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 group" onClick={() => navigate(`/club/${club.id}`)}>
                        <CardContent className="flex flex-col items-center p-6 space-y-4">
                          {/* Circular Club Logo */}
                          {club.logo_url ? <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300">
                              <img src={transformImageUrl(club.logo_url)} alt={`${club.name} logo`} className="w-full h-full object-cover" />
                            </div> : <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-105 transition-transform duration-300">
                              {club.name.charAt(0)}
                            </div>}
                          
                          {/* Club Name */}
                          <h3 className="text-lg font-semibold text-center text-foreground group-hover:text-primary transition-colors">
                            {club.name}
                          </h3>
                        </CardContent>
                      </Card>
                    </CarouselItem>)}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex" />
                <CarouselNext className="hidden md:flex" />
              </Carousel>
            </div>
          </div>
        </section>}

      {/* Clean Modern Footer */}
      <footer className="relative bg-white border-t border-border shadow-lg mt-16">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-xl font-display font-bold text-gradient">KMIT Club Connect</h4>
                <div className="w-12 h-1 bg-gradient-primary rounded-full"></div>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Empowering students through communities, learning, and transformative experiences.
              </p>
            </div>
            
            <div className="space-y-4">
              <h5 className="text-lg font-display font-semibold text-foreground">Quick Links</h5>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About KMIT</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Student Life</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Academic Programs</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Verify Event Certificate</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h5 className="text-lg font-display font-semibold text-foreground">Contact</h5>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-center space-x-2">
                  <span className="text-primary">✉</span>
                  <span>clubs@kmit.ac.in</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-primary">📞</span>
                  <span>+91 40 2766 1881</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-primary">📍</span>
                  <span>Narayanguda, Hyderabad</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-6 text-center">
            <p className="text-muted-foreground">
              © 2025 Keshav Memorial Institute of Technology. 
              <span className="text-primary font-medium">Crafting Excellence.</span>
            </p>
          </div>
        </div>

        {/* Typing + Glow + Slide Down (10 sec) */}
<div className="fixed bottom-6 right-6 z-50 signature-container">
  <div className="px-4 py-2 rounded-full bg-black/80 text-white text-sm shadow-lg backdrop-blur-md glow-pulse">
    <span className="typing-effect block w-fit">by Mithesh Pulluri</span>
  </div>
</div>

      </footer>
    </div>;
};
export default Home;
