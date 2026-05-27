import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

export default function AttendanceHistory() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const startDate = startOfMonth(selectedMonth);
  const endDate = endOfMonth(selectedMonth);

  const { data: history = [], isLoading } = trpc.attendance.getHistory.useQuery({
    startDate,
    endDate,
  });

  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

  const getAttendanceForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return history.find((record) => format(new Date(record.attendanceDate), "yyyy-MM-dd") === dateStr);
  };

  const handleExport = () => {
    const csv = [
      ["Date", "Check-In", "Check-Out", "Work Hours", "Status"],
      ...history.map((record) => [
        format(new Date(record.attendanceDate), "yyyy-MM-dd"),
        record.checkInTime ? format(new Date(record.checkInTime), "HH:mm:ss") : "—",
        record.checkOutTime ? format(new Date(record.checkOutTime), "HH:mm:ss") : "—",
        record.workHours || "—",
        record.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${format(selectedMonth, "yyyy-MM")}.csv`;
    a.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800";
      case "late":
        return "bg-yellow-100 text-yellow-800";
      case "absent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Attendance History</h1>
            <p className="text-muted-foreground mt-1">View your attendance records and statistics</p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Month Navigation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {format(selectedMonth, "MMMM yyyy")}
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                  variant="outline"
                  size="sm"
                >
                  ← Previous
                </Button>
                <Button
                  onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                  variant="outline"
                  size="sm"
                >
                  Next →
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Calendar View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center font-semibold text-sm text-muted-foreground p-2">
                  {day}
                </div>
              ))}
              {daysInMonth.map((date) => {
                const attendance = getAttendanceForDate(date);
                const isCurrentMonth = date.getMonth() === selectedMonth.getMonth();

                return (
                  <div
                    key={date.toString()}
                    className={`p-2 rounded-lg text-center text-sm ${
                      isCurrentMonth ? "bg-card border border-border" : "bg-muted"
                    }`}
                  >
                    <div className="font-medium">{format(date, "d")}</div>
                    {attendance && (
                      <Badge className={`text-xs mt-1 ${getStatusColor(attendance.status)}`}>
                        {attendance.status}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Detailed List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detailed Records</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : history.length === 0 ? (
              <p className="text-muted-foreground">No attendance records for this month.</p>
            ) : (
              <div className="space-y-3">
                {history.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{format(new Date(record.attendanceDate), "EEEE, MMMM d, yyyy")}</p>
                      <p className="text-sm text-muted-foreground">
                        {record.checkInTime ? format(new Date(record.checkInTime), "HH:mm") : "—"} to{" "}
                        {record.checkOutTime ? format(new Date(record.checkOutTime), "HH:mm") : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold">{record.workHours || "—"} hrs</p>
                        <Badge variant="outline">{record.status}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-green-600">
                {history.filter((r) => r.status === "present").length}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Late</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-yellow-600">
                {history.filter((r) => r.status === "late").length}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-red-600">
                {history.filter((r) => r.status === "absent").length}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">
                {history.reduce((sum, r) => sum + (typeof r.workHours === 'number' ? r.workHours : 0), 0).toFixed(1)}
              </span>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
