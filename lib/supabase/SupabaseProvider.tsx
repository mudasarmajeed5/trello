"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";

type SupabaseContext = {
  supabase: SupabaseClient | null;
  isLoading: boolean;
};

const Context = createContext<SupabaseContext>({
  supabase: null,
  isLoading: true,
});

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoaded } = useSession(); // Add isLoaded from Clerk
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isLoaded) return; // Wait for Clerk to load
    
    if (!session) {
      setIsLoading(false);
      return;
    }

    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      {
        accessToken: async () => (await session?.getToken()) ?? null,
      },
    );
    setSupabase(client);
    setIsLoading(false);
  }, [session, isLoaded]);

  return (
    <Context.Provider value={{ supabase, isLoading }}>
      {isLoading ? <div>Loading...</div> : children}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useSupabase needs to be inside the provider");
  }
  return context;
};