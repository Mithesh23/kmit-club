import { useClubs } from '@/hooks/useClubs';
import { ClubCard } from '@/components/ClubCard';
import { ClubLoginDialog } from '@/components/ClubLoginDialog';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Loader2, Key } from 'lucide-react';

const Home = () => {
  const { data: clubs, isLoading, error } = useClubs();

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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Professional Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float opacity-60" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-accent/15 rounded-full blur-3xl animate-float opacity-80" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float opacity-40" style={{ animationDelay: '4s' }} />
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="professional-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#professional-grid)" />
          </svg>
        </div>
      </div>

      {/* Professional Header */}
      <header className="relative bg-card/50 backdrop-blur-glass border-b border-border shadow-elegant">
        <div className="container mx-auto px-6 py-8">
          <div className="symmetric-flex">
            <div className="animate-fade-in space-y-2">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-gradient text-neon">
                KMIT Clubs
              </h1>
              <p className="text-muted-foreground font-medium text-lg">
                Keshav Memorial Institute of Technology
              </p>
              <div className="w-16 h-1 bg-gradient-primary rounded-full"></div>
            </div>
            <div className="animate-scale-in">
              <ClubLoginDialog />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Professional Design */}
      <section className="relative py-32">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-6xl mx-auto animate-fade-in space-y-12">
            {/* Main Hero Title */}
            <div className="space-y-8">
              <h2 className="text-7xl md:text-8xl lg:text-9xl font-display font-bold leading-tight">
                <span className="block text-foreground">Discover Your</span>
                <span className="block text-gradient text-neon animate-pulse-glow">
                  Passion
                </span>
              </h2>
              <div className="w-32 h-2 bg-gradient-primary mx-auto rounded-full glow-primary"></div>
            </div>
            
            {/* Enhanced Subtitle */}
            <p className="text-2xl md:text-3xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Join extraordinary communities, develop cutting-edge skills, and create lasting connections
              <span className="block mt-4 text-primary font-semibold text-xl">
                through our diverse range of professional student organizations
              </span>
            </p>
            
            {/* Professional Stats Section */}
            <div className="symmetric-flex max-w-4xl mx-auto pt-8">
              <div className="card-neon p-8 rounded-2xl text-center space-y-3 glow-primary">
                <div className="text-5xl font-bold text-gradient">{clubs?.length || 0}+</div>
                <div className="text-lg text-muted-foreground font-semibold">Active Clubs</div>
              </div>
              <div className="card-neon p-8 rounded-2xl text-center space-y-3 glow-accent">
                <div className="text-5xl font-bold text-gradient">500+</div>
                <div className="text-lg text-muted-foreground font-semibold">Members</div>
              </div>
              <div className="card-neon p-8 rounded-2xl text-center space-y-3 glow-primary">
                <div className="text-5xl font-bold text-gradient">100+</div>
                <div className="text-lg text-muted-foreground font-semibold">Events</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clubs Section - Professional Design */}
      <main className="relative py-24 bg-card/20">
        <div className="container mx-auto px-6">
          {/* Section Header - Professional & Symmetric */}
          <div className="text-center mb-20 animate-slide-up space-y-8">
            <div className="space-y-6">
              <h3 className="text-5xl md:text-6xl font-display font-bold">
                Explore Our <span className="text-gradient text-neon">Student Clubs</span>
              </h3>
              <div className="w-32 h-2 bg-gradient-primary mx-auto rounded-full glow-primary" />
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Each club offers unique opportunities for professional growth, innovative learning, and meaningful connections. 
              <span className="block mt-3 text-primary font-semibold">
                Find your community and accelerate your journey to excellence.
              </span>
            </p>
          </div>

          {/* Professional Clubs Grid */}
          {clubs && clubs.length > 0 ? (
            <div className="symmetric-grid max-w-7xl mx-auto">
              {clubs.map((club, index) => (
                <div 
                  key={club.id}
                  className="animate-scale-in hover-lift"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <ClubCard club={club} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 animate-fade-in space-y-8">
              <div className="w-32 h-32 mx-auto rounded-3xl bg-card border-2 border-primary/30 flex items-center justify-center glow-primary">
                <div className="text-4xl">🚀</div>
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-display font-bold text-gradient">Exceptional Clubs Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto text-lg leading-relaxed">
                  Revolutionary student organizations are being curated. 
                  <span className="block mt-2 text-primary font-semibold">
                    Prepare for extraordinary opportunities!
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Professional Footer */}
      <footer className="relative bg-card/50 backdrop-blur-glass border-t border-border shadow-elegant mt-20">
        <div className="container mx-auto px-6 py-16">
          <div className="symmetric-grid mb-12">
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-2xl font-display font-bold text-gradient">KMIT Club Connect</h4>
                <div className="w-12 h-1 bg-gradient-primary rounded-full"></div>
              </div>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Empowering students through professional communities, innovative learning, and transformative experiences.
              </p>
            </div>
            
            <div className="space-y-6">
              <h5 className="text-xl font-display font-semibold text-foreground">Quick Links</h5>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors hover:translate-x-2 inline-block">About KMIT</a></li>
                <li><a href="#" className="hover:text-primary transition-colors hover:translate-x-2 inline-block">Student Life</a></li>
                <li><a href="#" className="hover:text-primary transition-colors hover:translate-x-2 inline-block">Academic Programs</a></li>
                <li><a href="#" className="hover:text-primary transition-colors hover:translate-x-2 inline-block">Campus Resources</a></li>
              </ul>
            </div>
            
            <div className="space-y-6">
              <h5 className="text-xl font-display font-semibold text-foreground">Contact Us</h5>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-center space-x-3">
                  <span className="text-primary">✉</span>
                  <span>clubs@kmit.ac.in</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="text-primary">📞</span>
                  <span>+91 40 2766 1881</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="text-primary">📍</span>
                  <span>Narayanguda, Hyderabad</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 text-center">
            <p className="text-muted-foreground text-lg">
              © 2025 Keshav Memorial Institute of Technology. 
              <span className="text-primary font-semibold">Crafting Excellence.</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
