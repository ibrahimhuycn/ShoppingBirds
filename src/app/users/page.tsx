"use client"

import { useState, useEffect } from 'react';
import { AuthService } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  KeyRound,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import type { Database } from '@/types/database';

type User = Database['public']['Tables']['users']['Row'];

interface UserFormData {
  username: string;
  email: string;
  fullName: string;
  phone: string;
  password: string;
  isStoreEmployee: boolean;
  requirePasswordChange: boolean;
}

const defaultFormData: UserFormData = {
  username: '',
  email: '',
  fullName: '',
  phone: '',
  password: '',
  isStoreEmployee: false,
  requirePasswordChange: false,
};

export default function UsersPage(): JSX.Element {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddDialog, setShowAddDialog] = useState<boolean>(false);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [showResetDialog, setShowResetDialog] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const usersData: User[] = await AuthService.getAllUsers();
      setUsers(usersData);
    } catch (error: unknown) {
      toast.error('Failed to load users', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = (): void => {
    setFormData(defaultFormData);
    setShowPassword(false);
    setShowAddDialog(true);
  };

  const handleEditUser = (user: User): void => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      password: '',
      isStoreEmployee: user.is_store_employee,
      requirePasswordChange: user.require_password_change,
    });
    setShowPassword(false);
    setShowEditDialog(true);
  };

  const handleDeleteUser = (user: User): void => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleResetPassword = (user: User): void => {
    setSelectedUser(user);
    setShowResetDialog(true);
  };

  const submitAddUser = async (): Promise<void> => {
    if (!formData.username.trim() || !formData.email.trim() || !formData.fullName.trim() || !formData.password.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await AuthService.createUser({
        username: formData.username.trim(),
        email: formData.email.trim(),
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        isStoreEmployee: formData.isStoreEmployee,
        requirePasswordChange: formData.requirePasswordChange,
      });

      toast.success('User created successfully');
      setShowAddDialog(false);
      await loadUsers();
    } catch (error: unknown) {
      toast.error('Failed to create user', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitEditUser = async (): Promise<void> => {
    if (!selectedUser) return;

    if (!formData.username.trim() || !formData.email.trim() || !formData.fullName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await AuthService.updateUser(selectedUser.id, {
        username: formData.username.trim(),
        email: formData.email.trim(),
        full_name: formData.fullName.trim(),
        phone: formData.phone.trim(),
        is_store_employee: formData.isStoreEmployee,
        require_password_change: formData.requirePasswordChange,
      });

      toast.success('User updated successfully');
      setShowEditDialog(false);
      await loadUsers();
    } catch (error: unknown) {
      toast.error('Failed to update user', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDeleteUser = async (): Promise<void> => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await AuthService.deleteUser(selectedUser.id);
      
      toast.success('User deleted successfully');
      setShowDeleteDialog(false);
      await loadUsers();
    } catch (error: unknown) {
      toast.error('Failed to delete user', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitResetPassword = async (): Promise<void> => {
    if (!selectedUser) {
      toast.error('No user selected');
      return;
    }

    setIsSubmitting(true);
    try {
      await AuthService.resetUserPassword(selectedUser.email);
      
      toast.success('Password reset email sent', {
        description: 'User will receive an email to reset their password'
      });
      setShowResetDialog(false);
      await loadUsers();
    } catch (error: unknown) {
      toast.error('Failed to send password reset email', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof UserFormData, value: string | boolean): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage system users and their permissions</p>
        </div>
        <Button onClick={handleAddUser}>
          <Plus className="size-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            System Users ({users.length})
          </CardTitle>
          <CardDescription>
            Manage user accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="size-6 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="size-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user: User) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{user.full_name}</h3>
                      <Badge variant={user.is_store_employee ? "default" : "secondary"}>
                        {user.is_store_employee ? "Store Employee" : "Admin"}
                      </Badge>
                      {user.require_password_change && (
                        <Badge variant="outline" className="text-amber-600 border-amber-600">
                          Password Change Required
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>Username:</strong> {user.username}</p>
                      <p><strong>Email:</strong> {user.email}</p>
                      <p><strong>Phone:</strong> {user.phone}</p>
                      <p><strong>Created:</strong> {new Date(user.created_at || '').toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetPassword(user)}
                    >
                      <KeyRound className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account for the system
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('username', e.target.value)}
                placeholder="Enter username"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('password', e.target.value)}
                  placeholder="Enter password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isStoreEmployee"
                checked={formData.isStoreEmployee}
                onCheckedChange={(checked: boolean) => handleInputChange('isStoreEmployee', checked)}
              />
              <Label htmlFor="isStoreEmployee">Store Employee</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="requirePasswordChange"
                checked={formData.requirePasswordChange}
                onCheckedChange={(checked: boolean) => handleInputChange('requirePasswordChange', checked)}
              />
              <Label htmlFor="requirePasswordChange">Require Password Change</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitAddUser} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user account information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-username">Username *</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('username', e.target.value)}
                placeholder="Enter username"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-fullName">Full Name *</Label>
              <Input
                id="edit-fullName"
                value={formData.fullName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isStoreEmployee"
                checked={formData.isStoreEmployee}
                onCheckedChange={(checked: boolean) => handleInputChange('isStoreEmployee', checked)}
              />
              <Label htmlFor="edit-isStoreEmployee">Store Employee</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-requirePasswordChange"
                checked={formData.requirePasswordChange}
                onCheckedChange={(checked: boolean) => handleInputChange('requirePasswordChange', checked)}
              />
              <Label htmlFor="edit-requirePasswordChange">Require Password Change</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitEditUser} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the user "{selectedUser?.full_name}"? 
              This action cannot be undone and will permanently remove the user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitDeleteUser}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Password Reset Email</DialogTitle>
            <DialogDescription>
              Send a password reset email to "{selectedUser?.full_name}" at {selectedUser?.email}. They will receive instructions to reset their password.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="text-sm text-muted-foreground">
              The user will receive an email with a secure link to reset their password. They will be required to set a new password when they click the link.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitResetPassword} disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Reset Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}