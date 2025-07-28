
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';

export default function AiPlannerPage() {
  return (
    <div className="grid gap-6">
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
