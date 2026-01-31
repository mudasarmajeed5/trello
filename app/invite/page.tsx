"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { RedirectToSignIn, SignedOut } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useInvite } from "@/lib/hooks/use-invite";
import { useUser } from "@clerk/nextjs";
import {
  Loader2Icon,
  CheckCircleIcon,
  AlertCircleIcon,
  ArrowLeftIcon,
} from "lucide-react";

export default function InvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const inviteCode = searchParams.get("code");
  const boardId = searchParams.get("boardId");

  const { acceptUserInvite, loading, error } = useInvite();
  const [hasAccepted, setHasAccepted] = useState(false);

  const handleAcceptInvite = async () => {
    if (!inviteCode || !user) return;
    const success = await acceptUserInvite(inviteCode);
    if (success && boardId) {
      router.push(`/boards/${boardId}`);
    }
  };

  if (!isLoaded || !user) {
    return (
      <SignedOut>
        <RedirectToSignIn redirectUrl={window.location.href} />
      </SignedOut>
    );
  }

  return (
    <div className="min-h-screen gradient-to-br from-blue-50 via-white to-blue-50">
      <Navbar />

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <Card className="w-full max-w-md shadow-2xl border-slate-200 bg-white">
          {!hasAccepted ? (
            <>
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl font-bold text-slate-900">
                  Join Board
                </CardTitle>
                <CardDescription className="text-slate-600">
                  {inviteCode
                    ? "You've been invited to join a board"
                    : "No invite code provided"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {!inviteCode ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircleIcon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-700">
                          Invalid Invite
                        </p>
                        <p className="text-sm text-red-600 mt-1">
                          No invite code was provided. Please check the invite
                          link.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push("/dashboard")}
                      variant="outline"
                      className="w-full"
                    >
                      <ArrowLeftIcon className="w-4 h-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-slate-700">
                        <span className="font-medium text-blue-600">
                          Invite Code:
                        </span>
                        <br />
                        <code className="text-xs text-slate-600 break-all mt-2 block font-mono">
                          {inviteCode}
                        </code>
                      </p>
                    </div>

                    {error && (
                      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircleIcon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-700">
                            Error
                          </p>
                          <p className="text-sm text-red-600 mt-1">{error}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-slate-700">
                        You are joining as
                      </Label>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <p className="text-sm font-medium text-slate-900">
                          {user?.fullName ||
                            user?.primaryEmailAddress?.emailAddress}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {user?.primaryEmailAddress?.emailAddress}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <Button
                        onClick={handleAcceptInvite}
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? (
                          <>
                            <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                            Joining...
                          </>
                        ) : (
                          "Accept Invite"
                        )}
                      </Button>
                      <Button
                        onClick={() => router.push("/dashboard")}
                        variant="outline"
                        className="w-full"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-2">
                <div className="flex justify-center mb-4">
                  <CheckCircleIcon className="w-12 h-12 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900 text-center">
                  Success!
                </CardTitle>
                <CardDescription className="text-slate-600 text-center">
                  You've successfully joined the board
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    You now have access to the board and can start collaborating
                    with your team.
                  </p>
                </div>

                <Button
                  onClick={() => boardId && router.push(`/boards/${boardId}`)}
                  className="w-full"
                >
                  Go to Board
                </Button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
