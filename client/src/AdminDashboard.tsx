import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Download, Eye } from 'lucide-react';

type SubmissionStatus = 'new' | 'contacted' | 'converted' | 'archived';

interface QuizSubmission {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  score: number;
  readinessLevel: string;
  answers: string;
  status: SubmissionStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function AdminDashboard() {
  const [selectedSubmission, setSelectedSubmission] = useState<QuizSubmission | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all');
  const [newStatus, setNewStatus] = useState<SubmissionStatus>('new');
  const [notes, setNotes] = useState('');

  const { data: submissions, isLoading, refetch } = trpc.quiz.list.useQuery({
    limit: 1000,
    offset: 0,
  });

  const updateStatusMutation = trpc.quiz.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      setNotes('');
    },
  });

  const filteredSubmissions =
    submissions?.filter((sub) =>
      statusFilter === 'all' ? true : sub.status === statusFilter
    ) || [];

  const handleViewDetails = (submission: QuizSubmission) => {
    setSelectedSubmission(submission);
    setNewStatus(submission.status);
    setNotes(submission.notes || '');
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedSubmission) return;

    await updateStatusMutation.mutateAsync({
      id: selectedSubmission.id,
      status: newStatus,
      notes: notes || undefined,
    });
  };

  const handleExportCSV = () => {
    if (!submissions || submissions.length === 0) return;

    const headers = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Score',
      'Readiness Level',
      'Status',
      'Date',
      'Notes',
    ];

    const rows = submissions.map((sub) => [
      sub.id,
      sub.name,
      sub.email,
      sub.phone || '',
      sub.score,
      sub.readinessLevel,
      sub.status,
      new Date(sub.createdAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZoneName: 'short',
      }),
      sub.notes || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'converted':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReadinessColor = (level: string) => {
    switch (level) {
      case 'Highly Ready':
        return 'bg-green-100 text-green-800';
      case 'Ready':
        return 'bg-blue-100 text-blue-800';
      case 'Developing':
        return 'bg-yellow-100 text-yellow-800';
      case 'Not Ready':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: submissions?.length || 0,
    new: submissions?.filter((s) => s.status === 'new').length || 0,
    contacted: submissions?.filter((s) => s.status === 'contacted').length || 0,
    converted: submissions?.filter((s) => s.status === 'converted').length || 0,
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Quiz Submissions Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and track all funding readiness quiz submissions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Total</div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">New</div>
            <div className="text-3xl font-bold text-blue-600">{stats.new}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Contacted</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.contacted}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Converted</div>
            <div className="text-3xl font-bold text-green-600">{stats.converted}</div>
          </Card>
        </div>

        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>{submission.name}</TableCell>
                      <TableCell>{submission.email}</TableCell>
                      <TableCell>{submission.score}%</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(submission.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                          timeZoneName: 'short',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => handleViewDetails(submission)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}