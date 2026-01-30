import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BoardType } from "@/lib/supabase/models";
import Link from "next/link";
import { useState } from "react";

interface JoinedBoardProps {
  joinedBoards: BoardType[];
}
const JoinedBoards = ({ joinedBoards }: JoinedBoardProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {joinedBoards.map((board, key) => {
        return (
          <Link key={key} href={`/boards/${board.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`w-4 h-4 rounded ${board.color}`} />
                  <Badge variant={"secondary"} className="text-xs">
                    Joined
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg mb-2 group-hover:text-blue-600 transition-colors">
                  {board.title}
                </CardTitle>
                <CardDescription className="text-sm mb-4">
                  {board.description}
                </CardDescription>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 space-y-1 sm:space-y-0">
                  <span>
                    Created {new Date(board.created_at).toLocaleDateString()}
                  </span>
                  <span>
                    Updated {new Date(board.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};

export default JoinedBoards;
