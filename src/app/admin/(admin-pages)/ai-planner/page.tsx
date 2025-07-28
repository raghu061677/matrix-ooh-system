
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function AiPlannerPage() {
  return (
    <div className="grid gap-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/admin/media-plans"><ChevronLeft /></Link>
            </Button>
            <h1 className="text-xl font-bold">AI Media Planner</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Bot />
                AI Planner (Beta)
            </CardTitle>
             <CardDescription>
                Generate a tailored media plan in seconds with a simple prompt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
                This page will contain the AI Planner interface. Users can type a prompt like "Create a plan for Ahmedabad with sites available in 5 days & rates between 50,000 to 1,00,000" and the AI will generate a suggested plan.
            </p>
          </CardContent>
        </Card>
    </div>
  );
}
