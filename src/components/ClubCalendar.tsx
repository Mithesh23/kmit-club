import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addMonths, 
  subMonths, 
  isSameMonth, 
  isSameDay, 
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

  // Get events mapped by date
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

  // Generate calendar days
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

  const getDayClasses = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayEvents = eventsByDate.get(dateKey);
    const inCurrentMonth = isSameMonth(day, currentMonth);
    const today = isToday(day);
    
    let baseClasses = "h-24 p-1 border border-border/50 transition-all duration-200 ";
    
    if (!inCurrentMonth) {
      baseClasses += "bg-muted/30 text-muted-foreground ";
    } else if (today) {
      baseClasses += "bg-primary/10 ring-2 ring-primary/50 ";
    } else {
      baseClasses += "bg-background hover:bg-muted/50 ";
    }

    if (dayEvents && dayEvents.length > 0) {
      baseClasses += "cursor-pointer ";
    }

    return baseClasses;
  };

  return (
    <Card className="card-elegant border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-2xl font-display">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            Club Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Upcoming</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-muted-foreground">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted-foreground" />
            <span className="text-muted-foreground">Past</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0 rounded-lg overflow-hidden border border-border">
          {/* Week Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div 
              key={day} 
              className="p-2 text-center font-semibold text-sm bg-muted border-b border-border"
            >
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {calendarDays.map((day, idx) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDate.get(dateKey) || [];
            
            return (
              <div key={idx} className={getDayClasses(day)}>
                <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-primary font-bold' : ''}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map((event) => {
                    const status = getEventStatus(event);
                    return (
                      <div
                        key={event.id}
                        onClick={() => navigate(`/club/${clubId}/event/${event.id}`)}
                        className={`text-xs p-1 rounded truncate cursor-pointer transition-all hover:scale-105 ${
                          status === 'today' 
                            ? 'bg-success text-success-foreground' 
                            : status === 'past' 
                              ? 'bg-muted text-muted-foreground' 
                              : 'bg-primary text-primary-foreground'
                        }`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{dayEvents.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
