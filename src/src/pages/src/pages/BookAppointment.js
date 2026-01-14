import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Sparkles, CheckCircle, ArrowLeft, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, startOfWeek, isSameDay, parse, addMinutes, getDay } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const getWorkingHoursForDay = (dayOfWeek) => {
  if (dayOfWeek === 6) {
    return null;
  } else if (dayOfWeek === 5) {
    return { start: 8, end: 14, interval: 30 };
  } else {
    return { start: 8, end: 20, interval: 30 };
  }
};

const generateTimeSlots = (dayOfWeek) => {
  const workingHours = getWorkingHoursForDay(dayOfWeek);
  if (!workingHours) return [];
  
  const slots = [];
  for (let hour = workingHours.start; hour < workingHours.end; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < workingHours.end - 1 || workingHours.interval === 30) {
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }
  return slots;
};

const calculateEndTime = (startTime, durationMinutes) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  const endDate = addMinutes(startDate, durationMinutes);
  return format(endDate, 'HH:mm');
};

const generateCalendarLinks = (appointment, serviceNames) => {
  const eventDate = parse(appointment.date, "yyyy-MM-dd", new Date());
  const [startHours, startMinutes] = appointment.start_time.split(':').map(Number);
  const [endHours, endMinutes] = appointment.end_time.split(':').map(Number);
  
  const startDateTime = new Date(eventDate);
  startDateTime.setHours(startHours, startMinutes, 0, 0);
  
  const endDateTime = new Date(eventDate);
  endDateTime.setHours(endHours, endMinutes, 0, 0);
  
  const title = `${serviceNames} - NOA'S HAIR STUDIO`;
  const description = `תור ל${serviceNames} אצל נועה`;
  const location = "NOA'S HAIR STUDIO";
  
  const googleStartTime = format(startDateTime, "yyyyMMdd'T'HHmmss");
  const googleEndTime = format(endDateTime, "yyyyMMdd'T'HHmmss");
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${googleStartTime}/${googleEndTime}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${format(startDateTime, "yyyyMMdd'T'HHmmss")}`,
    `DTEND:${format(endDateTime, "yyyyMMdd'T'HHmmss")}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  const icsBlob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const icsUrl = URL.createObjectURL(icsBlob);
  
  return { googleCalendarUrl, icsUrl };
};

