"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { useInvite } from "@/lib/hooks/use-invite";
import { useBoardId } from "@/lib/hooks/use-board-id";


const AcceptInviteModal = ({
  isInviting,
  onOpenChange,
  inviteId,
}: {
  isInviting: boolean;
  onOpenChange: (open: boolean) => void;
  inviteId: string;
}) => {
  const boardId = useBoardId();
  const { acceptUserInvite, error } = useInvite();

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    await acceptUserInvite(inviteId);
    onOpenChange(false);
    window.location.href = `/boards/${boardId}`;
  };
  return (
    <Dialog open={isInviting} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Youve Received an Invitation</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Accept the invite to join the board.
        </DialogDescription>
        <form onSubmit={handleAcceptInvite} className="space-y-2">
          {error && <span className="text-red-600">{error}</span>}
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant={"outline"}
            >
              Cancel
            </Button>
            <Button type="submit">Accept</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AcceptInviteModal;
