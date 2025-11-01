import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, QrCode, FolderPlus, ClipboardCheck, FileSearch } from 'lucide-react';

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Plus,
      label: 'New Evidence',
      description: 'Create new evidence bag',
      onClick: () => navigate('/create'),
      variant: 'default' as const,
    },
    {
      icon: QrCode,
      label: 'Scan QR',
      description: 'Scan evidence QR code',
      onClick: () => navigate('/scan'),
      variant: 'outline' as const,
    },
    {
      icon: FolderPlus,
      label: 'New Case',
      description: 'Create new case',
      onClick: () => navigate('/cases/create'),
      variant: 'outline' as const,
    },
    {
      icon: ClipboardCheck,
      label: 'View Cases',
      description: 'Browse all cases',
      onClick: () => navigate('/cases'),
      variant: 'outline' as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSearch className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant={action.variant}
                className="h-auto flex-col gap-2 p-4"
                onClick={action.onClick}
              >
                <Icon className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-semibold text-sm">{action.label}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