export default function BookAppointment() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    services: [],
    date: "",
    start_time: "",
    notes: ""
  });
  const [selectedWeekStart, setSelectedWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));

  const queryClient = useQueryClient();

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
    initialData: [],
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => base44.entities.Appointment.list(),
    initialData: [],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    initialData: [],
  });

  const createClientMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const createAppointmentMutation = useMutation({
    mutationFn: (data) => base44.entities.Appointment.create(data),
    onSuccess: async (newAppointment) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      // Send webhook to Make.com for WhatsApp notification
      try {
        console.log('🚀 Sending webhook to Make.com...');
        
        // Calculate service details for webhook
        const totalDur = formData.services.reduce((total, serviceId) => {
          const service = services.find(s => s.id === serviceId);
          return total + (service?.duration_minutes || 0);
        }, 0);
        const serviceNames = formData.services.map(serviceId => {
          const service = services.find(s => s.id === serviceId);
          return service?.name || '';
        }).filter(Boolean).join(', ');
        const endTimeCalc = calculateEndTime(formData.start_time, totalDur);
        
        const webhookData = {
          LeadID: newAppointment.id,
          Name: formData.customer_name,
          Email: formData.customer_email || '',
          phoneNumber: formData.customer_phone,
          appointmentDate: formData.date,
          appointmentTime: formData.start_time,
          appointmentEndTime: endTimeCalc,
          services: serviceNames,
          duration: totalDur,
          notes: formData.notes || ''
        };
        console.log('📦 Webhook data:', webhookData);
        
        const response = await fetch('https://hook.eu1.make.com/u3dzwgjs48clggwqp6rvm6j77v6p9i7d', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-make-apikey': 'DAn!336699$'
          },
          body: JSON.stringify(webhookData)
        });

        console.log('✅ Webhook response status:', response.status);
        const responseText = await response.text();
        console.log('📨 Webhook response:', responseText);
        
        if (!response.ok) {
          console.error('❌ Webhook failed:', response.status, responseText);
        } else {
          console.log('✨ Webhook sent successfully!');
        }
      } catch (error) {
        console.error("❌ Webhook error:", error);
      }
      
      setStep(4);
      toast.success("התור נקבע בהצלחה!");
    },
    onError: (error) => {
      console.error("Error creating appointment:", error);
      toast.error("אירעה שגיאה בקביעת התור");
    }
  });

  const getTotalDuration = () => {
    if (!formData.services || formData.services.length === 0) return 0;
    return formData.services.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.duration_minutes || 0);
    }, 0);
  };

  const isTimeSlotAvailable = (date, time, serviceDuration) => {
    const [hours, minutes] = time.split(':').map(Number);
    const slotStart = hours * 60 + minutes;
    const slotEnd = slotStart + serviceDuration;

    return !appointments.some(apt => {
      if (apt.date !== date || apt.status === "cancelled") return false;
      
      const [aptStartHours, aptStartMinutes] = apt.start_time.split(':').map(Number);
      const aptStart = aptStartHours * 60 + aptStartMinutes;
      
      let aptEnd = aptStart;
      if (apt.end_time) {
        const [aptEndHours, aptEndMinutes] = apt.end_time.split(':').map(Number);
        aptEnd = aptEndHours * 60 + aptEndMinutes;
      }

      return (slotStart < aptEnd && slotEnd > aptStart);
    });
  };

  const getAvailableTimeSlots = (date) => {
    if (!formData.services || formData.services.length === 0) return [];
    
    const dateObj = parse(date, "yyyy-MM-dd", new Date());
    const dayOfWeek = getDay(dateObj);
    
    const allSlots = generateTimeSlots(dayOfWeek);
    const totalDuration = getTotalDuration();
    
    // Check if selected date is today
    const today = format(new Date(), "yyyy-MM-dd");
    const isToday = date === today;
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    
    return allSlots.filter(time => {
      // Filter out past times if it's today
      if (isToday) {
        const [slotHour, slotMinute] = time.split(':').map(Number);
        const slotTotalMinutes = slotHour * 60 + slotMinute;
        if (slotTotalMinutes <= currentTotalMinutes) {
          return false;
        }
      }
      
      return isTimeSlotAvailable(date, time, totalDuration);
    });
  };

  const handleSubmit = async () => {
    console.log("handleSubmit called", formData);
    
    // בדיקת שדות חובה
    if (!formData.customer_name || !formData.customer_name.trim()) {
      console.log("Name validation failed");
      toast.error("אנא הזיני שם מלא", { 
        duration: 6000,
        position: "top-center"
      });
      return;
    }

    if (!formData.customer_phone || !formData.customer_phone.trim()) {
      console.log("Phone validation failed - empty");
      toast.error("אנא הזיני מספר טלפון", { 
        duration: 6000,
        position: "top-center"
      });
      return;
    }

    // בדיקת תקינות מספר טלפון
    const phoneDigits = formData.customer_phone.replace(/[-\s]/g, '');
    console.log("Phone digits:", phoneDigits);
    const phoneRegex = /^05[0-9]{8}$/;
    
    if (!phoneRegex.test(phoneDigits)) {
      console.log("Phone validation failed - invalid format");
      toast.error("מספר הטלפון לא חוקי - חייב להיות מספר נייד ישראלי בן 10 ספרות (מתחיל ב-05)", { 
        duration: 7000,
        position: "top-center",
        style: {
          fontSize: "16px",
          padding: "16px"
        }
      });
      return;
    }

    if (!formData.services.length || !formData.date || !formData.start_time) {
      console.log("Other fields validation failed");
      toast.error("אנא מלאו את כל השדות", { 
        duration: 6000,
        position: "top-center"
      });
      return;
    }
    
    console.log("All validations passed");

    let clientId = null;
    const existingClient = clients.find(c => c.phone === phoneDigits);
    
    if (existingClient) {
      await createClientMutation.mutateAsync({
        id: existingClient.id,
        full_name: formData.customer_name,
        email: formData.customer_email || existingClient.email,
      });
      clientId = existingClient.id;
    } else {
      const newClient = await createClientMutation.mutateAsync({
        full_name: formData.customer_name,
        phone: phoneDigits,
        email: formData.customer_email || undefined,
        notes: ""
      });
      clientId = newClient.id;
    }

    const totalDuration = getTotalDuration();
    const endTime = calculateEndTime(formData.start_time, totalDuration);

    createAppointmentMutation.mutate({
      client: clientId,
      services: formData.services,
      date: formData.date,
      start_time: formData.start_time,
      end_time: endTime,
      status: "confirmed",
      source: "client",
      notes: formData.notes || undefined
    });
  };

  const toggleService = (serviceId) => {
    setFormData(prev => {
      const services = prev.services.includes(serviceId)
        ? prev.services.filter(id => id !== serviceId)
        : [...prev.services, serviceId];
      return { ...prev, services };
    });
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(selectedWeekStart, i));
  const selectedServicesData = services.filter(s => formData.services.includes(s.id));
  const totalDuration = getTotalDuration();

  if (servicesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C69C6D' }} />
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#FAF3EB' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-6 py-3 shadow-lg mb-4">
            <span className="text-sm font-medium" style={{ color: '#2E2E2E' }}>קביעת תור חדש</span>
            <Sparkles className="w-5 h-5" style={{ color: '#6B8E23' }} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#2E2E2E' }}>
           בוא/י נקבע לך תור
          </h1>
          <p className="text-gray-600" style={{ color: '#827E75' }}>תהליך פשוט ומהיר בשלושה שלבים</p>
        </motion.div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all duration-300 ${
                  step >= s ? "text-white shadow-lg" : ""
                }`}
                style={{
                  backgroundColor: step >= s ? '#C69C6D' : '#E5E7EB',
                  color: step >= s ? 'white' : '#9CA3AF'
                }}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className="h-1 w-12 rounded transition-all duration-300"
                  style={{
                    backgroundColor: step > s ? '#C69C6D' : '#E5E7EB'
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Service Selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-xl border-0">
                <CardHeader style={{ backgroundColor: '#EBDCCB' }} className="border-b">
                  <CardTitle className="text-2xl text-right" style={{ color: '#2E2E2E' }}>
                    בחרי טיפולים
                  </CardTitle>
                  <p className="text-sm mt-2 text-right" style={{ color: '#827E75' }}>
                   ניתן לבחור מספר טיפולים במקביל - לדוגמא: החלקה + גוונים
                  </p>
                </CardHeader>
                <CardContent className="p-6" style={{ backgroundColor: 'white' }}>


                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {services
                      .filter(s => s.is_active !== false)
                      .sort((a, b) => {
                        // סדר קבוצות: תספורת, פן, החלקה, צבע, גוונים, תסרוקת, תוספות
                        const order = ['תספורת', 'פן', 'החלקה', 'צבע', 'גוונים', 'תסרוקת', 'תוספות'];
                        const getGroup = (name) => {
                          for (let i = 0; i < order.length; i++) {
                            if (name.includes(order[i])) return i;
                          }
                          return 999;
                        };
                        const groupA = getGroup(a.name);
                        const groupB = getGroup(b.name);
                        if (groupA !== groupB) return groupA - groupB;
                        // בתוך אותה קבוצה - הראשי קודם (הקצר יותר)
                        return a.name.length - b.name.length;
                      })
                      .map((service) => {
                      const isSelected = formData.services.includes(service.id);
                      return (
                        <motion.button
                          key={service.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleService(service.id)}
                          className="p-6 rounded-xl border-2 text-right transition-all duration-200 relative"
                          style={{
                            borderColor: isSelected ? '#C69C6D' : '#E5E7EB',
                            backgroundColor: isSelected ? '#FAF3EB' : 'white'
                          }}
                        >
                          {isSelected && (
                            <div className="absolute top-3 left-3">
                              <CheckCircle className="w-5 h-5" style={{ color: '#C69C6D' }} />
                            </div>
                          )}
                          {service.price_range && (
                            <div className="absolute top-3 left-3">
                              {!isSelected && (
                                <span className="text-sm font-medium" style={{ color: '#C69C6D' }}>
                                  {service.price_range}
                                </span>
                              )}
                            </div>
                          )}
                          <h3 className="text-lg font-bold mb-2" style={{ color: '#2E2E2E' }}>
                            {service.name}
                          </h3>
                          <p className="text-sm" style={{ color: '#827E75' }}>
                            משך זמן: {service.duration_minutes} דקות
                          </p>
                          {service.description && (
                            <p className="text-xs mt-2" style={{ color: '#827E75' }}>{service.description}</p>
                          )}
                          {isSelected && service.price_range && (
                            <p className="text-sm mt-2 font-medium" style={{ color: '#C69C6D' }}>
                              {service.price_range}
                            </p>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="mt-6">
                    <Button
                      onClick={() => setStep(2)}
                      disabled={formData.services.length === 0}
                      className="w-full text-white border-0"
                      style={{ backgroundColor: '#C69C6D' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8B5E3C'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C69C6D'}
                    >
                      המשך
                      <ArrowLeft className="w-4 h-4 mr-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Date & Time Selection */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-xl border-0">
                <CardHeader style={{ backgroundColor: '#EBDCCB' }} className="border-b">
                  <CardTitle className="text-2xl flex items-center gap-2 justify-end" style={{ color: '#2E2E2E' }}>
                    <Calendar className="w-6 h-6" style={{ color: '#6B8E23' }} />
                    <span>בחרי תאריך ושעה</span>
                  </CardTitle>
                  <div className="flex gap-2 mt-3 flex-wrap justify-start">
                    {selectedServicesData.map(service => (
                      <Badge key={service.id} variant="outline">
                        {service.name}
                      </Badge>
                    ))}
                    <Badge style={{ backgroundColor: '#C69C6D', color: 'white' }}>
                      {totalDuration} דק'
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6" style={{ backgroundColor: 'white' }}>
                  {/* Week Navigation */}
                  <div className="flex items-center justify-between mb-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, -7))}
                      className="gap-1"
                    >
                      <ChevronRight className="w-4 h-4" />
                      שבוע קודם
                    </Button>
                    <div className="text-center">
                      <span className="text-xs sm:hidden block" style={{ color: '#827E75' }}>
                        {format(selectedWeekStart, "yyyy")}
                      </span>
                      <span className="font-medium block" style={{ color: '#2E2E2E' }}>
                        <span className="sm:hidden">{format(selectedWeekStart, "MMMM", { locale: he })}</span>
                        <span className="hidden sm:inline">{format(selectedWeekStart, "MMMM yyyy", { locale: he })}</span>
                      </span>
                      <span className="text-xs" style={{ color: '#827E75' }}>
                        {format(selectedWeekStart, "d")}-{format(addDays(selectedWeekStart, 6), "d")}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, 7))}
                      className="gap-1"
                    >
                      שבוע הבא
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-6">
                    {weekDays.map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const isSelected = formData.date === dateStr;
                      const isToday = isSameDay(day, new Date());
                      const isPast = day < new Date() && !isToday;
                      const dayOfWeek = getDay(day);
                      const isSaturday = dayOfWeek === 6;

                      return (
                        <button
                          key={dateStr}
                          disabled={isPast || isSaturday}
                          onClick={() => setFormData({ ...formData, date: dateStr, start_time: "" })}
                          className="p-3 sm:p-2.5 rounded-lg text-center transition-all duration-200 relative min-h-[70px] sm:min-h-0"
                          style={{
                            backgroundColor: isPast || isSaturday ? '#F3F4F6' : isSelected ? '#C69C6D' : 'white',
                            color: isPast || isSaturday ? '#9CA3AF' : isSelected ? 'white' : '#2E2E2E',
                            border: isSelected ? 'none' : '2px solid #E5E7EB',
                            cursor: isPast || isSaturday ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <div className="text-xs font-medium mb-0.5">
                            {format(day, "EEEE", { locale: he })}
                          </div>
                          <div className="text-xl sm:text-lg font-bold">
                            {format(day, "d")}
                          </div>
                          {isSaturday && (
                            <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>סגור</div>
                          )}
                          {isToday && !isSelected && !isSaturday && (
                            <div className="w-1.5 h-1.5 sm:w-1 sm:h-1 rounded-full mx-auto mt-0.5" style={{ backgroundColor: '#C69C6D' }} />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Time Slots */}
                  {formData.date && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center gap-2 mb-4 justify-end">
                        <h3 className="font-bold" style={{ color: '#2E2E2E' }}>בחרי שעה</h3>
                        <Clock className="w-5 h-5" style={{ color: '#6B8E23' }} />
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                        {getAvailableTimeSlots(formData.date).map((time) => (
                          <button
                            key={time}
                            onClick={() => setFormData({ ...formData, start_time: time })}
                            className="p-3 rounded-lg text-center font-medium transition-all duration-200"
                            style={{
                              backgroundColor: formData.start_time === time ? '#C69C6D' : 'white',
                              color: formData.start_time === time ? 'white' : '#2E2E2E',
                              border: `2px solid ${formData.start_time === time ? '#C69C6D' : '#E5E7EB'}`
                            }}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                      {getAvailableTimeSlots(formData.date).length === 0 && (
                        <p className="text-center py-8" style={{ color: '#827E75' }}>
                          אין שעות פנויות בתאריך זה לטיפולים שנבחרו
                        </p>
                      )}
                    </motion.div>
                  )}

                  <div className="flex gap-3 mt-8">
                    <Button
                      onClick={() => setStep(3)}
                      disabled={!formData.date || !formData.start_time}
                      className="flex-1 text-white border-0"
                      style={{ backgroundColor: '#C69C6D' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8B5E3C'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C69C6D'}
                    >
                      המשך
                      <ArrowLeft className="w-4 h-4 mr-2" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1"
                    >
                      חזרה
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Personal Details */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-xl border-0">
                <CardHeader style={{ backgroundColor: '#EBDCCB' }} className="border-b">
                  <CardTitle className="text-2xl text-right" style={{ color: '#2E2E2E' }}>פרטים אישיים</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6" style={{ backgroundColor: 'white' }}>
                  <div>
                    <Label htmlFor="name" className="text-base font-medium mb-2 block text-right" style={{ color: '#2E2E2E' }}>
                      שם מלא *
                    </Label>
                    <Input
                      id="name"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      placeholder="הזיני את שמך המלא"
                      className="text-lg p-6 text-right"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-base font-medium mb-2 block text-right" style={{ color: '#2E2E2E' }}>
                      מספר טלפון *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      placeholder="050-1234567"
                      className="text-lg p-6 text-right"
                      dir="ltr"
                    />
                  </div>



                  <div>
                    <Label htmlFor="notes" className="text-base font-medium mb-2 block text-right" style={{ color: '#2E2E2E' }}>
                      הערות (אופציונלי)
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="יש לך בקשות מיוחדות? ספרי לנו..."
                      className="text-lg min-h-[100px] text-right"
                    />
                  </div>

                  {/* Summary */}
                  <div className="rounded-xl p-6 space-y-3" style={{ backgroundColor: '#EBDCCB' }}>
                    <h3 className="font-bold text-lg mb-4 text-right" style={{ color: '#2E2E2E' }}>סיכום התור</h3>
                    <div className="space-y-2">
                      <span className="text-sm block text-right" style={{ color: '#827E75' }}>טיפולים:</span>
                      <div className="flex flex-wrap gap-2 justify-end">
                        {selectedServicesData.map(service => (
                          <Badge key={service.id} variant="outline">
                            {service.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#827E75' }}>משך כולל:</span>
                      <span className="font-medium" style={{ color: '#2E2E2E' }}>{totalDuration} דקות</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#827E75' }}>תאריך:</span>
                      <span className="font-medium" style={{ color: '#2E2E2E' }}>
                        {format(parse(formData.date, "yyyy-MM-dd", new Date()), "dd/MM/yyyy")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#827E75' }}>שעה:</span>
                      <span className="font-medium" style={{ color: '#2E2E2E' }}>
                        {formData.start_time} - {calculateEndTime(formData.start_time, totalDuration)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleSubmit}
                      disabled={createAppointmentMutation.isPending || createClientMutation.isPending}
                      className="flex-1 text-white border-0"
                      style={{ backgroundColor: '#C69C6D' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8B5E3C'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C69C6D'}
                    >
                      {createAppointmentMutation.isPending || createClientMutation.isPending ? (
                        <>
                          שומר...
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 ml-2" />
                          אישור וסיום
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="flex-1"
                    >
                      חזרה
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="shadow-xl border-0 text-center">
                <CardContent className="p-12" style={{ backgroundColor: 'white' }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ backgroundColor: '#6B8E23' }}
                  >
                    <CheckCircle className="w-12 h-12 text-white" />
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-4" style={{ color: '#2E2E2E' }}>
                    התור נקבע בהצלחה!
                  </h2>
                  <p className="text-lg mb-8" style={{ color: '#827E75' }}>
                    נשלח אליך אישור בהודעה למספר {formData.customer_phone}
                  </p>
                  <div className="rounded-xl p-6 mb-8 space-y-3" style={{ backgroundColor: '#EBDCCB' }}>
                    <div className="space-y-2">
                      <span className="text-sm block text-right" style={{ color: '#827E75' }}>טיפולים:</span>
                      <div className="flex flex-wrap gap-2 justify-end">
                        {selectedServicesData.map(service => (
                          <Badge key={service.id} variant="outline">
                            {service.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#827E75' }}>משך כולל:</span>
                      <span className="font-medium" style={{ color: '#2E2E2E' }}>{totalDuration} דקות</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#827E75' }}>תאריך:</span>
                      <span className="font-medium" style={{ color: '#2E2E2E' }}>
                        {format(parse(formData.date, "yyyy-MM-dd", new Date()), "dd/MM/yyyy")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#827E75' }}>שעה:</span>
                      <span className="font-medium" style={{ color: '#2E2E2E' }}>
                        {formData.start_time} - {calculateEndTime(formData.start_time, totalDuration)}
                      </span>
                    </div>
                  </div>

                  {/* Add to Calendar Buttons */}
                  <div className="mb-8">
                    <p className="text-sm mb-4 font-medium" style={{ color: '#827E75' }}>
                     הוסיפי את התור ליומן שלך:
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const endTime = calculateEndTime(formData.start_time, totalDuration);
                          const serviceNames = selectedServicesData.map(s => s.name).join(', ');
                          const { googleCalendarUrl } = generateCalendarLinks(
                            { date: formData.date, start_time: formData.start_time, end_time: endTime },
                            serviceNames
                          );
                          window.open(googleCalendarUrl, '_blank');
                        }}
                        className="gap-2 flex-1 sm:flex-none"
                      >
                        Google Calendar
                        <Calendar className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          const endTime = calculateEndTime(formData.start_time, totalDuration);
                          const serviceNames = selectedServicesData.map(s => s.name).join(', ');
                          const { icsUrl } = generateCalendarLinks(
                            { date: formData.date, start_time: formData.start_time, end_time: endTime },
                            serviceNames
                          );
                          const link = document.createElement('a');
                          link.href = icsUrl;
                          link.download = 'appointment.ics';
                          link.click();
                          URL.revokeObjectURL(icsUrl);
                        }}
                        className="gap-2 flex-1 sm:flex-none"
                      >
                        Apple Calendar
                        <Calendar className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    onClick={() => {
                      setStep(1);
                      setFormData({
                        customer_name: "",
                        customer_phone: "",
                        customer_email: "",
                        services: [],
                        date: "",
                        start_time: "",
                        notes: ""
                      });
                    }}
                    className="text-white border-0"
                    style={{ backgroundColor: '#C69C6D' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8B5E3C'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C69C6D'}
                  >
                    קביעת תור נוסף
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
