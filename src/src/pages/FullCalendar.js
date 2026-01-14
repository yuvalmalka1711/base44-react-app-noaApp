import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Clock, Phone, User, ChevronLeft, ChevronRight, CheckCircle, XCircle, Loader2, Mail, Plus, Edit, Trash2, Download } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, getDay, parse } from "date-fns";
import { he } from "date-fns/locale";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function FullCalendar() {
  const [selectedWeekStart, setSelectedWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAddManualEvent, setShowAddManualEvent] = useState(false);
  const [showEditManualEvent, setShowEditManualEvent] = useState(false);
  const [manualEvent, setManualEvent] = useState({
    date: "",
    start_time: "",
    end_time: "",
    notes: ""
  });

  const queryClient = useQueryClient();

  // Service colors palette
  const serviceColors = [
    { bg: '#FFE4E1', border: '#FF69B4', text: '#8B008B' }, // ורוד
    { bg: '#E6E6FA', border: '#9370DB', text: '#4B0082' }, // סגול
    { bg: '#B0E0E6', border: '#4682B4', text: '#00008B' }, // כחול
    { bg: '#98FB98', border: '#32CD32', text: '#006400' }, // ירוק
    { bg: '#FFE4B5', border: '#FFA500', text: '#FF8C00' }, // כתום
    { bg: '#FFB6C1', border: '#FF1493', text: '#C71585' }, // ורוד כהה
    { bg: '#DDA0DD', border: '#BA55D3', text: '#8B008B' }, // סחלב
    { bg: '#87CEEB', border: '#00BFFF', text: '#0000CD' }, // תכלת
  ];

  const getServiceColor = (servicesData) => {
    if (!servicesData || servicesData.length === 0) return null;
    // Use the first service to determine color
    const serviceId = servicesData[0].id;
    // Simple hash function for consistent color assignment
    let hash = 0;
    for (let i = 0; i < serviceId.length; i++) {
      hash = serviceId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % serviceColors.length;
    return serviceColors[colorIndex];
  };

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const apts = await base44.entities.Appointment.list("-date");
      const withRelations = await Promise.all(apts.map(async (apt) => {
        const client = apt.client ? await base44.entities.Client.filter({ id: apt.client }) : null;
        
        let servicesData = [];
        if (apt.services && Array.isArray(apt.services) && apt.services.length > 0) {
          const servicePromises = apt.services.map(serviceId => 
            base44.entities.Service.filter({ id: serviceId })
          );
          const servicesResults = await Promise.all(servicePromises);
          servicesData = servicesResults.map(res => res[0]).filter(Boolean);
        }
        
        return {
          ...apt,
          clientData: client?.[0] || null,
          servicesData: servicesData
        };
      }));
      return withRelations;
    },
    initialData: [],
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Appointment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success("התור עודכן בהצלחה");
      setSelectedAppointment(null);
      setShowEditManualEvent(false);
    },
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: (id) => base44.entities.Appointment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success("האירוע נמחק בהצלחה");
      setSelectedAppointment(null);
    },
  });

  const createManualEventMutation = useMutation({
    mutationFn: (data) => base44.entities.Appointment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success("האירוע נוסף בהצלחה!");
      setShowAddManualEvent(false);
      setManualEvent({ date: "", start_time: "", end_time: "", notes: "" });
    },
    onError: () => {
      toast.error("אירעה שגיאה בהוספת האירוע");
    }
  });

  const handleAddManualEvent = () => {
    if (!manualEvent.date || !manualEvent.start_time || !manualEvent.end_time) {
      toast.error("אנא מלא תאריך, שעת התחלה ושעת סיום");
      return;
    }

    createManualEventMutation.mutate({
      date: manualEvent.date,
      start_time: manualEvent.start_time,
      end_time: manualEvent.end_time,
      notes: manualEvent.notes || "אירוע אישי",
      status: "confirmed",
      source: "admin"
    });
  };

  const handleEditManualEvent = () => {
    if (!manualEvent.date || !manualEvent.start_time || !manualEvent.end_time) {
      toast.error("אנא מלא תאריך, שעת התחלה ושעת סיום");
      return;
    }

    updateAppointmentMutation.mutate({
      id: selectedAppointment.id,
      data: {
        date: manualEvent.date,
        start_time: manualEvent.start_time,
        end_time: manualEvent.end_time,
        notes: manualEvent.notes || "אירוע אישי"
      }
    });
  };

  const handleDeleteEvent = (eventId) => {
    if (confirm("האם את בטוחה שברצונך למחוק את האירוע?")) {
      deleteAppointmentMutation.mutate(eventId);
    }
  };

  const handleEditEvent = (event) => {
    setManualEvent({
      date: event.date,
      start_time: event.start_time,
      end_time: event.end_time,
      notes: event.notes || ""
    });
    setShowEditManualEvent(true);
  };

  const exportToGoogleCalendar = () => {
    const futureAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.date + 'T00:00:00');
      return aptDate >= new Date() && (apt.status === "confirmed" || apt.status === "pending");
    });

    if (futureAppointments.length === 0) {
      toast.error("אין תורים עתידיים לייצוא");
      return;
    }

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NOA\'S HAIR STUDIO//Calendar//HE',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:תורים - NOA\'S HAIR STUDIO',
      'X-WR-TIMEZONE:Asia/Jerusalem'
    ];

    futureAppointments.forEach(apt => {
      const dateStr = apt.date.replace(/-/g, '');
      const startTime = apt.start_time.replace(':', '') + '00';
      const endTime = apt.end_time ? apt.end_time.replace(':', '') + '00' : startTime;
      
      const isManualEvent = !apt.client && (!apt.servicesData || apt.servicesData.length === 0);
      const title = isManualEvent ? 
        (apt.notes || "אירוע אישי") : 
        `${apt.clientData?.full_name || "לקוח"} - ${apt.servicesData?.map(s => s.name).join(', ') || "טיפול"}`;
      
      const description = isManualEvent ? 
        '' : 
        `לקוח: ${apt.clientData?.full_name || "לא ידוע"}\\nטלפון: ${apt.clientData?.phone || "לא ידוע"}\\n${apt.notes ? `הערות: ${apt.notes}` : ''}`;

      icsContent.push(
        'BEGIN:VEVENT',
        `DTSTART:${dateStr}T${startTime}`,
        `DTEND:${dateStr}T${endTime}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        `LOCATION:NOA'S HAIR STUDIO`,
        `UID:${apt.id}@noashair.com`,
        `STATUS:${apt.status === "pending" ? "TENTATIVE" : "CONFIRMED"}`,
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `noa-hair-studio-${format(new Date(), 'yyyy-MM-dd')}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success("קובץ יומן ייוצא! ניתן לייבא אותו ל-Google Calendar");
  };

  const calculateAppointmentHeight = (apt) => {
    if (!apt.start_time || !apt.end_time) return 1;
    
    const [startHour, startMin] = apt.start_time.split(':').map(Number);
    const [endHour, endMin] = apt.end_time.split(':').map(Number);
    
    const startInMinutes = startHour * 60 + startMin;
    const endInMinutes = endHour * 60 + endMin;
    const durationInMinutes = endInMinutes - startInMinutes;
    
    const hours = durationInMinutes / 60;
    return hours;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C69C6D' }} />
      </div>
    );
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(selectedWeekStart, i));
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // Hours from 08:00 to 20:00

  const getAppointmentsForDay = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return appointments
      .filter(apt => apt.date === dateStr && (apt.status === "confirmed" || apt.status === "pending"))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const getTodayStats = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const todayAppointments = appointments.filter(apt => apt.date === today && (apt.status === "confirmed" || apt.status === "pending"));
    return {
      total: todayAppointments.length
    };
  };

  const stats = getTodayStats();

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" dir="rtl" style={{ backgroundColor: '#FAF3EB' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="text-right">
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#2E2E2E' }}>היומן שלי 💇‍♀️</h1>
              <p className="text-sm" style={{ color: '#827E75' }}>ניהול תורים ואירועים</p>
            </div>

            <div className="flex gap-3 items-center flex-wrap">
              <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm px-4 py-2">
                <div>
                  <p className="text-xl font-bold leading-none text-right" style={{ color: '#2E2E2E' }}>{stats.total}</p>
                  <p className="text-xs text-right" style={{ color: '#827E75' }}>תורים היום</p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg, #C69C6D 0%, #8B5E3C 100%)' }}>
                  <CalendarIcon className="w-5 h-5 text-white" />
                </div>
              </div>

              <Button
                onClick={() => setShowAddManualEvent(true)}
                size="sm"
                className="gap-2 text-white border-0"
                style={{ backgroundColor: '#6B8E23' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#556B2F'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6B8E23'}
              >
                הוסיפי אירוע
                <Plus className="w-4 h-4" />
              </Button>

              <Button
                onClick={exportToGoogleCalendar}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                ייצוא ליומן Google
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between bg-white rounded-xl shadow-sm px-6 py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, -7))}
              className="gap-2"
            >
              <ChevronRight className="w-5 h-5" />
              שבוע קודם
            </Button>

            <div className="text-center">
              <p className="font-bold text-sm sm:text-base" style={{ color: '#2E2E2E' }}>
                {format(selectedWeekStart, "MMMM yyyy", { locale: he })}
              </p>
              <p className="text-xs" style={{ color: '#827E75' }}>
                {format(selectedWeekStart, "dd/MM")} - {format(addDays(selectedWeekStart, 6), "dd/MM")}
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, 7))}
              className="gap-2"
            >
              שבוע הבא
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        {/* Days List */}
        <div className="space-y-6">
          {weekDays.map((day, dayIndex) => {
            const isToday = isSameDay(day, new Date());
            const dayOfWeek = getDay(day);
            const isSaturday = dayOfWeek === 6;
            const dayAppointments = getAppointmentsForDay(day);

            return (
              <motion.div
                key={day.toString()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: dayIndex * 0.1 }}
              >
                <Card className="shadow-lg border-0 overflow-hidden">
                  {/* Day Header */}
                  <div 
                    className="p-4 border-b"
                    style={{ 
                      backgroundColor: isToday ? '#C69C6D' : isSaturday ? '#9CA3AF' : '#EBDCCB',
                      borderColor: '#E5E7EB'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                                                  <div 
                                                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold"
                                                    style={{ 
                                                      backgroundColor: 'white',
                                                      color: isToday ? '#C69C6D' : isSaturday ? '#9CA3AF' : '#2E2E2E'
                                                    }}
                                                  >
                                                    {format(day, "d")}
                                                  </div>
                                                  <div>
                                                    <h3 className="text-xl font-bold text-right" style={{ color: isToday || isSaturday ? 'white' : '#2E2E2E' }}>
                                                      {format(day, "EEEE", { locale: he })}
                                                    </h3>
                                                    <p className="text-sm text-right" style={{ color: isToday || isSaturday ? 'rgba(255,255,255,0.8)' : '#827E75' }}>
                                                      {format(day, "dd/MM/yyyy")}
                                                    </p>
                                                  </div>
                                                </div>
                                                {(isToday || isSaturday) && (
                                                  <Badge className="text-white border-0" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                                                    {isToday ? "היום" : "סגור"}
                                                  </Badge>
                                                )}
                    </div>
                  </div>

                  {/* Hours & Appointments */}
                  <CardContent className="p-0" style={{ backgroundColor: 'white' }}>
                    {isSaturday ? (
                      <div className="p-8 text-center" style={{ color: '#827E75' }}>
                        <p className="text-lg">יום מנוחה 🌸</p>
                      </div>
                    ) : (
                      <div className="flex flex-row-reverse">
                        {/* Time Column - Fixed */}
                        <div className="w-24 flex-shrink-0">
                          {hours.map((hour) => {
                            const isFriday = dayOfWeek === 5;
                            const isWorkingHour = isFriday ? hour < 14 : hour < 20;

                            return (
                              <div 
                                key={hour} 
                                className="flex items-start justify-center p-4 border-b border-r"
                                style={{ 
                                  height: '80px',
                                  backgroundColor: isWorkingHour ? '#FAF3EB' : '#F9FAFB',
                                  borderColor: '#E5E7EB'
                                }}
                              >
                                <span className="text-lg font-bold" style={{ color: isWorkingHour ? '#2E2E2E' : '#9CA3AF' }}>
                                  {`${hour.toString().padStart(2, '0')}:00`}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Appointments Column - Relative positioning container */}
                        <div className="flex-1 relative" style={{ height: `${hours.length * 80}px` }}>
                          {/* Hour backgrounds */}
                          {hours.map((hour) => {
                            const isFriday = dayOfWeek === 5;
                            const isWorkingHour = isFriday ? hour < 14 : hour < 20;

                            return (
                              <div 
                                key={hour}
                                className="absolute w-full border-b"
                                style={{ 
                                  height: '80px',
                                  top: `${(hour - 8) * 80}px`,
                                  backgroundColor: isWorkingHour ? 'white' : '#F9FAFB',
                                  borderColor: '#E5E7EB'
                                }}
                              />
                            );
                          })}

                          {/* Appointments positioned absolutely */}
                          {dayAppointments.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center" style={{ color: '#827E75' }}>
                              <p className="text-lg">אין תורים מתוכננים</p>
                            </div>
                          )}
                          {dayAppointments.map((apt) => {
                            const [startHour, startMin] = apt.start_time.split(':').map(Number);
                            const heightInHours = calculateAppointmentHeight(apt);
                            const topOffset = (startHour - 8) * 80 + (startMin / 60) * 80;
                            const height = heightInHours * 80 - 8;
                            
                            const isManualEvent = !apt.client && (!apt.servicesData || apt.servicesData.length === 0);
                            const serviceColor = !isManualEvent ? getServiceColor(apt.servicesData) : null;

                            return (
                              <button
                                key={apt.id}
                                onClick={() => setSelectedAppointment(apt)}
                                className="absolute text-right p-3 rounded-lg transition-all hover:shadow-lg overflow-hidden"
                                style={{
                                  top: `${topOffset + 4}px`,
                                  left: '12px',
                                  right: '12px',
                                  height: `${height}px`,
                                  backgroundColor: isManualEvent ? '#B6C27D' : 
                                                 serviceColor ? serviceColor.bg :
                                                 apt.status === "pending" ? '#FEF3C7' : '#EBDCCB',
                                  borderRight: `4px solid ${isManualEvent ? '#6B8E23' :
                                                          serviceColor ? serviceColor.border :
                                                          apt.status === "pending" ? '#FCD34D' : '#C69C6D'}`,
                                  zIndex: 10
                                }}
                              >
                                <div className="flex items-start justify-between gap-2 h-full">
                                  {apt.status === "pending" && (
                                    <Badge variant="outline" className="text-xs flex-shrink-0" style={{ 
                                      backgroundColor: '#FEF3C7',
                                      color: '#92400E',
                                      borderColor: '#FCD34D'
                                    }}>
                                      ממתין
                                    </Badge>
                                  )}
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 justify-end">
                                      <span className="font-bold text-xs whitespace-nowrap" style={{ 
                                        color: serviceColor ? serviceColor.text : '#2E2E2E' 
                                      }}>
                                        {apt.start_time}
                                        {apt.end_time && ` - ${apt.end_time}`}
                                      </span>
                                      <Clock className="w-3 h-3 flex-shrink-0" style={{ 
                                        color: serviceColor ? serviceColor.text : '#827E75' 
                                      }} />
                                    </div>
                                    
                                    {isManualEvent ? (
                                      <p className="text-xs font-medium text-right truncate" style={{ color: '#2E2E2E' }}>
                                        {apt.notes || "אירוע אישי"}
                                      </p>
                                    ) : (
                                      <>
                                        <p className="font-bold text-sm mb-1 truncate text-right" style={{ 
                                          color: serviceColor ? serviceColor.text : '#2E2E2E' 
                                        }}>
                                          {apt.clientData?.full_name || "לא ידוע"}
                                        </p>
                                        <p className="text-xs truncate text-right" style={{ 
                                          color: serviceColor ? serviceColor.text : '#827E75' 
                                        }}>
                                          {apt.servicesData?.map(s => s.name).join(', ') || "לא ידוע"}
                                        </p>
                                        {apt.clientData?.phone && height > 60 && (
                                          <p className="text-xs mt-1 flex items-center gap-1 truncate justify-end" style={{ 
                                            color: serviceColor ? serviceColor.text : '#827E75' 
                                          }}>
                                            {apt.clientData.phone}
                                            <Phone className="w-3 h-3 flex-shrink-0" />
                                          </p>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Add Manual Event Dialog */}
        <Dialog open={showAddManualEvent} onOpenChange={setShowAddManualEvent}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-2xl" style={{ color: '#2E2E2E' }}>הוספת אירוע ידני</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="event-date" className="text-sm font-medium mb-2 block" style={{ color: '#2E2E2E' }}>
                  תאריך *
                </Label>
                <Input
                  id="event-date"
                  type="date"
                  value={manualEvent.date}
                  onChange={(e) => setManualEvent({ ...manualEvent, date: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="event-start" className="text-sm font-medium mb-2 block" style={{ color: '#2E2E2E' }}>
                    שעת התחלה *
                  </Label>
                  <Input
                    id="event-start"
                    type="time"
                    value={manualEvent.start_time}
                    onChange={(e) => setManualEvent({ ...manualEvent, start_time: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="event-end" className="text-sm font-medium mb-2 block" style={{ color: '#2E2E2E' }}>
                    שעת סיום *
                  </Label>
                  <Input
                    id="event-end"
                    type="time"
                    value={manualEvent.end_time}
                    onChange={(e) => setManualEvent({ ...manualEvent, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="event-notes" className="text-sm font-medium mb-2 block" style={{ color: '#2E2E2E' }}>
                  הערות
                </Label>
                <Textarea
                  id="event-notes"
                  value={manualEvent.notes}
                  onChange={(e) => setManualEvent({ ...manualEvent, notes: e.target.value })}
                  placeholder="תיאור האירוע..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddManualEvent(false);
                    setManualEvent({ date: "", start_time: "", end_time: "", notes: "" });
                  }}
                  className="flex-1"
                >
                  ביטול
                </Button>
                <Button
                  onClick={handleAddManualEvent}
                  disabled={createManualEventMutation.isPending}
                  className="flex-1 text-white border-0"
                  style={{ backgroundColor: '#6B8E23' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#556B2F'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6B8E23'}
                >
                  {createManualEventMutation.isPending ? "שומר..." : "הוסף אירוע"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Manual Event Dialog */}
        <Dialog open={showEditManualEvent} onOpenChange={setShowEditManualEvent}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-2xl" style={{ color: '#2E2E2E' }}>עריכת אירוע</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-event-date" className="text-sm font-medium mb-2 block" style={{ color: '#2E2E2E' }}>
                  תאריך *
                </Label>
                <Input
                  id="edit-event-date"
                  type="date"
                  value={manualEvent.date}
                  onChange={(e) => setManualEvent({ ...manualEvent, date: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-event-start" className="text-sm font-medium mb-2 block" style={{ color: '#2E2E2E' }}>
                    שעת התחלה *
                  </Label>
                  <Input
                    id="edit-event-start"
                    type="time"
                    value={manualEvent.start_time}
                    onChange={(e) => setManualEvent({ ...manualEvent, start_time: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-event-end" className="text-sm font-medium mb-2 block" style={{ color: '#2E2E2E' }}>
                    שעת סיום *
                  </Label>
                  <Input
                    id="edit-event-end"
                    type="time"
                    value={manualEvent.end_time}
                    onChange={(e) => setManualEvent({ ...manualEvent, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-event-notes" className="text-sm font-medium mb-2 block" style={{ color: '#2E2E2E' }}>
                  הערות
                </Label>
                <Textarea
                  id="edit-event-notes"
                  value={manualEvent.notes}
                  onChange={(e) => setManualEvent({ ...manualEvent, notes: e.target.value })}
                  placeholder="תיאור האירוע..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditManualEvent(false);
                    setManualEvent({ date: "", start_time: "", end_time: "", notes: "" });
                  }}
                  className="flex-1"
                >
                  ביטול
                </Button>
                <Button
                  onClick={handleEditManualEvent}
                  disabled={updateAppointmentMutation.isPending}
                  className="flex-1 text-white border-0"
                  style={{ backgroundColor: '#6B8E23' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#556B2F'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6B8E23'}
                >
                  {updateAppointmentMutation.isPending ? "שומר..." : "שמור שינויים"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Appointment Details Dialog */}
        <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-2xl" style={{ color: '#2E2E2E' }}>
                {selectedAppointment && !selectedAppointment.client && (!selectedAppointment.servicesData || selectedAppointment.servicesData.length === 0) ? "פרטי אירוע" : "פרטי התור"}
              </DialogTitle>
            </DialogHeader>
            {selectedAppointment && (
              <div className="space-y-4">
                <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: '#EBDCCB' }}>
                  {selectedAppointment.client && selectedAppointment.clientData && (
                    <>
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5" style={{ color: '#6B8E23' }} />
                        <div>
                          <p className="text-sm" style={{ color: '#827E75' }}>שם לקוח</p>
                          <p className="font-bold" style={{ color: '#2E2E2E' }}>
                            {selectedAppointment.clientData?.full_name || "לא ידוע"}
                          </p>
                        </div>
                      </div>

                      {selectedAppointment.clientData?.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5" style={{ color: '#6B8E23' }} />
                          <div>
                            <p className="text-sm" style={{ color: '#827E75' }}>טלפון</p>
                            <a 
                              href={`tel:${selectedAppointment.clientData.phone}`} 
                              className="font-medium hover:underline"
                              style={{ color: '#C69C6D' }}
                            >
                              {selectedAppointment.clientData.phone}
                            </a>
                          </div>
                        </div>
                      )}

                      {selectedAppointment.clientData?.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5" style={{ color: '#6B8E23' }} />
                          <div>
                            <p className="text-sm" style={{ color: '#827E75' }}>אימייל</p>
                            <a 
                              href={`mailto:${selectedAppointment.clientData.email}`} 
                              className="font-medium hover:underline text-sm"
                              style={{ color: '#C69C6D' }}
                            >
                              {selectedAppointment.clientData.email}
                            </a>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-5 h-5" style={{ color: '#6B8E23' }} />
                    <div>
                      <p className="text-sm" style={{ color: '#827E75' }}>תאריך ושעה</p>
                      <p className="font-medium" style={{ color: '#2E2E2E' }}>
                        {format(new Date(selectedAppointment.date + 'T00:00:00'), "dd/MM/yyyy")} בשעה {selectedAppointment.start_time}
                        {selectedAppointment.end_time && ` - ${selectedAppointment.end_time}`}
                      </p>
                    </div>
                  </div>

                  {selectedAppointment.servicesData && selectedAppointment.servicesData.length > 0 && (
                    <div>
                      <p className="text-sm mb-2" style={{ color: '#827E75' }}>שירותים</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedAppointment.servicesData.map(service => (
                          <Badge key={service.id} className="text-white border-0" style={{ backgroundColor: '#C69C6D' }}>
                            {service.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedAppointment.notes && (
                    <div>
                      <p className="text-sm mb-1" style={{ color: '#827E75' }}>הערות</p>
                      <p className="text-sm" style={{ color: '#2E2E2E' }}>{selectedAppointment.notes}</p>
                    </div>
                  )}

                  {selectedAppointment.clientData?.notes && (
                    <div>
                      <p className="text-sm mb-1" style={{ color: '#827E75' }}>הערות על הלקוח</p>
                      <p className="text-sm" style={{ color: '#2E2E2E' }}>{selectedAppointment.clientData.notes}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm mb-1" style={{ color: '#827E75' }}>סטטוס</p>
                    <Badge variant="outline" 
                           style={{
                             backgroundColor: selectedAppointment.status === "completed" ? '#D1FAE5' :
                                            selectedAppointment.status === "cancelled" ? '#FEE2E2' :
                                            selectedAppointment.status === "pending" ? '#FEF3C7' : '#DBEAFE',
                             color: selectedAppointment.status === "completed" ? '#065F46' :
                                   selectedAppointment.status === "cancelled" ? '#991B1B' :
                                   selectedAppointment.status === "pending" ? '#92400E' : '#1E40AF',
                             borderColor: selectedAppointment.status === "completed" ? '#A7F3D0' :
                                        selectedAppointment.status === "cancelled" ? '#FECACA' :
                                        selectedAppointment.status === "pending" ? '#FCD34D' : '#BFDBFE'
                           }}>
                      {selectedAppointment.status === "completed" ? "הושלם" :
                       selectedAppointment.status === "cancelled" ? "בוטל" :
                       selectedAppointment.status === "pending" ? "ממתין לאישור" :
                       "מאושר"}
                    </Badge>
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedAppointment.client ? (
                  (selectedAppointment.status === "confirmed" || selectedAppointment.status === "pending") && (
                    <div className="flex gap-3">
                      <Button
                        onClick={() =>
                          updateAppointmentMutation.mutate({
                            id: selectedAppointment.id,
                            data: { status: "cancelled" }
                          })
                        }
                        disabled={updateAppointmentMutation.isPending}
                        variant="destructive"
                        className="w-full gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        ביטול תור
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleEditEvent(selectedAppointment)}
                      className="flex-1 gap-2 text-white border-0"
                      style={{ backgroundColor: '#C69C6D' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8B5E3C'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C69C6D'}
                    >
                      <Edit className="w-4 h-4" />
                      ערוך אירוע
                    </Button>
                    <Button
                      onClick={() => handleDeleteEvent(selectedAppointment.id)}
                      disabled={deleteAppointmentMutation.isPending}
                      variant="destructive"
                      className="flex-1 gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      מחק אירוע
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
