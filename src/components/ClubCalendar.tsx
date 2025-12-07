import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, CalendarDays, Sparkles } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addMonths, 
  subMonths, 
  isSameMonth, 
  parseISO, 
  isPast, 
  isToday,
  addDays
} from 'date-fns';
import { Event } from '@/types/club';

interface ClubCalendarProps {
  events: Event[];
  clubId: string;
}

export const ClubCalendar = ({ events, clubId }: ClubCalendarProps) => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>();
    events.forEach(event => {
      if (event.event_date) {
        const dateKey = format(parseISO(event.event_date), 'yyyy-MM-dd');
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, event]);
      }
    });
    return map;
  }, [events]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days: Date[] = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const getEventStatus = (event: Event) => {
    if (!event.event_date) return 'upcoming';
    const eventDate = parseISO(event.event_date);
    if (isToday(eventDate)) return 'today';
    if (isPast(eventDate)) return 'past';
    return 'upcoming';
  };

  return (
    <Card className="card-elegant border-0 shadow-lg overflow-hidden animate-fade-in">
      <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 via-transparent to-accent/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-3 text-2xl font-display">
            <div className="p-2.5 bg-gradient-primary rounded-xl shadow-lg animate-scale-in">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <span className="text-gradient">Club Calendar</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToToday}
              className="bg-primary/10 border-primary/20 hover:bg-primary/20 hover:border-primary/30 transition-all duration-300"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Today
            </Button>
            <div className="flex items-center bg-card rounded-lg border border-border/50 shadow-sm">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={prevMonth}
                className="rounded-r-none hover:bg-primary/10 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[140px] text-center font-display font-semibold px-2">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={nextMonth}
                className="rounded-l-none hover:bg-primary/10 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-3 bg-gradient-secondary rounded-xl border border-primary/10">
          <div className="flex items-center gap-2 group cursor-default">
            <div className="w-3 h-3 rounded-full bg-gradient-primary shadow-sm group-hover:scale-125 transition-transform" />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Upcoming</span>
          </div>
          <div className="flex items-center gap-2 group cursor-default">
            <div className="w-3 h-3 rounded-full bg-success shadow-sm animate-pulse group-hover:scale-125 transition-transform" />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Today</span>
          </div>
          <div className="flex items-center gap-2 group cursor-default">
            <div className="w-3 h-3 rounded-full bg-muted-foreground/50 shadow-sm group-hover:scale-125 transition-transform" />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Completed</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-2xl overflow-hidden border border-border/50 shadow-inner bg-card">
          {/* Week Headers */}
          <div className="grid grid-cols-7">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
              <div 
                key={day} 
                className={`py-3 text-center font-display font-semibold text-sm bg-gradient-to-b from-muted to-muted/50 border-b border-border/50 ${
                  idx === 0 || idx === 6 ? 'text-primary/70' : 'text-foreground'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDate.get(dateKey) || [];
              const inCurrentMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const hasEvents = dayEvents.length > 0;
              const isHovered = hoveredDay === dateKey;
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              
              return (
                <div 
                  key={idx} 
                  className={`
                    relative min-h-[100px] p-2 border-b border-r border-border/30
                    transition-all duration-300 ease-out
                    ${!inCurrentMonth ? 'bg-muted/20' : isWeekend ? 'bg-primary/[0.02]' : 'bg-card'}
                    ${today ? 'ring-2 ring-inset ring-primary/50 bg-primary/5' : ''}
                    ${hasEvents && inCurrentMonth ? 'hover:bg-primary/5 hover:shadow-inner cursor-pointer' : ''}
                    ${isHovered && hasEvents ? 'z-10 scale-[1.02] shadow-lg' : ''}
                  `}
                  onMouseEnter={() => hasEvents && setHoveredDay(dateKey)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {/* Day Number */}
                  <div className={`
                    inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium mb-1
                    transition-all duration-200
                    ${today ? 'bg-gradient-primary text-white shadow-md font-bold' : ''}
                    ${!inCurrentMonth ? 'text-muted-foreground/50' : isWeekend ? 'text-primary/70' : 'text-foreground'}
                  `}>
                    {format(day, 'd')}
                  </div>

                  {/* Today indicator */}
                  {today && (
                    <div className="absolute top-1 right-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                    </div>
                  )}

                  {/* Events */}
                  <div className="space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((event, eventIdx) => {
                      const status = getEventStatus(event);
                      return (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/club/${clubId}/event/${event.id}`);
                          }}
                          className={`
                            text-xs px-2 py-1 rounded-md truncate cursor-pointer
                            transform transition-all duration-200 ease-out
                            hover:scale-[1.02] hover:shadow-md active:scale-95
                            animate-fade-in
                            ${status === 'today' 
                              ? 'bg-gradient-to-r from-success to-success/80 text-white shadow-sm' 
                              : status === 'past' 
                                ? 'bg-muted/80 text-muted-foreground hover:bg-muted' 
                                : 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-sm'
                            }
                          `}
                          style={{ animationDelay: `${eventIdx * 50}ms` }}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <Badge 
                        variant="secondary" 
                        className="text-[10px] px-1.5 py-0 h-5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer"
                        onClick={() => dayEvents[0] && navigate(`/club/${clubId}/event/${dayEvents[0].id}`)}
                      >
                        +{dayEvents.length - 2} more
                      </Badge>
                    )}
                  </div>

                  {/* Has events indicator dot */}
                  {hasEvents && inCurrentMonth && !today && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        dayEvents.some(e => getEventStatus(e) === 'upcoming') 
                          ? 'bg-primary' 
                          : 'bg-muted-foreground/50'
                      }`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Events count summary */}
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span>{events.filter(e => e.event_date).length} events scheduled</span>
        </div>
      </CardContent>
    </Card>
  );
};
