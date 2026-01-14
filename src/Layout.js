import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Scissors, Home, Calendar, LogOut, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const publicPages = ["Home", "BookAppointment"];
  const isPublicPage = publicPages.includes(currentPageName);

  const navItems = [
    { name: "בית", path: createPageUrl("Home"), icon: Home, public: true },
    { name: "קביעת תור", path: createPageUrl("BookAppointment"), icon: Calendar, public: true },
  ];

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen flex flex-col relative" dir="rtl" style={{ backgroundColor: '#FAF3EB' }}>
      <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@100&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;500;600;700&display=swap');
        :root {
          --camel-primary: #C69C6D;
          --camel-hover: #8B5E3C;
          --olive-primary: #6B8E23;
          --olive-light: #B6C27D;
          --cream-bg: #FAF3EB;
          --beige-natural: #EBDCCB;
          --text-dark: #2E2E2E;
          --text-secondary: #827E75;
        }
        
        @keyframes shimmer {
          0% { background-position: -100% 0; }
          100% { background-position: 200% 0; }
        }
        
        .nav-item {
          position: relative;
          overflow: hidden;
        }
        
        .nav-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }
        
        .nav-item:hover::before {
          left: 100%;
        }
        
        .logo-icon {
          transition: transform 0.3s ease;
        }
        
        .logo-icon:hover {
          transform: rotate(180deg) scale(1.1);
        }
      `}</style>

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b shadow-sm sticky top-0 z-50 relative" style={{ borderColor: '#EBDCCB' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-row-reverse">
            <Link to={createPageUrl("Home")} className="flex items-center gap-3 group">
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md logo-icon"
                style={{ 
                  background: 'linear-gradient(135deg, #C69C6D 0%, #8B5E3C 100%)'
                }}
              >
                <Scissors className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-right">
                <h1
                  className="transition-all duration-300 group-hover:tracking-wider text-sm sm:text-lg md:text-xl font-bold"
                  style={{
                    color: '#2E2E2E',
                    fontFamily: 'serif',
                    letterSpacing: '0.05em'
                  }}
                >
                  NOAA MALKA
                </h1>
              </div>
            </Link>

            <nav className="flex items-center gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="nav-item flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 font-medium"
                    style={{
                      backgroundColor: isActive ? '#EBDCCB' : 'transparent',
                      color: isActive ? '#C69C6D' : '#827E75',
                      transform: isActive ? 'scale(1.05)' : 'scale(1)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = '#FAF3EB';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    <span className="hidden sm:inline">{item.name}</span>
                    <item.icon className="w-5 h-5" />
                  </Link>
                );
              })}

              {/* כפתור התחברות - תמיד מוצג, הגישה תיחסם בדף עצמו */}
              <Link
                to={createPageUrl("Calendar")}
                className="nav-item flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 font-medium"
                style={{
                  backgroundColor: location.pathname === createPageUrl("Calendar") ? '#EBDCCB' : 'transparent',
                  color: location.pathname === createPageUrl("Calendar") ? '#C69C6D' : '#827E75',
                  transform: location.pathname === createPageUrl("Calendar") ? 'scale(1.05)' : 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== createPageUrl("Calendar")) {
                    e.currentTarget.style.backgroundColor = '#FAF3EB';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== createPageUrl("Calendar")) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                <span className="hidden sm:inline">אזור ניהול</span>
                <User className="w-5 h-5" />
              </Link>

              {user && (
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="gap-2 transition-all duration-300 hover:scale-105"
                >
                  <span className="hidden sm:inline">התנתק</span>
                  <LogOut className="w-4 h-4" />
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white/95 backdrop-blur-sm border-t mt-12 relative z-10" style={{ borderColor: '#EBDCCB' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm" style={{ color: '#827E75' }}>
              © Yuval Malka
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
