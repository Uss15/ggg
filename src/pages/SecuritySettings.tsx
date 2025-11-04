import { Header } from '@/components/Header';
import { MFAEnrollment } from '@/components/security/MFAEnrollment';
import { RoleAuditDashboard } from '@/components/security/RoleAuditDashboard';
import { GeofenceManager } from '@/components/security/GeofenceManager';
import { IPAccessControl } from '@/components/security/IPAccessControl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield } from 'lucide-react';

export default function SecuritySettings() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <Shield className="h-8 w-8" />
            Security Settings
          </h1>
          <p className="text-muted-foreground">
            Manage advanced security features and access controls
          </p>
        </div>

        <Tabs defaultValue="mfa" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="mfa">2FA</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
            <TabsTrigger value="geofence">Geo-Fencing</TabsTrigger>
            <TabsTrigger value="ip">IP Control</TabsTrigger>
          </TabsList>

          <TabsContent value="mfa" className="space-y-4">
            <MFAEnrollment />
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <RoleAuditDashboard />
          </TabsContent>

          <TabsContent value="geofence" className="space-y-4">
            <GeofenceManager />
          </TabsContent>

          <TabsContent value="ip" className="space-y-4">
            <IPAccessControl />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
