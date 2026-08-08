import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRoleById, updateRolePermissions } from "../../services/role.service";
import { api } from "../../lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { ArrowLeft, Save } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function RolePermissions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Fetch role and its current permissions
  const { data: roleData, isLoading: isLoadingRole } = useQuery({
    queryKey: ["role", id],
    queryFn: () => getRoleById(id!),
    enabled: !!id,
  });

  // Fetch all available permissions
  const { data: allPermissionsData, isLoading: isLoadingPerms } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const { data } = await api.get("/permissions");
      return data.data;
    },
  });

  useEffect(() => {
    if (roleData?.role?.permissions) {
      setSelectedPermissions(roleData.role.permissions.map((p: any) => p.id));
      setIsDirty(false);
    }
  }, [roleData]);

  const saveMutation = useMutation({
    mutationFn: () => updateRolePermissions(id!, selectedPermissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role", id] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setIsDirty(false);
      alert("Permissions updated successfully");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to update permissions");
    }
  });

  if (isLoadingRole || isLoadingPerms) return <div>Loading...</div>;

  const role = roleData?.role;
  const allPermissions = allPermissionsData?.permissions || [];

  // Group permissions by module
  const modules = Array.from(new Set(allPermissions.map((p: any) => p.module)));
  
  // Create a structured matrix
  const matrix: Record<string, { read: any, write: any, delete: any }> = {};
  modules.forEach((mod: any) => {
    const modPerms = allPermissions.filter((p: any) => p.module === mod);
    matrix[mod] = {
      read: modPerms.find((p: any) => p.action === "read"),
      write: modPerms.find((p: any) => p.action === "write"),
      delete: modPerms.find((p: any) => p.action === "delete"),
    };
  });

  const handleToggle = (permId: string) => {
    setIsDirty(true);
    setSelectedPermissions(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const isSuperAdmin = role?.name === "SuperAdmin";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/roles")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Role Permissions</h1>
          <p className="text-muted-foreground">Manage access rights for {role?.name}</p>
        </div>
        <Button 
          disabled={!isDirty || saveMutation.isPending || isSuperAdmin}
          onClick={() => saveMutation.mutate()}
        >
          <Save className="mr-2 h-4 w-4" /> 
          {saveMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {isSuperAdmin && (
        <div className="bg-blue-50 text-blue-800 p-4 rounded-md border border-blue-200">
          <strong>SuperAdmin Role:</strong> This role has implicit access to all modules. Its permissions cannot be modified.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/50 text-muted-foreground uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Module</th>
                  <th className="px-6 py-3 font-medium text-center">Read</th>
                  <th className="px-6 py-3 font-medium text-center">Write</th>
                  <th className="px-6 py-3 font-medium text-center">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {modules.map((modName: any) => {
                  const row = matrix[modName];
                  return (
                    <tr key={modName} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium">{modName}</td>
                      <td className="px-6 py-4 text-center">
                        {row.read && (
                          <Checkbox 
                            id={row.read.id}
                            disabled={isSuperAdmin}
                            checked={isSuperAdmin || selectedPermissions.includes(row.read.id)}
                            onCheckedChange={() => handleToggle(row.read.id)}
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.write && (
                          <Checkbox 
                            id={row.write.id}
                            disabled={isSuperAdmin}
                            checked={isSuperAdmin || selectedPermissions.includes(row.write.id)}
                            onCheckedChange={() => handleToggle(row.write.id)}
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.delete && (
                          <Checkbox 
                            id={row.delete.id}
                            disabled={isSuperAdmin}
                            checked={isSuperAdmin || selectedPermissions.includes(row.delete.id)}
                            onCheckedChange={() => handleToggle(row.delete.id)}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
