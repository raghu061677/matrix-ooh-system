
'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContactForm } from '@/components/home/contact-form';

export default function EnquiryPage() {
    const params = useParams();
    const assetId = params.assetId;

    return (
        <div className="container py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-12">
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Enquiry for Asset ID: {assetId}</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <p className="text-muted-foreground">
                                Asset details will be displayed here soon. For now, please use the form to submit your enquiry.
                           </p>
                        </CardContent>
                    </Card>
                </div>
                 <div>
                    <h2 className="text-3xl font-bold font-headline mb-4">Contact Us</h2>
                    <ContactForm />
                </div>
            </div>
        </div>
    );
}
