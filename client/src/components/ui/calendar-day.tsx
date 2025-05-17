import { cn } from "@/lib/utils";
import { useState } from "react";

type CalendarDayStatus = "pending" | "approved" | "rejected" | null;

interface CalendarDayProps {
  day: number;
  inactive?: boolean;
  status?: CalendarDayStatus;
  selected?: boolean;
  onClick?: () => void;
}

export function CalendarDay({
  day,
  inactive = false,
  status = null,
  selected = false,
  onClick
}: CalendarDayProps) {
  return (
    <div 
      className={cn(
        "calendar-day text-center py-2 relative", 
        inactive ? "inactive" : "cursor-pointer",
        selected && !inactive ? "selected" : ""
      )}
      onClick={!inactive ? onClick : undefined}
    >
      {day}
      {status && (
        <div className={cn("status-dot", status)}></div>
      )}
    </div>
  );
}

interface CalendarProps {
  month: number;
  year: number;
  selectedDay?: number;
  onSelectDay?: (day: number) => void;
  odStatuses?: Record<string, CalendarDayStatus>;
}

export function Calendar({ 
  month, 
  year, 
  selectedDay,
  onSelectDay,
  odStatuses = {} 
}: CalendarProps) {
  // Get the first day of the month
  const firstDay = new Date(year, month, 1).getDay();
  
  // Get the number of days in the month
  const lastDate = new Date(year, month + 1, 0).getDate();
  
  // Get the number of days in the previous month
  const prevMonthLastDate = new Date(year, month, 0).getDate();
  
  // Generate days for the calendar grid
  const days = [];
  
  // Previous month days (inactive)
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      day: prevMonthLastDate - i,
      inactive: true,
      status: null
    });
  }
  
  // Current month days
  for (let i = 1; i <= lastDate; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({
      day: i,
      inactive: false,
      status: odStatuses[dateStr] || null
    });
  }
  
  // Next month days to fill the grid (inactive)
  const remainingCells = 42 - days.length; // 6 rows x 7 columns
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      day: i,
      inactive: true,
      status: null
    });
  }
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  return (
    <div className="calendar">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg text-foreground">Select OD Dates</h2>
        <div className="flex space-x-2 items-center">
          <button className="p-2 rounded-lg hover:bg-muted text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="text-foreground font-medium py-2">{monthNames[month]} {year}</span>
          <button className="p-2 rounded-lg hover:bg-muted text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {/* Day Labels */}
        {dayNames.map((day, index) => (
          <div key={index} className="text-center text-muted-foreground font-medium text-sm py-2">{day}</div>
        ))}
        
        {/* Calendar Days */}
        {days.map((day, index) => (
          <CalendarDay 
            key={index}
            day={day.day}
            inactive={day.inactive}
            status={day.status}
            selected={!day.inactive && day.day === selectedDay}
            onClick={() => onSelectDay && onSelectDay(day.day)}
          />
        ))}
      </div>
      
      <div className="mt-4 flex items-center justify-center space-x-4">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
          <span className="text-sm text-muted-foreground">Pending</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-success mr-2"></div>
          <span className="text-sm text-muted-foreground">Approved</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-error mr-2"></div>
          <span className="text-sm text-muted-foreground">Rejected</span>
        </div>
      </div>
    </div>
  );
}
