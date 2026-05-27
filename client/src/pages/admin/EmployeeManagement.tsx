import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Edit2, Trash2, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function EmployeeManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    role: "user",
    status: "active",
  });

  const { data: employees = [], refetch } = trpc.employees.getAllIncludingInactive.useQuery();
  const updateMutation = trpc.employees.updateEmployee.useMutation();
  const deactivateMutation = trpc.employees.deactivateEmployee.useMutation();
  const reactivateMutation = trpc.employees.reactivateEmployee.useMutation();

  const handleEdit = (employee: any) => {
    setEditingId(employee.id);
    setFormData({
      name: employee.name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      department: employee.department || "",
      position: employee.position || "",
      role: employee.role,
      status: employee.status,
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      await updateMutation.mutateAsync({
        employeeId: editingId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        position: formData.position,
        role: formData.role as "user" | "admin",
        status: formData.status as "active" | "inactive",
      });

      toast.success("Employee updated successfully!");
      setIsOpen(false);
      setEditingId(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update employee");
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm("Are you sure you want to deactivate this employee?")) return;

    try {
      await deactivateMutation.mutateAsync({ employeeId: id });
      toast.success("Employee deactivated");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to deactivate employee");
    }
  };

  const handleReactivate = async (id: number) => {
    try {
      await reactivateMutation.mutateAsync({ employeeId: id });
      toast.success("Employee reactivated");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to reactivate employee");
    }
  };

  const activeEmployees = employees.filter((e) => e.status === "active");
  const inactiveEmployees = employees.filter((e) => e.status === "inactive");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Employee Management</h1>
            <p className="text-muted-foreground mt-1">Manage employees and assign roles</p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{employees.length}</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-green-600">{activeEmployees.length}</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-red-600">{inactiveEmployees.length}</span>
            </CardContent>
          </Card>
        </div>

        {/* Active Employees */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Employees</CardTitle>
          </CardHeader>
          <CardContent>
            {activeEmployees.length === 0 ? (
              <p className="text-muted-foreground">No active employees</p>
            ) : (
              <div className="space-y-3">
                {activeEmployees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-sm text-muted-foreground">{employee.email}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{employee.department}</Badge>
                        <Badge variant="outline">{employee.position}</Badge>
                        <Badge variant={employee.role === "admin" ? "default" : "secondary"}>
                          {employee.role === "admin" ? "Admin" : "Employee"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={isOpen && editingId === employee.id} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => handleEdit(employee)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Employee</DialogTitle>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Name</label>
                              <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium">Email</label>
                              <Input
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium">Phone</label>
                              <Input
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium">Department</label>
                              <Input
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium">Position</label>
                              <Input
                                value={formData.position}
                                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium">Role</label>
                              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">Employee</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex gap-2">
                              <Button onClick={handleSave} disabled={updateMutation.isPending} className="flex-1">
                                Save
                              </Button>
                              <Button onClick={() => setIsOpen(false)} variant="outline" className="flex-1">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        onClick={() => handleDeactivate(employee.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inactive Employees */}
        {inactiveEmployees.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inactive Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inactiveEmployees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg opacity-60">
                    <div className="flex-1">
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-sm text-muted-foreground">{employee.email}</p>
                    </div>
                    <Button
                      onClick={() => handleReactivate(employee.id)}
                      variant="outline"
                      size="sm"
                    >
                      Reactivate
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
