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
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-orange-50/20 relative overflow-hidden">
      {/* Modern Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float opacity-40" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-accent/8 rounded-full blur-3xl animate-float opacity-50" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float opacity-30" style={{ animationDelay: '4s' }} />
        
        {/* Subtle Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.02]">
          <svg className="w-full h-full" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="modern-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#modern-grid)" />
          </svg>
        </div>
      </div>

      {/* Modern Clean Header */}
      <header className="relative bg-white/80 backdrop-blur-lg border-b border-border shadow-lg">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="animate-fade-in space-y-3 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-gradient">
                KMIT Clubs Hub
              </h1>
              <p className="text-muted-foreground text-lg font-medium">
                Keshav Memorial Institute of Technology
              </p>
              <div className="w-24 h-1 bg-gradient-primary rounded-full mx-auto md:mx-0"></div>
            </div>
            <div className="animate-scale-in">
              <ClubLoginDialog />
            </div>
          </div>
        </div>
      </header>

      {/* Modern Clean Hero Section */}
      <section className="relative py-24">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-5xl mx-auto animate-fade-in space-y-16">
            {/* Main Hero Title */}
            <div className="space-y-8">
              <h2 className="text-6xl md:text-7xl lg:text-8xl font-display font-bold leading-tight">
                <span className="block text-foreground">Discover Your</span>
                <span className="block text-gradient">
                  Passion
                </span>
              </h2>
              <div className="w-24 h-2 bg-gradient-primary mx-auto rounded-full"></div>
            </div>
            
            {/* Clean Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Join extraordinary communities, develop cutting-edge skills, and create lasting connections
              <span className="block mt-3 text-primary font-semibold">
                through our diverse range of student organizations
              </span>
            </p>
            
            {/* Clean Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto pt-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-border text-center space-y-3 hover:shadow-xl transition-all duration-300">
                <div className="text-4xl font-bold text-gradient">{clubs?.length || 0}+</div>
                <div className="text-lg text-muted-foreground font-medium">Active Clubs</div>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-border text-center space-y-3 hover:shadow-xl transition-all duration-300">
                <div className="text-4xl font-bold text-gradient">500+</div>
                <div className="text-lg text-muted-foreground font-medium">Members</div>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-border text-center space-y-3 hover:shadow-xl transition-all duration-300">
                <div className="text-4xl font-bold text-gradient">100+</div>
                <div className="text-lg text-muted-foreground font-medium">Events</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clubs Section - Clean Modern Design */}
      <main className="relative py-20 bg-gray-50/50">
        <div className="container mx-auto px-6">
          {/* Section Header - Clean & Aligned */}
          <div className="text-center mb-16 animate-slide-up space-y-6">
            <div className="space-y-4">
              <h3 className="text-4xl md:text-5xl font-display font-bold">
                Explore Our <span className="text-gradient">Student Clubs</span>
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

          {/* Clean Clubs Grid */}
          {clubs && clubs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {clubs.map((club, index) => (
                <div 
                  key={club.id}
                  className="animate-scale-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ClubCard club={club} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 animate-fade-in space-y-6">
              <div className="w-24 h-24 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <div className="text-3xl">🚀</div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-display font-bold text-gradient">Clubs Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Student organizations are being prepared. 
                  <span className="block mt-2 text-primary font-medium">
                    Great opportunities await!
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

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
                <li><a href="#" className="hover:text-primary transition-colors">Campus Resources</a></li>
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
      </footer>
    </div>
  );
};

export default Home;
