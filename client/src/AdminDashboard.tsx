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
import { format } from 'date-fns';

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

  // Fetch submissions
  const { data: submissions, isLoading, refetch } = trpc.quiz.list.useQuery({
    limit: 1000,
    offset: 0,
  });

  // Update status mutation
  const updateStatusMutation = trpc.quiz.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      setNotes('');
    },
  });

  const filteredSubmissions = submissions?.filter((sub) => {
    if (statusFilter === 'all') return true;
    return sub.status === statusFilter;
  }) || [];

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

    const headers = ['ID', 'Name', 'Email', 'Phone', 'Score', 'Readiness Level', 'Status', 'Date', 'Notes'];
    const rows = submissions.map((sub) => [
      sub.id,
      sub.name,
      sub.email,
      sub.phone || '',
      sub.score,
      sub.readinessLevel,
      sub.status,
      format(new Date(sub.createdAt), 'yyyy-MM-dd HH:mm'),
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
    a.download = `quiz-submissions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Quiz Submissions Dashboard</h1>
          <p className="text-muted-foreground">Manage and track all funding readiness quiz submissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Total Submissions</div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">New Leads</div>
            <div className="text-3xl font-bold text-blue-600">{stats.new}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Contacted</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.contacted}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Converted</div>
            <div className="text-3xl font-bold text-green-600">{stats.converted}</div>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex gap-4 mb-6 flex-wrap items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Filter by Status:</label>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleExportCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Submissions Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No submissions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Phone</TableHead>
                    <TableHead className="font-semibold text-center">Score</TableHead>
                    <TableHead className="font-semibold">Readiness</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{submission.name}</TableCell>
                      <TableCell className="text-sm">{submission.email}</TableCell>
                      <TableCell className="text-sm">{submission.phone || '-'}</TableCell>
                      <TableCell className="text-center font-semibold">{submission.score}%</TableCell>
                      <TableCell>
                        <Badge className={getReadinessColor(submission.readinessLevel)}>
                          {submission.readinessLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(submission.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(submission)}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
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

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>View and update submission information</DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              {/* Lead Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg font-semibold">{selectedSubmission.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg">{selectedSubmission.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-lg">{selectedSubmission.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date Submitted</label>
                  <p className="text-lg">{format(new Date(selectedSubmission.createdAt), 'PPP p')}</p>
                </div>
              </div>

              {/* Quiz Results */}
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-4">Quiz Results</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Funding Readiness Score</label>
                    <p className="text-3xl font-bold text-primary">{selectedSubmission.score}%</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Readiness Level</label>
                    <p className="text-lg mt-2">
                      <Badge className={getReadinessColor(selectedSubmission.readinessLevel)}>
                        {selectedSubmission.readinessLevel}
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Update */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Update Status</label>
                  <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Notes</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this lead..."
                    className="min-h-24"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateStatus}
                  disabled={updateStatusMutation.isPending}
                  className="gap-2"
                >
                  {updateStatusMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
