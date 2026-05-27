import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, Search } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format, startOfMonth, endOfMonth } from "date-fns";

export default function AttendanceRecords() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: employees = [] } = trpc.employees.getAll.useQuery();

  const startDate = startOfMonth(selectedMonth);
  const endDate = endOfMonth(selectedMonth);

  const { data: allRecords = [] } = trpc.attendance.getEmployeeHistory.useQuery(
    {
      userId: selectedEmployeeId ? parseInt(selectedEmployeeId) : employees[0]?.id || 0,
      startDate,
      endDate,
    },
    {
      enabled: selectedEmployeeId !== "" || employees.length > 0,
    }
  );

  const filteredRecords = allRecords.filter((record) => {
    const employee = employees.find((e) => e.id === record.userId);
    return (
      !searchTerm ||
      employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleExport = () => {
    const csv = [
      ["Date", "Employee", "Check-In", "Check-Out", "Work Hours", "Status"],
      ...filteredRecords.map((record) => {
        const employee = employees.find((e) => e.id === record.userId);
        return [
          format(new Date(record.attendanceDate), "yyyy-MM-dd"),
          employee?.name || "Unknown",
          record.checkInTime ? format(new Date(record.checkInTime), "HH:mm:ss") : "—",
          record.checkOutTime ? format(new Date(record.checkOutTime), "HH:mm:ss") : "—",
          record.workHours || "—",
          record.status,
        ];
      }),
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

  const stats = {
    total: filteredRecords.length,
    present: filteredRecords.filter((r) => r.status === "present").length,
    late: filteredRecords.filter((r) => r.status === "late").length,
    absent: filteredRecords.filter((r) => r.status === "absent").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Attendance Records</h1>
            <p className="text-muted-foreground mt-1">View and export attendance logs</p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Month</label>
                <Input
                  type="month"
                  value={format(selectedMonth, "yyyy-MM")}
                  onChange={(e) => {
                    const [year, month] = e.target.value.split("-");
                    setSelectedMonth(new Date(parseInt(year), parseInt(month) - 1));
                  }}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Employee</label>
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Search</label>
                <div className="relative mt-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{stats.total}</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-green-600">{stats.present}</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Late</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-yellow-600">{stats.late}</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-red-600">{stats.absent}</span>
            </CardContent>
          </Card>
        </div>

        {/* Records Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {format(selectedMonth, "MMMM yyyy")} Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRecords.length === 0 ? (
              <p className="text-muted-foreground">No records found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Date</th>
                      <th className="text-left p-2 font-medium">Employee</th>
                      <th className="text-left p-2 font-medium">Check-In</th>
                      <th className="text-left p-2 font-medium">Check-Out</th>
                      <th className="text-left p-2 font-medium">Hours</th>
                      <th className="text-left p-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => {
                      const employee = employees.find((e) => e.id === record.userId);
                      return (
                        <tr key={record.id} className="border-b hover:bg-muted/50">
                          <td className="p-2">
                            {format(new Date(record.attendanceDate), "MMM d, yyyy")}
                          </td>
                          <td className="p-2">{employee?.name}</td>
                          <td className="p-2">
                            {record.checkInTime
                              ? format(new Date(record.checkInTime), "HH:mm:ss")
                              : "—"}
                          </td>
                          <td className="p-2">
                            {record.checkOutTime
                              ? format(new Date(record.checkOutTime), "HH:mm:ss")
                              : "—"}
                          </td>
                          <td className="p-2">{record.workHours || "—"}</td>
                          <td className="p-2">
                            <Badge className={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
