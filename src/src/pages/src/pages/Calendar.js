// updated CalendarPage.tsx with password protection
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import FullCalendar from "./FullCalendar"; // assuming this is your full calendar component

export default function CalendarPage() {
  const [password, setPassword] = useState("");
  const [accessGranted, setAccessGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  const CORRECT_PASSWORD = "336699";

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C69C6D' }} />
      </div>
    );
  }

  if (!accessGranted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ backgroundColor: "#FAF3EB" }}>
        <div className="bg-white shadow-lg rounded-xl p-8 text-center w-full max-w-md">
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#2E2E2E" }}>
            כניסה ליומן
          </h2>
          <p className="text-sm mb-4" style={{ color: "#C69C6D" }}>
            גישה מוגבלת לספר/ית בלבד
          </p>
          <p className="text-sm mb-6" style={{ color: "#827E75" }}>
            הזיני את סיסמת הגישה שלך, נועה 
          </p>
          <input
            type="password"
            placeholder="הקלידי סיסמה..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#C69C6D]"
          />
          <Button
            onClick={() => {
              if (password === CORRECT_PASSWORD) {
                setAccessGranted(true);
                toast.success("ברוכה הבאה נועה ");
              } else {
                toast.error("סיסמה שגויה ");
              }
            }}
            className="w-full text-white border-0"
            style={{ backgroundColor: "#C69C6D" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#8B5E3C")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#C69C6D")}
          >
            כניסה
          </Button>
        </div>
      </div>
    );
  }

  return <FullCalendar />;
}
