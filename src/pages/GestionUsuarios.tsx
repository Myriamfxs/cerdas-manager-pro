import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { logError } from '@/lib/logger';
import { Users, Shield, UserCog } from 'lucide-react';
import type { AppRole } from '@/types/database';

interface UserWithRole {
  id: string;
  email: string | null;
  nombre: string | null;
  nave_asignada: string | null;
  role: AppRole | null;
}

export default function GestionUsuarios() {
  const queryClient = useQueryClient();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email,
        nombre: profile.nombre,
        nave_asignada: profile.nave_asignada,
        role: roles?.find(r => r.user_id === profile.id)?.role || null,
      }));

      return usersWithRoles;
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Rol actualizado correctamente');
      setEditingUserId(null);
    },
    onError: (error) => {
      logError(error instanceof Error ? error.message : String(error), 'Error al actualizar rol');
      toast.error('Error al actualizar el rol');
    },
  });

  const updateNaveMutation = useMutation({
    mutationFn: async ({ userId, nave }: { userId: string; nave: string | null }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ nave_asignada: nave })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Nave asignada correctamente');
    },
    onError: (error) => {
      logError(error instanceof Error ? error.message : String(error), 'Error al asignar nave');
      toast.error('Error al asignar la nave');
    },
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">Administra los usuarios y sus permisos</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5" />
              Usuarios Registrados
            </CardTitle>
            <CardDescription>
              Lista de todos los usuarios con sus roles y naves asignadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Nave Asignada</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.nombre || 'Sin nombre'}
                      </TableCell>
                      <TableCell>{user.email || 'Sin email'}</TableCell>
                      <TableCell>
                        {editingUserId === user.id ? (
                          <Select
                            defaultValue={user.role || 'tecnico'}
                            onValueChange={(value) => {
                              updateRoleMutation.mutate({ 
                                userId: user.id, 
                                newRole: value as AppRole 
                              });
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="tecnico">Técnico</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge 
                            variant={user.role === 'admin' ? 'default' : 'secondary'}
                            className="flex items-center gap-1 w-fit"
                          >
                            {user.role === 'admin' && <Shield className="w-3 h-3" />}
                            {user.role || 'Sin rol'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.nave_asignada || 'none'}
                          onValueChange={(value) => {
                            updateNaveMutation.mutate({ 
                              userId: user.id, 
                              nave: value === 'none' ? null : value 
                            });
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Sin asignar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin asignar</SelectItem>
                            <SelectItem value="Nave 1">Nave 1</SelectItem>
                            <SelectItem value="Nave 2">Nave 2</SelectItem>
                            <SelectItem value="Nave 3">Nave 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingUserId(
                            editingUserId === user.id ? null : user.id
                          )}
                        >
                          {editingUserId === user.id ? 'Cancelar' : 'Editar Rol'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
