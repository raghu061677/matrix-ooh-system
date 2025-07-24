
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image as ImageIcon } from 'lucide-react';

export default function PhotoLibraryPage() {
  return (
    <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <ImageIcon />
                Photo Library
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
                This section will be a central repository for all campaign-related photos, including geo-tagged images, newspaper clippings, and traffic shots.
            </p>
          </CardContent>
        </Card>
    </div>
  );
}
