import { useParams } from "next/navigation";
import { useEffect } from "react";
export function useBoardId() {
  const { id } = useParams<{ id: string }>();
  useEffect(()=>{
    if(!id) return;
  },[id])
  return id;
}
