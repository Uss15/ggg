import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { BookOpen, HelpCircle, Shield, Package, FolderOpen, FileCheck, Search } from 'lucide-react';

const Help = () => {
  const sections = [
    {
      icon: Package,
      title: 'Evidence Management',
      faqs: [
        {
          question: 'How do I create a new evidence bag?',
          answer: 'Click the "New Bag" button on the dashboard or navigate to the Create page. Fill in all required information including type, description, location, and optionally capture GPS coordinates. Upload photos if available and submit the form.',
        },
        {
          question: 'Can I edit evidence after creation?',
          answer: 'You can update the status and location of evidence, but core details like description and collection date are immutable to maintain chain of custody integrity. Changes are logged in the audit trail.',
        },
        {
          question: 'What is a QR code used for?',
          answer: 'Each evidence bag automatically gets a unique QR code. Scan it with the QR Scanner to quickly access evidence details, add custody entries, or update status without typing the bag ID.',
        },
      ],
    },
    {
      icon: FileCheck,
      title: 'Chain of Custody',
      faqs: [
        {
          question: 'What is chain of custody?',
          answer: 'Chain of custody is the chronological documentation of evidence handling. Every transfer, status change, or location update is recorded with timestamps, GPS coordinates, and digital signatures to ensure evidence integrity.',
        },
        {
          question: 'How do I add a custody entry?',
          answer: 'Open an evidence bag, click "Add Custody" in the Chain of Custody section, select the action type (transfer, analysis, etc.), enter location and notes, and optionally sign digitally.',
        },
        {
          question: 'Can custody records be deleted?',
          answer: 'No. Chain of custody records are immutable and cannot be edited or deleted to maintain legal integrity. All records are permanently stored with hash verification.',
        },
      ],
    },
    {
      icon: FolderOpen,
      title: 'Case Management',
      faqs: [
        {
          question: 'How do I create a case?',
          answer: 'Navigate to Cases > Create Case. Fill in the case details including offense type, location, and description. After creation, you can link evidence bags to the case.',
        },
        {
          question: 'How do I link evidence to a case?',
          answer: 'Open a case and click "Link Evidence". Search for the evidence bag by ID or description, add any notes about why it\'s relevant, and submit. The evidence will appear in the case evidence list.',
        },
        {
          question: 'What happens when I close a case?',
          answer: 'Closed cases become immutable - you cannot modify case details or link/unlink evidence. This ensures the final case record remains unchanged for legal purposes. Only administrators can close cases.',
        },
      ],
    },
    {
      icon: Shield,
      title: 'Security & Permissions',
      faqs: [
        {
          question: 'What are the different user roles?',
          answer: 'Admin: Full system access. Collector: Create and manage evidence. Lab Tech: Update evidence status and custody. Investigator: View evidence and create cases. Roles are assigned by administrators.',
        },
        {
          question: 'How is data protected?',
          answer: 'All data is encrypted in transit (HTTPS) and at rest (AES-256). Evidence photos use SHA-256 hashing for integrity verification. Row-level security ensures users only access authorized data.',
        },
        {
          question: 'What is the audit log?',
          answer: 'The audit log records every action in the system including logins, evidence creation, status changes, and case modifications. It\'s immutable and available to administrators for compliance and investigation.',
        },
      ],
    },
    {
      icon: Search,
      title: 'Search & Reporting',
      faqs: [
        {
          question: 'How do I search for evidence?',
          answer: 'Use the search bar on the dashboard to search by bag ID, description, or location. Use filters to narrow results by status, type, or date range. Click the search icon in the header for global search across all entities.',
        },
        {
          question: 'Can I export data?',
          answer: 'Yes. Click "Export CSV" on the dashboard to download evidence data. Generate PDF reports from individual evidence bags or cases. Admins can export audit logs for compliance.',
        },
        {
          question: 'What are random audits?',
          answer: 'Random audits allow you to systematically verify evidence integrity. The system randomly selects bags to check, and auditors verify the actual status and location match expected values. Discrepancies are flagged.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <HelpCircle className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold">Help Center</h1>
            <p className="text-muted-foreground text-lg">
              Find answers to common questions and learn how to use the system
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p>
                  Welcome to the SFEP Evidence Tracking System. This platform helps law enforcement
                  agencies manage evidence with complete chain of custody tracking, secure storage,
                  and comprehensive audit trails.
                </p>
                <div className="grid md:grid-cols-2 gap-4 not-prose mt-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Quick Start</h4>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Create your first evidence bag</li>
                      <li>Upload photos and documentation</li>
                      <li>Add custody entries as evidence moves</li>
                      <li>Link evidence to cases</li>
                    </ol>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Key Features</h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>Immutable chain of custody</li>
                      <li>GPS location tracking</li>
                      <li>Digital signatures</li>
                      <li>Real-time collaboration</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {section.faqs.map((faq, faqIndex) => (
                      <AccordionItem key={faqIndex} value={`item-${index}-${faqIndex}`}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <h3 className="text-xl font-semibold">Need More Help?</h3>
                <p className="text-muted-foreground">
                  Can't find what you're looking for? Contact your system administrator or
                  reach out to technical support.
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Badge variant="secondary">support@sfep.example.com</Badge>
                  <Badge variant="secondary">Documentation: docs.sfep.example.com</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Help;
