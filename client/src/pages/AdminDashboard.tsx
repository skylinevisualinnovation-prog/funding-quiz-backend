import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Eye, Trash2 } from "lucide-react";

type SubmissionStatus = "new" | "contacted" | "converted" | "archived";

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
  createdAt: string;
  updatedAt: string;
}

/* ======================================
   SAFE DATE FORMATTER
====================================== */
const formatDateTime = (dateString?: string | null) => {
  if (!dateString) return "—";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
};

export default function AdminDashboard() {
  const [selectedSubmission, setSelectedSubmission] =
    useState<QuizSubmission | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<SubmissionStatus>("new");
  const [notes, setNotes] = useState("");

  const { data: submissions, isLoading, refetch } =
    trpc.quiz.list.useQuery({
      limit: 1000,
      offset: 0,
    });

  const updateStatusMutation = trpc.quiz.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      setNotes("");
    },
  });

  // 🔥 NEW DELETE MUTATION
  const deleteMutation = trpc.quiz.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleViewDetails = (submission: QuizSubmission) => {
    setSelectedSubmission(submission);
    setNewStatus(submission.status);
    setNotes(submission.notes || "");
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

  // 🔥 DELETE HANDLER
  const handleDelete = async (id: number) => {
    const confirmed = confirm(
      "Are you sure you want to permanently delete this submission?"
    );
    if (!confirmed) return;

    await deleteMutation.mutateAsync({ id });
  };

  const getStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "contacted":
        return "bg-yellow-100 text-yellow-800";
      case "converted":
        return "bg-green-100 text-green-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          Quiz Submissions Dashboard
        </h1>

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
                    <TableHead>Date (ET)</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {submissions?.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>{submission.name}</TableCell>
                      <TableCell>{submission.email}</TableCell>
                      <TableCell>{submission.score}%</TableCell>

                      <TableCell>
                        <Badge
                          className={getStatusColor(submission.status)}
                        >
                          {submission.status}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {formatDateTime(submission.createdAt)}
                      </TableCell>

                      {/* 🔥 ACTION COLUMN UPDATED */}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleViewDetails(submission)
                            }
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleDelete(submission.id)
                            }
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* DIALOG */}
        <Dialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Submission Details
              </DialogTitle>
            </DialogHeader>

            {selectedSubmission && (
              <div className="space-y-4">
                <div>
                  <strong>Name:</strong>{" "}
                  {selectedSubmission.name}
                </div>

                <div>
                  <strong>Email:</strong>{" "}
                  {selectedSubmission.email}
                </div>

                <div>
                  <strong>Score:</strong>{" "}
                  {selectedSubmission.score}%
                </div>

                <div>
                  <strong>Date Submitted:</strong>{" "}
                  {formatDateTime(
                    selectedSubmission.createdAt
                  )}
                </div>

                <Select
                  value={newStatus}
                  onValueChange={(value: SubmissionStatus) =>
                    setNewStatus(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">
                      Contacted
                    </SelectItem>
                    <SelectItem value="converted">
                      Converted
                    </SelectItem>
                    <SelectItem value="archived">
                      Archived
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Textarea
                  placeholder="Add notes..."
                  value={notes}
                  onChange={(e) =>
                    setNotes(e.target.value)
                  }
                />

                <Button onClick={handleUpdateStatus}>
                  Update
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}