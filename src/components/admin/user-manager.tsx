
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, limit, startAfter, endBefore, limitToLast, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
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

const PAGE_SIZE = 10;

const sampleUsers: User[] = [
    { id: 'user-1', uid: 'user-1', name: 'Admin User', email: 'admin@mediavenue.com', role: 'admin', avatar: 'https://i.pravatar.cc/150?u=admin' },
    { id: 'user-2', uid: 'user-2', name: 'Sales Person', email: 'sales@mediavenue.com', role: 'sales', avatar: 'https://i.pravatar.cc/150?u=sales' },
    { id: 'user-3', uid: 'user-3', name: 'Operations Manager', email: 'ops@mediavenue.com', role: 'operations', avatar: 'https://i.pravatar.cc/150?u=ops' },
];


export function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});
  
    // Pagination state
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstVisible, setFirstVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [isLastPage, setIsLastPage] = useState(false);
  const [isFirstPage, setIsFirstPage] = useState(true);

  const { toast } = useToast();
  const usersCollectionRef = collection(db, 'users');

  const fetchUsers = async (direction: 'next' | 'prev' | 'initial' = 'initial') => {
      setLoading(true);
      try {
          let q;

          if (direction === 'next' && lastVisible) {
              q = query(usersCollectionRef, orderBy('name'), startAfter(lastVisible), limit(PAGE_SIZE));
          } else if (direction === 'prev' && firstVisible) {
              q = query(usersCollectionRef, orderBy('name'), endBefore(firstVisible), limitToLast(PAGE_SIZE));
          } else {
              q = query(usersCollectionRef, orderBy('name'), limit(PAGE_SIZE));
          }

          const data = await getDocs(q);
          
          if (!data.empty) {
              const dbUsers = data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as User));
              setUsers(dbUsers);
              setFirstVisible(data.docs[0]);
              setLastVisible(data.docs[data.docs.length - 1]);
              
              const prevSnap = await getDocs(query(usersCollectionRef, orderBy('name'), endBefore(data.docs[0]), limitToLast(1)));
              setIsFirstPage(prevSnap.empty);

              const nextSnap = await getDocs(query(usersCollectionRef, orderBy('name'), startAfter(data.docs[data.docs.length - 1]), limit(1)));
              setIsLastPage(nextSnap.empty);

          } else if (direction === 'initial') {
              setUsers(sampleUsers.slice(0, PAGE_SIZE));
              setIsLastPage(sampleUsers.length <= PAGE_SIZE);
          }
      } catch (e) {
          console.error("Error fetching users:", e);
          toast({
              variant: 'destructive',
              title: 'Error fetching users',
              description: 'Could not retrieve user data. Using sample data.'
          });
          setUsers(sampleUsers.slice(0, PAGE_SIZE));
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    fetchUsers('initial');
  }, [toast]);

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
        setUsers(users.map(user => user.id === currentUser.id ? { ...user, ...formData, id: currentUser.id } as User : user));
        toast({ title: 'User Updated!', description: 'The user has been successfully updated.' });
      } else {
        const docRef = await addDoc(usersCollectionRef, { ...formData, uid: `new-user-${Date.now()}` }); // uid should come from auth
        setUsers([...users, { ...formData, id: docRef.id } as User]);
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
     const userDoc = doc(db, 'users', user.id);
     await deleteDoc(userDoc);
     setUsers(users.filter(u => u.id !== user.id));
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
      
       <div className="flex justify-end items-center gap-2 mt-4">
        <Button
            variant="outline"
            onClick={() => fetchUsers('prev')}
            disabled={isFirstPage || loading}
        >
            Previous
        </Button>
        <Button
            variant="outline"
            onClick={() => fetchUsers('next')}
            disabled={isLastPage || loading}
        >
            Next
        </Button>
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
                    <SelectItem value="operations">Operations</SelectItem>
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

    