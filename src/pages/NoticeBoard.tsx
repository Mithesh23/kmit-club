import { useNavigate } from 'react-router-dom';
import { useNoticeBoard } from '@/hooks/useNoticeBoard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Megaphone, 
  Calendar, 
  Clock, 
  Building2,
  Loader2,
  Sparkles
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import kmitLogo from '@/assets/kmit-logo.png';

const NoticeBoard = () => {
  const navigate = useNavigate();
  const { data: notices, isLoading, error } = useNoticeBoard();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50/30 to-yellow-50/20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50/30 to-yellow-50/20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Notices</h2>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  const handleNoticeClick = (notice: any) => {
    if (notice.type === 'event') {
      if (notice.clubId === 'kmit') {
        // Navigate to KMIT event
        navigate(`/kmit-events/${notice.eventId}`);
      } else {
        // Navigate to club event
        navigate(`/club/${notice.clubId}/event/${notice.eventId}`);
      }
    } else {
      // Navigate to club page for announcements
      navigate(`/club/${notice.clubId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-yellow-50/20 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-40 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-orange-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-yellow-200/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative bg-white/90 backdrop-blur-lg border-b border-amber-200/50 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="hover:bg-amber-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg">
                  <Megaphone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-display font-bold text-gradient">KMIT Notice Board</h1>
                  <p className="text-sm text-muted-foreground">Stay updated with club announcements & events</p>
                </div>
              </div>
            </div>
            <img src={kmitLogo} alt="KMIT Logo" className="h-12 w-12 object-contain" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 relative z-10">
        {notices && notices.length > 0 ? (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Notice Stats */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 px-4 py-2">
                  <Megaphone className="h-4 w-4 mr-2" />
                  {notices.filter(n => n.type === 'announcement').length} Announcements
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 px-4 py-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  {notices.filter(n => n.type === 'event').length} Upcoming Events
                </Badge>
              </div>
            </div>

            {/* Notices List */}
            <div className="space-y-4">
              {notices.map((notice, index) => (
                <Card
                  key={notice.id}
                  className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-l-4 ${
                    notice.type === 'announcement'
                      ? 'border-l-amber-500 hover:border-l-amber-600'
                      : 'border-l-blue-500 hover:border-l-blue-600'
                  } ${notice.isNew ? 'ring-2 ring-green-400/50 ring-offset-2' : ''}`}
                  onClick={() => handleNoticeClick(notice)}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Club Logo / Icon */}
                      <div className="flex-shrink-0">
                        {notice.clubLogo ? (
                          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-100 shadow-sm">
                            <img
                              src={notice.clubLogo}
                              alt={notice.clubName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm ${
                            notice.clubId === 'kmit'
                              ? 'bg-gradient-to-br from-primary to-primary/80'
                              : 'bg-gradient-to-br from-gray-600 to-gray-700'
                          }`}>
                            <Building2 className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Notice Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Type Badge */}
                            <Badge
                              variant={notice.type === 'announcement' ? 'secondary' : 'default'}
                              className={
                                notice.type === 'announcement'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-blue-100 text-blue-700'
                              }
                            >
                              {notice.type === 'announcement' ? (
                                <>
                                  <Megaphone className="h-3 w-3 mr-1" />
                                  Announcement
                                </>
                              ) : (
                                <>
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Event
                                </>
                              )}
                            </Badge>

                            {/* Club Name */}
                            <Badge variant="outline" className="text-xs">
                              {notice.clubName}
                            </Badge>

                            {/* New Badge */}
                            {notice.isNew && (
                              <Badge className="bg-green-500 text-white animate-pulse">
                                <Sparkles className="h-3 w-3 mr-1" />
                                New
                              </Badge>
                            )}
                          </div>

                          {/* Time */}
                          <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(parseISO(notice.createdAt), { addSuffix: true })}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-1">
                          {notice.title}
                        </h3>

                        {/* Content Preview */}
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {notice.content}
                        </p>

                        {/* Event Date (if applicable) */}
                        {notice.type === 'event' && notice.eventDate && (
                          <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Event on {format(parseISO(notice.eventDate), 'PPP')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Arrow Indicator */}
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <ArrowLeft className="h-4 w-4 text-primary rotate-180" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
              <Megaphone className="h-12 w-12 text-amber-500" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-3">
              No Notices Yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Check back later for announcements and upcoming events from KMIT clubs.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative bg-white/80 border-t border-amber-200/50 mt-16 py-6">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 KMIT Club Connect. Stay informed, stay connected.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default NoticeBoard;
