import { useClubs } from '@/hooks/useClubs';
import { ClubCard } from '@/components/ClubCard';
import { ClubLoginDialog } from '@/components/ClubLoginDialog';
import { Loader2 } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-accent-light to-primary-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-accent/10 to-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-primary/5 to-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-glass border-b border-white/20 shadow-elegant">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl font-display font-bold text-gradient mb-1">
                KMIT Clubs
              </h1>
              <p className="text-muted-foreground font-medium">
                Keshav Memorial Institute of Technology
              </p>
            </div>
            <div className="animate-scale-in">
              <ClubLoginDialog />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-6xl md:text-7xl font-display font-bold text-gradient mb-6 leading-tight">
              Discover Your 
              <span className="block">Passion</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
              Join amazing communities, develop new skills, and create lasting friendships 
              through our diverse range of student clubs and organizations.
            </p>
            <div className="flex justify-center space-x-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{clubs?.length || 0}+</div>
                <div className="text-sm text-muted-foreground">Active Clubs</div>
              </div>
              <div className="w-px bg-border mx-4" />
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">500+</div>
                <div className="text-sm text-muted-foreground">Members</div>
              </div>
              <div className="w-px bg-border mx-4" />
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">100+</div>
                <div className="text-sm text-muted-foreground">Events</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="relative container mx-auto px-6 pb-20">
        <div className="text-center mb-16 animate-slide-up">
          <h3 className="text-4xl font-display font-semibold mb-4">
            Explore Our <span className="text-gradient">Student Clubs</span>
          </h3>
          <div className="w-24 h-1 bg-gradient-primary mx-auto rounded-full mb-6" />
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Each club offers unique opportunities for growth, learning, and connection. 
            Find your community and start your journey today.
          </p>
        </div>

        {/* Clubs Grid */}
        {clubs && clubs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
          <div className="text-center py-20 animate-fade-in">
            <div className="w-24 h-24 bg-gradient-secondary rounded-full mx-auto mb-6 flex items-center justify-center">
              <div className="text-2xl">🎯</div>
            </div>
            <h3 className="text-2xl font-display font-semibold text-muted-foreground mb-3">
              No Clubs Yet
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Exciting clubs are being added! Check back soon to discover amazing opportunities.
            </p>
          </div>
        )}
      </main>

      {/* Enhanced Footer */}
      <footer className="relative bg-white/80 backdrop-blur-glass border-t border-white/20 mt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-display font-semibold text-lg mb-4">KMIT Club Connect</h4>
              <p className="text-muted-foreground leading-relaxed">
                Connecting students with opportunities for growth, learning, and community building.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Quick Links</h5>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About KMIT</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Student Life</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Academic Programs</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Campus Resources</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Contact</h5>
              <ul className="space-y-2 text-muted-foreground">
                <li>📧 clubs@kmit.ac.in</li>
                <li>📞 +91 40 2766 1881</li>
                <li>📍 Narayanguda, Hyderabad</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center">
            <p className="text-muted-foreground">
              © 2024 Keshav Memorial Institute of Technology. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;