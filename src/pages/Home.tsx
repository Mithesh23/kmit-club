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
    <div className="min-h-screen bg-gradient-to-br from-accent to-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">KMIT Clubs</h1>
            <p className="text-sm text-muted-foreground">Keshav Memorial Institute of Technology</p>
          </div>
          <ClubLoginDialog />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Explore Our Student Clubs
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover amazing opportunities to grow, learn, and connect with like-minded students
            through our diverse range of clubs and organizations.
          </p>
        </div>

        {/* Clubs Grid */}
        {clubs && clubs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {clubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Clubs Found</h3>
            <p className="text-muted-foreground">Clubs will appear here once they are added.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-muted-foreground">
            © 2024 Keshav Memorial Institute of Technology. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;