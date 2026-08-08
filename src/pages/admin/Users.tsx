import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, createUser, updateUser, deleteUser, updateUserStatus, adminResetPassword, updateUserRole, forceLogoutUser } from "../../services/user.service";
import { getRoles } from "../../services/role.service";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { MoreVertical, Lock, Power, UserPlus, Edit, Trash, Search, CheckSquare } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Checkbox } from "../../components/ui/checkbox";

export function Users() {
  const queryClient = useQueryClient();
  const { hasPermission, user: currentUser } = useAuth();
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", roleId: "", password: "" });
  
  const { data, isLoading } = useQuery({
    queryKey: ["users", page, limit, search],
    queryFn: () => getUsers({ page, limit, search }),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string, isActive: boolean }) => updateUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setSelectedUsers([]);
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: string, newPassword: string }) => adminResetPassword(id, newPassword),
    onSuccess: () => alert("Password reset successful")
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] })
  });
  
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingUser) {
        await updateUser(editingUser.id, { firstName: data.firstName, lastName: data.lastName, email: data.email });
        if (data.roleId && data.roleId !== editingUser.roleId) {
          await updateUserRole(editingUser.id, data.roleId);
        }
      } else {
        await createUser(data);
      }
    },
    onSuccess: () => {
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });

  const users = data?.data?.users || data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

  const handleOpenModal = (user: any = null) => {
    setEditingUser(user);
    if (user) {
      setFormData({ firstName: user.firstName, lastName: user.lastName, email: user.email, roleId: user.roleId || "", password: "" });
    } else {
      setFormData({ firstName: "", lastName: "", email: "", roleId: "", password: "" });
    }
    setIsModalOpen(true);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.filter((u: any) => u.role?.name !== "SuperAdmin").map((u: any) => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, id]);
    } else {
      setSelectedUsers(selectedUsers.filter(uId => uId !== id));
    }
  };

  const handleBulkActivate = async () => {
    if (confirm(`Are you sure you want to activate ${selectedUsers.length} users?`)) {
      for (const id of selectedUsers) {
        await toggleStatusMutation.mutateAsync({ id, isActive: true });
      }
    }
  };

  const handleBulkDeactivate = async () => {
    if (confirm(`Are you sure you want to deactivate ${selectedUsers.length} users?`)) {
      for (const id of selectedUsers) {
        await toggleStatusMutation.mutateAsync({ id, isActive: false });
      }
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <div className="flex gap-2">
          {selectedUsers.length > 0 && hasPermission("Users", "write") && (
            <>
              <Button variant="outline" onClick={handleBulkActivate}><CheckSquare className="mr-2 h-4 w-4" /> Activate ({selectedUsers.length})</Button>
              <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={handleBulkDeactivate}><Power className="mr-2 h-4 w-4" /> Deactivate ({selectedUsers.length})</Button>
            </>
          )}
          {hasPermission("Users", "write") && (
            <Button onClick={() => handleOpenModal()}><UserPlus className="mr-2 h-4 w-4" /> Add User</Button>
          )}
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search users..." 
            className="pl-8" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={selectedUsers.length > 0 && selectedUsers.length === users.filter((u: any) => u.role?.name !== "SuperAdmin").length}
                    onChange={(e: any) => handleSelectAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedUsers.includes(user.id)}
                      disabled={user.role?.name === "SuperAdmin"}
                      onChange={(e: any) => handleSelect(user.id, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell><Badge variant="outline">{user.role?.name}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "destructive"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {hasPermission("Users", "write") && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenModal(user)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          
                          {user.role?.name !== "SuperAdmin" && (
                            <DropdownMenuItem onClick={() => toggleStatusMutation.mutate({ id: user.id, isActive: !user.isActive })}>
                              <Power className="mr-2 h-4 w-4" />
                              {user.isActive ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem onClick={() => {
                            const newPass = prompt("Enter new password for " + user.email);
                            if (newPass) resetPasswordMutation.mutate({ id: user.id, newPassword: newPass });
                          }}>
                            <Lock className="mr-2 h-4 w-4" /> Reset Password
                          </DropdownMenuItem>

                          {hasPermission("Users", "write") && (
                            <DropdownMenuItem onClick={async () => {
                              if (confirm(`Force logout all sessions for ${user.email}?`)) {
                                await forceLogoutUser(user.id);
                                alert("User has been forced to logout.");
                              }
                            }}>
                              <Power className="mr-2 h-4 w-4" /> Force Logout
                            </DropdownMenuItem>
                          )}
                          
                          {hasPermission("Users", "delete") && user.role?.name !== "SuperAdmin" && (
                            <DropdownMenuItem 
                              className="text-destructive focus:bg-destructive/10 cursor-pointer"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this user?")) {
                                  deleteMutation.mutate(user.id);
                                }
                              }}>
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
        <div className="space-x-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md shadow-lg border-muted">
            <CardHeader>
              <CardTitle>{editingUser ? "Edit User" : "Add User"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">First Name</label>
                    <Input required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Last Name</label>
                    <Input required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                {!editingUser && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <Input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                  </div>
                )}
                {hasPermission("Users", "write") && (
                  <div className="space-y-2 flex flex-col">
                    <label className="text-sm font-medium">Role</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      required
                      value={formData.roleId} 
                      onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    >
                      <option value="" disabled>Select a role</option>
                      {roles?.roles?.map((r: any) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      )) || roles.map?.((r: any) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                )}
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
