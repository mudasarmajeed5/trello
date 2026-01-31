import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { useBoardId } from "@/lib/hooks/use-board-id";
import { useInvite } from "@/lib/hooks/use-invite";
import { CopyIcon, UserIcon } from "lucide-react";
import { useState } from "react";

const InviteModal = () => {
  const currentBoardId = useBoardId();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const { generateInviteId, error } = useInvite();
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await generateInviteId(currentBoardId);
      setInviteCode(data?.invite_code ?? null);
    } catch (error) {
      console.log(error);
    }
  };
  const handleCopyURL = () => {
    if (!inviteCode) return;
    try {
      const url = `http://localhost:3000/invite?code=${inviteCode}&boardId=${currentBoardId}`;
      navigator.clipboard.writeText(url);
      toast("Link Copied to clipboard", { position: "bottom-right" });
    } catch (error) {
      toast("Clipboard Permission Error, Copy manually", {
        position: "bottom-right",
      });
    }
  };
  return (
    <>
      <Button variant={"outline"} onClick={() => setIsInviteModalOpen(true)}>
        <UserIcon />
        <span>Invite</span>
      </Button>
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate an Invite:</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Share this URL (one-time-only) per user, if you want to add more
            users to board, generate more URLs
          </DialogDescription>
          <form onSubmit={handleGenerateInvite} className="space-y-2">
            {inviteCode && (
              <div className="flex items-center justify-between pb-2 flex-col sm:flex-row space-x-2">
                <span className="text-xs text-blue-900 underline underline-offset-2">{`http://localhost:3000/invite?code=${inviteCode}&boardId=${currentBoardId}`}</span>
                <Button
                  type="button"
                  variant={"secondary"}
                  onClick={handleCopyURL}
                >
                  <CopyIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            )}
            {error && <span className="text-red-600">{error}</span>}
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => setIsInviteModalOpen(false)}
                type="button"
                variant={"outline"}
              >
                Cancel
              </Button>
              <Button type="submit">Generate</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InviteModal;
