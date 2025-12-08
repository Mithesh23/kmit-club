import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNoticeBoard } from '@/hooks/useNoticeBoard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  X,
  Bell,
  ChevronRight,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow, isAfter, isBefore, startOfDay, endOfDay, isToday } from 'date-fns';
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

  // Statistics
  const stats = useMemo(() => {
    if (!notices) return { total: 0, announcements: 0, events: 0, newToday: 0 };
    return {
      total: notices.length,
      announcements: notices.filter(n => n.type === 'announcement').length,
      events: notices.filter(n => n.type === 'event').length,
      newToday: notices.filter(n => isToday(parseISO(n.createdAt))).length,
    };
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/10 animate-pulse" />
            <Loader2 className="h-8 w-8 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground">Loading notices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Error Loading Notices</h2>
          <p className="text-muted-foreground">Please try refreshing the page</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Page
          </Button>
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="rounded-full hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                    <Bell className="h-5 w-5 text-primary-foreground" />
                  </div>
                  {stats.newToday > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                      {stats.newToday}
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold text-foreground">Notice Board</h1>
                  <p className="text-xs text-muted-foreground">KMIT Club Updates</p>
                </div>
              </div>
            </div>
            <img src={kmitLogo} alt="KMIT Logo" className="h-10 w-10 object-contain" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 overflow-hidden relative group hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20 overflow-hidden relative group hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Announcements</p>
                  <p className="text-2xl font-bold text-foreground">{stats.announcements}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Megaphone className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20 overflow-hidden relative group hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Events</p>
                  <p className="text-2xl font-bold text-foreground">{stats.events}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20 overflow-hidden relative group hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">New Today</p>
                  <p className="text-2xl font-bold text-foreground">{stats.newToday}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Section */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search notices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base bg-muted/50 border-0 rounded-xl focus-visible:ring-2 focus-visible:ring-primary/50"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Tabs + Filters */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <Tabs value={typeFilter} onValueChange={setTypeFilter} className="w-full md:w-auto">
              <TabsList className="grid w-full md:w-auto grid-cols-3 h-11 bg-muted/50 p-1 rounded-xl">
                <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  All
                </TabsTrigger>
                <TabsTrigger value="announcement" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Megaphone className="h-4 w-4 mr-1.5" />
                  Announcements
                </TabsTrigger>
                <TabsTrigger value="event" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Calendar className="h-4 w-4 mr-1.5" />
                  Events
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-2 flex-1 md:justify-end">
              <Select value={clubFilter} onValueChange={setClubFilter}>
                <SelectTrigger className="w-full md:w-[180px] h-11 bg-muted/50 border-0 rounded-xl">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All Clubs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clubs</SelectItem>
                  {uniqueClubs.map(club => (
                    <SelectItem key={club} value={club}>{club}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full md:w-[140px] h-11 bg-muted/50 border-0 rounded-xl">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFilters}
                  className="h-11 w-11 rounded-xl bg-muted/50 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Results Count */}
          {hasActiveFilters && (
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filteredNotices.length}</span> of {notices?.length || 0} notices
            </p>
          )}
        </div>

        {/* Notices List */}
        {filteredNotices.length > 0 ? (
          <div className="space-y-3">
            {filteredNotices.map((notice, index) => (
              <Card
                key={notice.id}
                className={`group cursor-pointer bg-card hover:bg-accent/50 border border-border/50 hover:border-border transition-all duration-300 hover:shadow-xl overflow-hidden animate-fade-in ${
                  notice.isNew ? 'ring-1 ring-green-500/30' : ''
                }`}
                onClick={() => handleNoticeClick(notice)}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    {/* Left Accent Bar */}
                    <div className={`w-1.5 shrink-0 ${
                      notice.type === 'announcement' 
                        ? 'bg-gradient-to-b from-amber-400 to-amber-600' 
                        : 'bg-gradient-to-b from-blue-400 to-blue-600'
                    }`} />

                    <div className="flex-1 p-4 md:p-5">
                      <div className="flex items-start gap-4">
                        {/* Club Logo */}
                        <div className="hidden sm:block shrink-0">
                          {notice.clubLogo ? (
                            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-border shadow-sm group-hover:scale-105 transition-transform">
                              <img
                                src={notice.clubLogo}
                                alt={notice.clubName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform ${
                              notice.clubId === 'kmit'
                                ? 'bg-gradient-to-br from-primary to-primary/70'
                                : 'bg-gradient-to-br from-muted-foreground/70 to-muted-foreground'
                            }`}>
                              <Building2 className="h-5 w-5 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Meta Row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="secondary"
                              className={`text-xs font-medium ${
                                notice.type === 'announcement'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}
                            >
                              {notice.type === 'announcement' ? (
                                <><Megaphone className="h-3 w-3 mr-1" />Announcement</>
                              ) : (
                                <><Calendar className="h-3 w-3 mr-1" />Event</>
                              )}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-medium">{notice.clubName}</span>
                            {notice.isNew && (
                              <Badge className="bg-green-500/90 text-white text-xs px-1.5 py-0 h-5 animate-pulse">
                                <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                                New
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(parseISO(notice.createdAt), { addSuffix: true })}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-base md:text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {notice.title}
                          </h3>

                          {/* Content Preview */}
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notice.content}
                          </p>

                          {/* Event Date */}
                          {notice.type === 'event' && notice.eventDate && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(parseISO(notice.eventDate), 'EEE, MMM d, yyyy')}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Arrow */}
                        <div className="hidden md:flex items-center shrink-0">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                            <ChevronRight className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No notices found</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {hasActiveFilters 
                ? "Try adjusting your search or filters to find what you're looking for." 
                : "Check back later for new announcements and upcoming events."}
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline" className="rounded-xl">
                <X className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-8 py-6 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 KMIT Club Connect · Stay informed, stay connected
          </p>
        </div>
      </footer>
    </div>
  );
};

export default NoticeBoard;
