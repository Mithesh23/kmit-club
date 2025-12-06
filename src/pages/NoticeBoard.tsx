import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNoticeBoard } from '@/hooks/useNoticeBoard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Megaphone, 
  Calendar, 
  Clock, 
  Building2,
  Loader2,
  Sparkles,
  Search,
  Filter,
  X
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import kmitLogo from '@/assets/kmit-logo.png';

const NoticeBoard = () => {
  const navigate = useNavigate();
  const { data: notices, isLoading, error } = useNoticeBoard();
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [clubFilter, setClubFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Get unique club names for filter dropdown
  const uniqueClubs = useMemo(() => {
    if (!notices) return [];
    const clubs = [...new Set(notices.map(n => n.clubName))];
    return clubs.sort();
  }, [notices]);

  // Filter notices
  const filteredNotices = useMemo(() => {
    if (!notices) return [];
    
    return notices.filter(notice => {
      // Search filter
      const matchesSearch = searchQuery.trim() === '' || 
        notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notice.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notice.clubName.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Type filter
      const matchesType = typeFilter === 'all' || notice.type === typeFilter;
      
      // Club filter
      const matchesClub = clubFilter === 'all' || notice.clubName === clubFilter;
      
      // Date filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const noticeDate = parseISO(notice.createdAt);
        const today = new Date();
        
        if (dateFilter === 'today') {
          matchesDate = isAfter(noticeDate, startOfDay(today)) && isBefore(noticeDate, endOfDay(today));
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesDate = isAfter(noticeDate, weekAgo);
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          matchesDate = isAfter(noticeDate, monthAgo);
        }
      }
      
      return matchesSearch && matchesType && matchesClub && matchesDate;
    });
  }, [notices, searchQuery, typeFilter, clubFilter, dateFilter]);

  const hasActiveFilters = searchQuery || typeFilter !== 'all' || clubFilter !== 'all' || dateFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setClubFilter('all');
    setDateFilter('all');
  };

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
        navigate(`/kmit-events/${notice.eventId}`);
      } else {
        navigate(`/club/${notice.clubId}/event/${notice.eventId}`);
      }
    } else {
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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Search & Filters */}
          <Card className="bg-white/80 backdrop-blur-sm border-amber-200/50">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search notices by title, content, or club..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-amber-200 focus:border-amber-400"
                  />
                </div>

                {/* Filter Row */}
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span>Filters:</span>
                  </div>

                  {/* Type Filter */}
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[140px] bg-white border-amber-200">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="announcement">Announcements</SelectItem>
                      <SelectItem value="event">Events</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Club Filter */}
                  <Select value={clubFilter} onValueChange={setClubFilter}>
                    <SelectTrigger className="w-[160px] bg-white border-amber-200">
                      <SelectValue placeholder="Club" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clubs</SelectItem>
                      {uniqueClubs.map(club => (
                        <SelectItem key={club} value={club}>{club}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Date Filter */}
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-[130px] bg-white border-amber-200">
                      <SelectValue placeholder="Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notice Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 px-4 py-2">
                <Megaphone className="h-4 w-4 mr-2" />
                {filteredNotices.filter(n => n.type === 'announcement').length} Announcements
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 px-4 py-2">
                <Calendar className="h-4 w-4 mr-2" />
                {filteredNotices.filter(n => n.type === 'event').length} Events
              </Badge>
            </div>
            {hasActiveFilters && (
              <span className="text-sm text-muted-foreground">
                Showing {filteredNotices.length} of {notices?.length || 0} notices
              </span>
            )}
          </div>

          {/* Notices List */}
          {filteredNotices.length > 0 ? (
            <div className="space-y-4">
              {filteredNotices.map((notice, index) => (
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
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                <Search className="h-10 w-10 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No Notices Found</h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters 
                  ? "Try adjusting your search or filters" 
                  : "Check back later for announcements and events"}
              </p>
              {hasActiveFilters && (
                <Button onClick={clearFilters} variant="outline" className="border-amber-300">
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
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
