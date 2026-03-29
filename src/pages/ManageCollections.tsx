import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, ArrowLeft, Archive } from 'lucide-react';
import Navigation from '@/components/Navigation';

interface Collection {
  id: string;
  name: string;
  description: string;
  amount: number;
  is_class_specific: boolean;
  class_names?: string[];
  is_active: boolean;
  created_at: string;
}

const ManageCollections = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isClassSpecific, setIsClassSpecific] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectAllClasses, setSelectAllClasses] = useState(false);

  useEffect(() => {
    loadCollections();
    loadClasses();
  }, []);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollections(data || []);
    } catch (err) {
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('name')
      .eq('is_active', true)
      .order('name');
    
    setClasses(data || []);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setAmount('');
    setIsClassSpecific(false);
    setSelectedClasses([]);
    setSelectAllClasses(false);
  };

  const handleCreateCollection = async () => {
    if (!name.trim()) {
      toast.error('Please enter collection name');
      return;
    }

    if (isClassSpecific && !selectAllClasses && selectedClasses.length === 0) {
      toast.error('Please select at least one class or choose "All Classes"');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('collections').insert({
        name: name.trim(),
        description: description.trim() || null,
        amount: amount ? parseFloat(amount) : null,
        is_class_specific: isClassSpecific,
        class_names: isClassSpecific && !selectAllClasses ? selectedClasses : null,
        created_by: user?.id,
      });

      if (error) throw error;

      toast.success('Collection created successfully');
      setShowDialog(false);
      resetForm();
      loadCollections();
    } catch (err) {
      toast.error('Failed to create collection');
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveCollection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('collections')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast.success('Collection archived');
      loadCollections();
    } catch (err) {
      toast.error('Failed to archive collection');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto pt-28 pb-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold">Manage Collections</h1>
              <p className="text-muted-foreground">Create and manage fee collection types</p>
            </div>
          
            {!roleLoading && isAdmin && (
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Collection
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Collection</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Collection Name *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Paper Fund 2025, Annual Tour"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this collection"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Suggested Amount (Optional)</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g., 500"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={isClassSpecific}
                    onCheckedChange={(checked) => {
                      setIsClassSpecific(checked as boolean);
                      if (!checked) {
                        setSelectedClasses([]);
                        setSelectAllClasses(false);
                      }
                    }}
                  />
                  <Label>Class Specific</Label>
                </div>
                
                {isClassSpecific && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectAllClasses}
                        onCheckedChange={(checked) => {
                          setSelectAllClasses(checked as boolean);
                          if (checked) {
                            setSelectedClasses([]);
                          }
                        }}
                      />
                      <Label>Apply to All Classes</Label>
                    </div>
                    
                    {!selectAllClasses && (
                      <div className="space-y-2">
                        <Label>Select Classes (multiple allowed)</Label>
                        <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                          {classes.map((cls) => (
                            <div key={cls.name} className="flex items-center space-x-2">
                              <Checkbox
                                checked={selectedClasses.includes(cls.name)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedClasses([...selectedClasses, cls.name]);
                                  } else {
                                    setSelectedClasses(selectedClasses.filter(c => c !== cls.name));
                                  }
                                }}
                              />
                              <Label className="cursor-pointer">{cls.name}</Label>
                            </div>
                          ))}
                        </div>
                        {selectedClasses.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {selectedClasses.length} class(es) selected
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <Button
                  onClick={handleCreateCollection}
                  disabled={loading}
                  className="w-full"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Collection
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Collections</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : collections.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No collections created yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {collections.map((collection) => (
                  <Card key={collection.id} className={collection.is_active ? '' : 'opacity-50'}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{collection.name}</h3>
                            {!collection.is_active && (
                              <span className="text-xs bg-muted px-2 py-1 rounded">Archived</span>
                            )}
                            {collection.is_class_specific && collection.class_names && collection.class_names.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {collection.class_names.map((className) => (
                                  <span key={className} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                    {className}
                                  </span>
                                ))}
                              </div>
                            ) : collection.is_class_specific ? (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                All Classes
                              </span>
                            ) : null}
                          </div>
                          {collection.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {collection.description}
                            </p>
                          )}
                          {collection.amount && (
                            <p className="text-sm font-semibold mt-2">
                              Suggested Amount: Rs. {collection.amount}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Created: {new Date(collection.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        {collection.is_active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArchiveCollection(collection.id)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManageCollections;
