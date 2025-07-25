'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Loader2, Users } from 'lucide-react';
import { User } from '@/types/firestore';
import { useAuth } from '@/hooks/use-auth';

export function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});
  const { user: authUser } = useAuth();

  const { toast } = useToast();
  const usersCollectionRef = collection(db, 'users');

  const getUsers = async () => {
    setLoading(true);
    try {
        const data = await getDocs(usersCollectionRef);
        setUsers(data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as User)));
    } catch(e) {
         console.error("Error fetching users:", e);
         toast({
            variant: 'destructive',
            title: 'Error fetching users',
            description: 'Could not retrieve user data.'
        });
    }
    setLoading(false);
  };

  useEffect(() => {
    getUsers();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: User['role']) => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (currentUser) {
        const userDoc = doc(db, 'users', currentUser.id);
        await updateDoc(userDoc, formData);
        await getUsers();
        toast({ title: 'User Updated!', description: 'The user has been successfully updated.' });
      } else {
        // This is a simplified user creation. In a real app, you'd use Firebase Auth to create a user first.
        await addDoc(usersCollectionRef, { ...formData, companyId: authUser?.companyId, uid: `new-user-${Date.now()}` }); 
        await getUsers();
        toast({ title: 'User Added!', description: 'The new user has been added.' });
      }
      closeDialog();
    } catch (error) {
       toast({ variant: 'destructive', title: 'Save failed', description: 'Could not save the user. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const openDialog = (user: User | null = null) => {
    setCurrentUser(user);
    setFormData(user || { role: 'viewer' });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setCurrentUser(null);
    setFormData({});
  };
  
  const handleDelete = async (user: User) => {
     if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;
     const userDoc = doc(db, 'users', user.id);
     await deleteDoc(userDoc);
     await getUsers();
     toast({ title: 'User Deleted', description: `${user.name} has been removed.` });
  };
  
  if (loading && !isDialogOpen) {
    return (
        <div className="flex items-center justify-center h-48">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 gap-4">
         <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Users />
            User Management
        </h1>
        <Button onClick={() => openDialog()}>
          <PlusCircle className="mr-2" />
          Add New User
        </Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="capitalize">{user.role}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openDialog(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(user)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{currentUser ? 'Edit User' : 'Add New User'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" name="name" value={formData.name || ''} onChange={handleFormChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleFormChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">Role</Label>
                 <Select onValueChange={handleRoleChange} value={formData.role} required>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="mounter">Mounter</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" /> : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
