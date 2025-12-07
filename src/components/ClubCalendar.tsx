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
    <Card className="border border-border/50 shadow-md overflow-hidden animate-fade-in bg-card/80 backdrop-blur-sm max-w-3xl mx-auto">
      <CardHeader className="py-3 px-4 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 border-b border-border/30">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <div className="p-1.5 bg-gradient-to-br from-primary to-primary/80 rounded-lg shadow-sm">
              <CalendarDays className="h-4 w-4 text-white" />
            </div>
            <span className="text-foreground font-semibold">Events Calendar</span>
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goToToday}
              className="h-7 px-2 text-xs bg-primary/10 hover:bg-primary/20 text-primary"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Today
            </Button>
            <div className="flex items-center bg-muted/50 rounded-md border border-border/50">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={prevMonth}
                className="h-7 w-7 rounded-r-none hover:bg-primary/10"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="min-w-[100px] text-center text-xs font-semibold px-1">
                {format(currentMonth, 'MMM yyyy')}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={nextMonth}
                className="h-7 w-7 rounded-l-none hover:bg-primary/10"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {/* Compact Legend */}
        <div className="flex items-center justify-center gap-4 mb-3 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">Upcoming</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-muted-foreground">Today</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
            <span className="text-muted-foreground">Past</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-xl overflow-hidden border border-border/40 bg-gradient-to-b from-background to-muted/20">
          {/* Week Headers */}
          <div className="grid grid-cols-7 bg-muted/60">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <div 
                key={`${day}-${idx}`} 
                className={`py-1.5 text-center font-semibold text-[10px] ${
                  idx === 0 || idx === 6 ? 'text-primary/70' : 'text-muted-foreground'
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
                    relative h-14 p-0.5 border-t border-border/20
                    transition-all duration-200
                    ${!inCurrentMonth ? 'bg-muted/10' : isWeekend ? 'bg-primary/[0.02]' : ''}
                    ${today ? 'bg-primary/10 ring-1 ring-inset ring-primary/30' : ''}
                    ${hasEvents && inCurrentMonth ? 'hover:bg-primary/5 cursor-pointer' : ''}
                    ${isHovered && hasEvents ? 'z-10' : ''}
                  `}
                  onMouseEnter={() => hasEvents && setHoveredDay(dateKey)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {/* Day Number */}
                  <div className={`
                    flex items-center justify-center w-5 h-5 mx-auto rounded-full text-[10px] font-medium
                    ${today ? 'bg-primary text-white font-bold shadow-sm' : ''}
                    ${!inCurrentMonth ? 'text-muted-foreground/40' : isWeekend ? 'text-primary/60' : 'text-foreground/80'}
                  `}>
                    {format(day, 'd')}
                  </div>

                  {/* Today indicator */}
                  {today && (
                    <div className="absolute top-0.5 right-0.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                      </span>
                    </div>
                  )}

                  {/* Events */}
                  <div className="mt-0.5 space-y-0.5 px-0.5 overflow-hidden">
                    {dayEvents.slice(0, 1).map((event) => {
                      const status = getEventStatus(event);
                      return (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/club/${clubId}/event/${event.id}`);
                          }}
                          className={`
                            text-[8px] px-1 py-0.5 rounded truncate cursor-pointer
                            transition-all duration-150 hover:scale-[1.02]
                            ${status === 'today' 
                              ? 'bg-emerald-500 text-white' 
                              : status === 'past' 
                                ? 'bg-muted text-muted-foreground' 
                                : 'bg-primary text-white'
                            }
                          `}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 1 && (
                      <Badge 
                        variant="secondary" 
                        className="text-[7px] px-1 py-0 h-3 bg-primary/20 text-primary border-0 hover:bg-primary/30 cursor-pointer"
                        onClick={() => dayEvents[0] && navigate(`/club/${clubId}/event/${dayEvents[0].id}`)}
                      >
                        +{dayEvents.length - 1}
                      </Badge>
                    )}
                  </div>

                  {/* Has events indicator dot */}
                  {hasEvents && inCurrentMonth && !today && dayEvents.length === 0 && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2">
                      <div className={`w-1 h-1 rounded-full ${
                        dayEvents.some(e => getEventStatus(e) === 'upcoming') 
                          ? 'bg-primary' 
                          : 'bg-muted-foreground/40'
                      }`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Events count summary */}
        <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
          <CalendarDays className="h-3 w-3" />
          <span>{events.filter(e => e.event_date).length} events</span>
        </div>
      </CardContent>
    </Card>
  );
};
