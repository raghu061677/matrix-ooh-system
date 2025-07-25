
'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, Briefcase } from 'lucide-react';
import Image from 'next/image';
import { getCompanySettings, updateCompanySettings, updateCompanyLogo } from '@/ai/flows/manage-company-settings';

const companySettingsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required.'),
  gstNumber: z.string().optional(),
  address: z.string().min(1, 'Address is required.'),
  logoUrl: z.string().url().optional(),
});

type CompanySettingsFormData = z.infer<typeof companySettingsSchema>;

export default function CompanySettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { control, handleSubmit, reset, setValue } = useForm<CompanySettingsFormData>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      companyName: '',
      gstNumber: '',
      address: '',
      logoUrl: '',
    },
  });

  React.useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      try {
        const settings = await getCompanySettings();
        if (settings) {
          reset(settings);
          if (settings.logoUrl) {
            setLogoPreview(settings.logoUrl);
          }
        }
      } catch (error) {
        console.error('Failed to fetch company settings:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load company settings.',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [reset, toast]);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        handleLogoUpload(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setSaving(true);
    toast({ title: 'Uploading logo...' });
    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64 = reader.result as string;
            const { logoUrl } = await updateCompanyLogo({ logoDataUri: base64, contentType: file.type });
            setValue('logoUrl', logoUrl);
            setLogoPreview(logoUrl);
            toast({ title: 'Logo uploaded successfully!', variant: 'default' });
        }
    } catch (error) {
      console.error('Logo upload failed:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Could not upload the new logo.',
      });
      setLogoPreview(null); // Reset preview on failure
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async (data: CompanySettingsFormData) => {
    setSaving(true);
    try {
      await updateCompanySettings(data);
      toast({
        title: 'Settings Saved',
        description: 'Your company details have been updated successfully.',
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save company settings.',
      });
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-48"><Loader2 className="h-12 w-12 animate-spin" /></div>;
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase />
            Company Settings
          </CardTitle>
          <CardDescription>
            Manage your company branding and details. This information will be used across the application, including in generated reports and templates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-4">
              <h3 className="font-semibold text-lg">Company Logo</h3>
              <div
                className="relative aspect-video w-full border-2 border-dashed rounded-lg flex flex-col justify-center items-center text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {logoPreview ? (
                  <Image src={logoPreview} alt="Logo Preview" layout="fill" objectFit="contain" className="p-2" />
                ) : (
                  <>
                    <UploadCloud className="h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Click to upload a logo</p>
                    <p className="text-xs text-muted-foreground">(e.g., PNG, JPG, SVG)</p>
                  </>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onFileChange}
                  className="hidden"
                  accept="image/png, image/jpeg, image/svg+xml"
                />
              </div>
               {saving && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="animate-spin h-4 w-4" /> Uploading...</p>}
            </div>

            <div className="md:col-span-2 space-y-4">
              <Controller
                name="companyName"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" {...field} />
                    {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                  </div>
                )}
              />
              <Controller
                name="gstNumber"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="gstNumber">GST Number</Label>
                    <Input id="gstNumber" {...field} />
                     {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                  </div>
                )}
              />
              <Controller
                name="address"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="address">Company Address</Label>
                    <Textarea id="address" {...field} rows={4} />
                     {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                  </div>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="animate-spin mr-2" /> : null}
                  Save Settings
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
