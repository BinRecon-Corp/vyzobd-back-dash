import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRoles, createRole, updateRole, deleteRole } from "../../services/role.service";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { ShieldPlus, Edit, Copy, Trash, ShieldAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

export function Roles() {
  const queryClient = useQueryClient();
  const { hasPermission, user } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", description: "", permissionIds: [] });
  
  const { data: rolesData = [], isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
    onError: (err: any) => alert(err.response?.data?.message || err.response?.data?.error?.message || "Failed to delete role")
  });
  
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingRole && !data.isClone) {
        await updateRole(editingRole.id, { name: data.name, description: data.description });
      } else {
        await createRole({ name: data.name, description: data.description, permissionIds: data.permissionIds });
      }
    },
    onSuccess: () => {
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (err: any) => alert(err.response?.data?.message || err.response?.data?.error?.message || "Failed to save role")
  });

  const roles = rolesData.roles || rolesData;

  const handleOpenModal = (role: any = null, isClone = false) => {
    setEditingRole(isClone ? null : role);
    if (role) {
      setFormData({ 
        name: isClone ? `${role.name} (Copy)` : role.name, 
        description: role.description || "", 
        permissionIds: role.permissions?.map((p: any) => p.id) || [],
        ...({ isClone }) 
      });
    } else {
      setFormData({ name: "", description: "", permissionIds: [] });
    }
    setIsModalOpen(true);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
        {hasPermission("Roles", "write") && (
          <Button onClick={() => handleOpenModal()}><ShieldPlus className="mr-2 h-4 w-4" /> Create Role</Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Users</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role: any) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    <Badge variant={role.name === "SuperAdmin" ? "default" : "outline"}>{role.name}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{role.description || "-"}</TableCell>
                  <TableCell>{role._count?.users || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {hasPermission("Roles", "write") && (
                        <Button variant="ghost" size="icon" title="Clone" onClick={() => handleOpenModal(role, true)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                      {hasPermission("Roles", "write") && (
                        <Link to={`/admin/roles/${role.id}`}>
                          <Button variant="ghost" size="icon" title="Permissions">
                            <ShieldAlert className="h-4 w-4 text-primary" />
                          </Button>
                        </Link>
                      )}
                      {hasPermission("Roles", "write") && role.name !== "SuperAdmin" && (
                        <Button variant="ghost" size="icon" title="Edit" onClick={() => handleOpenModal(role)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {hasPermission("Roles", "delete") && role.name !== "SuperAdmin" && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive" 
                          title="Delete"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this role?")) {
                              deleteMutation.mutate(role.id);
                            }
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md shadow-lg border-muted">
            <CardHeader>
              <CardTitle>{(formData as any).isClone ? "Clone Role" : editingRole ? "Edit Role" : "Create Role"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role Name</label>
                  <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
