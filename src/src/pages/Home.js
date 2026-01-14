import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Calendar, Scissors, Instagram, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <div style={{ backgroundColor: '#FAF3EB' }}>
      {/* הוספת הפונט כאן */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;500;600;700&display=swap');
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(45deg); }
          50% { transform: translateY(-20px) rotate(45deg); }
        }
        
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) rotate(-12deg); }
          50% { transform: translateY(-15px) rotate(-12deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-reverse {
          animation: float-reverse 5s ease-in-out infinite;
        }

        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .gradient-animate {
          background: linear-gradient(135deg, #FAF3EB 0%, #EBDCCB 50%, #FAF3EB 100%);
          background-size: 200% 200%;
          animation: gradient-shift 15s ease infinite;
        }

        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden gradient-animate">
        <div className="absolute inset-0 opacity-5">
          <Scissors className="absolute top-20 right-[10%] w-32 h-32 animate-float" style={{ color: '#C69C6D' }} />
          <Scissors className="absolute bottom-20 left-[15%] w-24 h-24 animate-float-reverse" style={{ color: '#6B8E23' }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full px-6 py-2 mb-6 shadow-lg"
              style={{ 
                backgroundColor: '#EBDCCB',
                border: '2px solid rgba(198, 156, 109, 0.2)'
              }}
            >
              <span className="text-sm font-medium" style={{ color: '#2E2E2E' }}>ברוכים הבאים</span>
            </motion.div>

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mb-8 text-center"
            >
              <h1 
                className="text-5xl sm:text-6xl md:text-7xl font-bold mb-2"
                style={{ 
                  color: '#2E2E2E',
                  fontFamily: 'serif',
                  letterSpacing: '0.05em'
                }}
              >
                Noaa Malka
              </h1>
              <p 
                className="text-base sm:text-lg tracking-widest mb-3"
                style={{ 
                  color: '#2E2E2E',
                  letterSpacing: '0.3em'
                }}
              >
                HAIR STYLIST
              </p>
              <p 
                className="text-sm sm:text-base mb-3"
                style={{ 
                  color: '#827E75',
                  fontWeight: '500'
                }}
              >
                ויצמן 14, גבעתיים
              </p>
              <div className="flex justify-center gap-6">
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  href="https://www.waze.com/ul?q=ויצמן 14, גבעתיים"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg"
                       style={{ backgroundColor: '#00D8FF' }}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#2E2E2E' }}>Waze</span>
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  href="https://www.google.com/maps/dir/?api=1&destination=ויצמן+14+גבעתיים"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg"
                       style={{ backgroundColor: '#2D7A3E' }}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#2E2E2E' }}>Google Maps</span>
                </motion.a>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col gap-4 justify-center items-center"
            >
              <Link to={createPageUrl("BookAppointment")}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="text-lg px-8 py-6 rounded-xl shadow-xl text-white border-0 transition-all duration-300"
                    style={{ 
                      backgroundColor: '#C69C6D',
                      boxShadow: '0 10px 30px rgba(198, 156, 109, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#8B5E3C';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 15px 40px rgba(139, 94, 60, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#C69C6D';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 10px 30px rgba(198, 156, 109, 0.3)';
                    }}
                  >
                    לקביעת תור
                    <Calendar className="w-5 h-5 mr-2" />
                  </Button>
                </motion.div>
              </Link>

              {/* חיבור חלק עם יד מצביעה */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="flex items-center gap-3 mt-8"
              >
                <span className="font-bold text-lg" style={{ color: '#2E2E2E' }}>
                  עקבו אחריי ברשתות החברתיות
                </span>
                <ArrowDown className="w-6 h-6 animate-bounce-gentle" style={{ color: '#C69C6D' }} />
              </motion.div>

              {/* Social Media Icons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.6 }}
                className="flex justify-center gap-4 mt-4"
              >
                <motion.a
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  href="https://www.instagram.com/noaamalka_hairstylist?igsh=MTI5bWY1aHRlbWJwbw=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg"
                  style={{ backgroundColor: '#EBDCCB' }}
                >
                  <Instagram className="w-6 h-6" style={{ color: '#C69C6D' }} />
                </motion.a>
                
                <motion.a
                  whileHover={{ scale: 1.15, rotate: -5 }}
                  whileTap={{ scale: 0.95 }}
                  href="https://www.tiktok.com/@noaamalka_hairdresser?_r=1&_t=ZS-91Ao8baD4S5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg"
                  style={{ backgroundColor: '#EBDCCB' }}
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    className="w-6 h-6"
                    style={{ color: '#C69C6D' }}
                  >
                    <path
                      d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
                      fill="currentColor"
                    />
                  </svg>
                </motion.a>
                
                <motion.a
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  href="http://bit.ly/3WRUEsV"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg"
                  style={{ backgroundColor: '#EBDCCB' }}
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    className="w-6 h-6"
                    style={{ color: '#C69C6D' }}
                  >
                    <path
                      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
                      fill="currentColor"
                    />
                  </svg>
                </motion.a>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
