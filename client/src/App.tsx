import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

// Public pages
import Home from "./pages/Home";

// Employee pages
import EmployeeDashboard from "./pages/employee/Dashboard";
import CheckInOut from "./pages/employee/CheckInOut";
import AttendanceHistory from "./pages/employee/AttendanceHistory";
import LeaveRequests from "./pages/employee/LeaveRequests";
import Profile from "./pages/employee/Profile";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import EmployeeManagement from "./pages/admin/EmployeeManagement";
import AttendanceRecords from "./pages/admin/AttendanceRecords";
import LeaveApproval from "./pages/admin/LeaveApproval";

function ProtectedRoute({ component: Component, requiredRole }: any) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!user) {
    return <Home />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <NotFound />;
  }

  return <Component />;
}

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path={"/"} component={Home} />

      {/* Employee routes */}
      {user?.role === "user" && (
        <>
          <Route path={"/dashboard"} component={EmployeeDashboard} />
          <Route path={"/check-in-out"} component={CheckInOut} />
          <Route path={"/attendance-history"} component={AttendanceHistory} />
          <Route path={"/leave-requests"} component={LeaveRequests} />
          <Route path={"/profile"} component={Profile} />
        </>
      )}

      {/* Admin routes */}
      {user?.role === "admin" && (
        <>
          <Route path={"/admin/dashboard"} component={AdminDashboard} />
          <Route path={"/admin/employees"} component={EmployeeManagement} />
          <Route path={"/admin/attendance"} component={AttendanceRecords} />
          <Route path={"/admin/leave-approval"} component={LeaveApproval} />
        </>
      )}

      {/* Fallback */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
