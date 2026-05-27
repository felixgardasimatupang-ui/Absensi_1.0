import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Camera, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: todayAttendance, isLoading } = trpc.attendance.getTodayAttendance.useQuery();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isCheckedIn = !!todayAttendance?.checkInTime;
  const isCheckedOut = !!todayAttendance?.checkOutTime;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
            <p className="text-muted-foreground mt-1">{user?.department} • {user?.position}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{currentTime.toLocaleTimeString()}</p>
            <p className="text-sm text-muted-foreground">{currentTime.toLocaleDateString()}</p>
          </div>
        </div>

        {/* Today's Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {isCheckedOut ? "Checked Out" : isCheckedIn ? "Checked In" : "Not Started"}
                </span>
                <Badge variant={isCheckedOut ? "default" : isCheckedIn ? "secondary" : "outline"}>
                  {todayAttendance?.status || "pending"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Check-In Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-lg font-semibold">
                  {todayAttendance?.checkInTime
                    ? new Date(todayAttendance.checkInTime).toLocaleTimeString()
                    : "—"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Work Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-lg font-semibold">
                {todayAttendance?.workHours ? `${todayAttendance.workHours}h` : "—"}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendance Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => navigate("/check-in-out")}
                className="w-full"
                variant={isCheckedIn ? "outline" : "default"}
              >
                <Camera className="w-4 h-4 mr-2" />
                {isCheckedIn ? "Already Checked In" : "Check In"}
              </Button>
              <Button
                onClick={() => navigate("/check-in-out")}
                className="w-full"
                variant={isCheckedOut ? "outline" : "default"}
                disabled={!isCheckedIn}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isCheckedOut ? "Already Checked Out" : "Check Out"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => navigate("/attendance-history")}
                className="w-full"
                variant="outline"
              >
                View History
              </Button>
              <Button
                onClick={() => navigate("/leave-requests")}
                className="w-full"
                variant="outline"
              >
                Leave Requests
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Details</CardTitle>
          </CardHeader>
          <CardContent>
            {todayAttendance ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-In Location:</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {todayAttendance.checkInLatitude
                      ? `${todayAttendance.checkInLatitude}, ${todayAttendance.checkInLongitude}`
                      : "—"}
                  </span>
                </div>
                {todayAttendance.checkOutTime && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-Out Location:</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {todayAttendance.checkOutLatitude
                        ? `${todayAttendance.checkOutLatitude}, ${todayAttendance.checkOutLongitude}`
                        : "—"}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No attendance record for today yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
