# Clerk + Supabase Integration Walkthrough

This document provides a comprehensive guide on how Clerk and Supabase are integrated in this Trello Clone application, and how authentication flows enable secure data operations.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Clerk Setup](#clerk-setup)
3. [Supabase Setup](#supabase-setup)
4. [The SupabaseProvider: Bridging Clerk and Supabase](#the-supabaseprovider-bridging-clerk-and-supabase)
5. [Authentication Flow](#authentication-flow)
6. [Data Access and Modification](#data-access-and-modification)
7. [Key Components and Services](#key-components-and-services)
8. [Example: Creating a Board](#example-creating-a-board)

---

## Architecture Overview

The application uses a **three-layer architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
│  (Components, Hooks, Pages)                                 │
├─────────────────────────────────────────────────────────────┤
│                  Middleware Layer                           │
│  (ClerkProvider, SupabaseProvider)                          │
├─────────────────────────────────────────────────────────────┤
│  Authentication: Clerk    │  Database: Supabase             │
│  (User Sessions)          │  (Data Storage & RLS)           │
└─────────────────────────────────────────────────────────────┘
```

- **Clerk**: Handles user authentication, sessions, and user identity.
- **Supabase**: Provides PostgreSQL database with Row-Level Security (RLS) and real-time capabilities.
- **Middleware**: Connects the two systems using tokens and context.

---

## Clerk Setup

### What is Clerk?

Clerk is a third-party authentication provider that manages user sign-up, sign-in, and session management.

### Key Files

**`proxy.ts`** - Clerk Middleware

```typescript
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

- This middleware intercepts all incoming requests (except static files and Next.js internals).
- It attaches the current user's session to the request, making it available throughout the app.

**`app/layout.tsx`** - ClerkProvider Wrapper

```typescript
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {/* SupabaseProvider and other providers go here */}
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
```

- `ClerkProvider` wraps the entire app and provides Clerk hooks and components.
- All Clerk functionality is now available to child components.

### Clerk Hooks and Components Used

In **`components/navbar.tsx`**:

```typescript
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";

const Navbar = () => {
    const { isSignedIn, user, isLoaded } = useUser();

    return (
        <>
            {isSignedIn ? (
                <div>
                    <span>Welcome, {user.firstName ?? user.emailAddresses[0].emailAddress}</span>
                    <UserButton/>
                </div>
            ) : (
                <>
                    <SignInButton>...</SignInButton>
                    <SignUpButton>...</SignUpButton>
                </>
            )}
        </>
    );
};
```

- **`useUser()`**: Hook that returns the current user object and authentication state (`isSignedIn`, `isLoaded`).
- **`SignInButton`/`SignUpButton`**: UI components for authentication.
- **`UserButton`**: Displays user profile and sign-out button.

---

## Supabase Setup

### What is Supabase?

Supabase is an open-source Firebase alternative that provides:

- PostgreSQL database
- Row-Level Security (RLS) policies
- Real-time subscriptions
- Built-in authentication support

### Database Models

**`lib/supabase/models.ts`** - TypeScript Interfaces

```typescript
export interface BoardType {
  id: string;
  title: string;
  description: string | null;
  color: string;
  user_id: string; // Links to Clerk user
  created_at: string;
  updated_at: string;
}

export interface ColumnType {
  id: string;
  user_id: string; // Links to Clerk user
  board_id: string;
  title: string;
  sort_order: number;
  created_at: string;
}

export interface TasksType {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  assignee: string | null;
  due_date: string;
  priority: "low" | "medium" | "high";
  sort_order: number;
  created_at: string;
  updated_at: string;
}
```

**Key Insight**: Each model stores `user_id`, which matches the Clerk user's ID. This is crucial for Row-Level Security.

### Server-Side Supabase Client

**`lib/supabase/server.ts`** - For server-side operations

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {}
        },
      },
    },
  );
}
```

- Creates a server-side Supabase client that manages authentication via cookies.
- Used for API routes and server-side rendering.

---

## The SupabaseProvider: Bridging Clerk and Supabase

### Why Do We Need It?

The `SupabaseProvider` is the **critical bridge** that connects Clerk's authentication system with Supabase's database operations. Without it, Supabase wouldn't know who the current user is.

### How It Works

**`lib/supabase/SupabaseProvider.tsx`**

```typescript
"use client"
import { createContext, useContext, useEffect, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";

type SupabaseContext = {
  supabase: SupabaseClient | null;
  isLoaded: boolean;
};

const Context = createContext<SupabaseContext>({
  supabase: null,
  isLoaded: false,
});

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = useSession();  // ← Get Clerk session
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!session) return;  // ← Wait for session to load

    // Create Supabase client with Clerk's access token
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      {
        accessToken: async () => session?.getToken() ?? null,  // ← Key line!
      },
    );

    setSupabase(client);
    setIsLoaded(true);
  }, [session]);  // ← Re-run when session changes

  return (
    <Context.Provider value={{ supabase, isLoaded }}>
      {!isLoaded ? <div>Loading...</div> : children}
    </Context.Provider>
  );
}

// Custom hook to access the Supabase client
export const useSupabase = () => {
    const context = useContext(Context);
    if (context === undefined) {
        throw new Error("useSupabase needs to be inside the provider");
    }
    return context;
};
```

### What Instance Does It Create?

The `SupabaseProvider` creates a **`SupabaseClient`** instance with the following configuration:

| Property         | Value                                          | Purpose                                                  |
| ---------------- | ---------------------------------------------- | -------------------------------------------------------- |
| **URL**          | `NEXT_PUBLIC_SUPABASE_URL`                     | Supabase project endpoint                                |
| **Public Key**   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | API key for client-side requests                         |
| **Access Token** | `session?.getToken()`                          | Clerk session token (authenticates the user to Supabase) |

### Why This Works

1. **Clerk provides a session token** via `useSession()`.
2. **We pass this token to Supabase** via the `accessToken` option.
3. **Supabase trusts Clerk's token** (configured on Supabase's side).
4. **All database requests are authenticated** with the current user's identity.

---

## Authentication Flow

### Step-by-Step: User Signs In

```
1. User clicks "Sign In" button
                    ↓
2. Clerk's SignInButton UI appears
                    ↓
3. User completes authentication (email, password, OAuth, etc.)
                    ↓
4. Clerk stores session in browser cookies/storage
                    ↓
5. useSession() hook (from Clerk) detects the session
                    ↓
6. SupabaseProvider's useEffect triggers
                    ↓
7. getToken() retrieves the authenticated token from Clerk
                    ↓
8. New SupabaseClient created with this token
                    ↓
9. SupabaseProvider's context is updated
                    ↓
10. All child components can now access authenticated Supabase client
```

### Step-by-Step: User Signs Out

```
1. User clicks sign-out button (in UserButton)
                    ↓
2. Clerk clears session
                    ↓
3. useSession() detects session is gone
                    ↓
4. SupabaseProvider's useEffect runs with session === null
                    ↓
5. Supabase client is set to null
                    ↓
6. Components lose access to authenticated Supabase operations
```

---

## Data Access and Modification

### How Supabase Knows Who's Requesting Data

**Row-Level Security (RLS) in Supabase:**

On the Supabase dashboard, tables have RLS policies like:

```sql
-- Boards table RLS policy
CREATE POLICY "Users can only access their own boards"
ON boards
FOR SELECT
USING (auth.uid() = user_id);
```

This policy checks:

- `auth.uid()`: The user ID extracted from the JWT token (provided by Clerk)
- `user_id`: The owner ID stored in the database

**Only when they match can the user access the data.**

### Making Authenticated Requests

**`lib/services.ts`** - Example of an authenticated request:

```typescript
export const boardService = {
  async getBoards(
    supabase: SupabaseClient,
    userId: string,
  ): Promise<BoardType[]> {
    const { data, error } = await supabase
      .from("boards") // ← Table name
      .select("*") // ← Select all columns
      .eq("user_id", userId) // ← Filter by user (but RLS enforces this)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createBoard(
    supabase: SupabaseClient,
    board: Omit<BoardType, "id" | "created_at" | "updated_at">,
  ): Promise<BoardType> {
    const { data, error } = await supabase
      .from("boards")
      .insert(board) // ← Insert new board
      .select() // ← Return the inserted row
      .single(); // ← Expect one result

    if (error) throw error;
    return data;
  },
};
```

**Key Points:**

- `supabase` parameter is the authenticated client (from SupabaseProvider).
- All operations automatically include the user's authentication context.
- Supabase's RLS policies prevent unauthorized access.

---

## Key Components and Services

### Service Layer

**`lib/services.ts`** - Business logic for database operations:

```typescript
export const boardService = {
  getBoards,
  createBoard,
};

export const columnService = {
  createColumn,
};

export const boardDataService = {
  async createBoardWithDefaultColumns(supabase, boardData) {
    // Creates a board and its default columns in one operation
    const board = await boardService.createBoard(supabase, {...});

    const defaultColumns = [
      { title: "To do", sort_order: 0 },
      { title: "In Progress", sort_order: 1 },
      { title: "Review", sort_order: 2 },
      { title: "Done", sort_order: 3 },
    ];

    // Create all columns in parallel
    await Promise.all(
      defaultColumns.map(column =>
        columnService.createColumn(supabase, {
          ...column,
          board_id: board.id,
          user_id: boardData.userId
        })
      )
    );

    return board;
  }
};
```

### Hook Layer

**`lib/hooks/use-boards.ts`** - React hook for components:

```typescript
export function useBoards() {
  const { user } = useUser(); // ← From Clerk
  const [boards, setBoards] = useState<BoardType[]>([]);
  const { supabase } = useSupabase(); // ← From SupabaseProvider

  async function createBoard(boardData: {
    title: string;
    description?: string;
    color?: string;
  }) {
    if (!user) {
      throw new Error("User not authenticated.");
    }

    const newBoard = await boardDataService.createBoardWithDefaultColumns(
      supabase!,
      {
        ...boardData,
        userId: user?.id, // ← Clerk user ID
      },
    );

    setBoards((prev) => [newBoard, ...prev]);
  }

  return { boards, loading, error, createBoard };
}
```

**Flow:**

1. Hook gets Clerk's `user` and Supabase's authenticated `supabase` client.
2. When creating a board, it uses the Clerk `user.id` as the owner.
3. Service calls use the authenticated Supabase client.
4. Local state is updated with the result.

### Component Layer

**`app/dashboard/page.tsx`** - Uses the hook:

```typescript
"use client";
import { useBoards } from "@/lib/hooks/use-boards";
import { useUser } from "@clerk/nextjs";

const Dashboard = () => {
  const { user } = useUser();
  const { createBoard } = useBoards();

  const handleCreateBoard = async () => {
    await createBoard({
      title: "New Board"
    });
  };

  return (
    <div>
      <h1>Welcome back, {user?.firstName}! 👋</h1>
      <Button onClick={handleCreateBoard}>Create Board</Button>
    </div>
  );
};

export default Dashboard;
```

---

## Example: Creating a Board

Let's trace the entire flow when a user creates a board:

### 1. User Interaction

```
User clicks "Create Board" button
         ↓
handleCreateBoard() called
         ↓
createBoard({ title: "New Board" })
```

### 2. Hook Processing

```
useBoards() hook:
- Gets Clerk user ID: "user_clerk_12345"
- Gets authenticated Supabase client
         ↓
Calls boardDataService.createBoardWithDefaultColumns(supabase, {
  title: "New Board",
  userId: "user_clerk_12345"
})
```

### 3. Service Layer

```
boardService.createBoard(supabase, {
  title: "New Board",
  description: null,
  color: "bg-blue-500",
  user_id: "user_clerk_12345"
})
         ↓
supabase.from("boards").insert({...}).select().single()
         ↓
Supabase receives request with Clerk token in Authorization header
```

### 4. Supabase Processing

```
Supabase verifies the JWT token (from Clerk)
         ↓
Extracts auth.uid() = "user_clerk_12345"
         ↓
Checks RLS policy: auth.uid() == user_id
         ↓
✓ Policy passes! Insert is allowed
         ↓
Board is created in database
```

### 5. Default Columns

```
For each default column, createColumn() is called
         ↓
Supabase inserts columns with same user_id
         ↓
RLS policies allow insertion (user_id matches)
```

### 6. Return to Component

```
Created board data is returned
         ↓
Hook updates local state: setBoards(...)
         ↓
Component re-renders with new board displayed
```

---

## Security Model

### How Clerk + Supabase Prevents Unauthorized Access

```
┌─────────────────────────────────────────────────────────────┐
│ User A Tries to Access User B's Board                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. User A is authenticated with Clerk                       │
│    - Clerk session has auth token for User A               │
│    - Token includes User A's ID: "user_a_123"             │
│                                                             │
│ 2. User A makes Supabase query:                            │
│    supabase.from("boards").select("*")                     │
│      .eq("board_id", "board_b_456")                        │
│                                                             │
│ 3. Request includes Clerk token in Authorization header    │
│                                                             │
│ 4. Supabase extracts auth.uid() = "user_a_123"           │
│                                                             │
│ 5. RLS policy checks:                                       │
│    "auth.uid() == boards.user_id"                          │
│    "user_a_123" == "user_b_456" ?                          │
│    ✗ FALSE - Access denied!                               │
│                                                             │
│ 6. Query returns empty result                              │
│    (User A never knows board_b_456 exists)                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Environment Variables

Create a `.env.local` file:

```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
```

**Important:**

- `NEXT_PUBLIC_*` variables are exposed to the browser (safe for public keys only).
- Secret keys should never be prefixed with `NEXT_PUBLIC_`.

---

## Summary

### The Three Pillars

| Component            | Role                     | Responsibility                                                    |
| -------------------- | ------------------------ | ----------------------------------------------------------------- |
| **Clerk**            | Authentication Provider  | Manages user sign-up, sign-in, sessions, and provides JWT tokens  |
| **SupabaseProvider** | Bridge                   | Creates Supabase client with Clerk's JWT token as authentication  |
| **Supabase**         | Database + Authorization | Stores data and enforces RLS policies based on authenticated user |

### Data Flow

```
User Login → Clerk Session → SupabaseProvider (creates client with token)
                                    ↓
                            useSupabase() hook available
                                    ↓
                      Components call services with Supabase
                                    ↓
                     Supabase verifies Clerk token & checks RLS
                                    ↓
                        User can only access their own data
```

### Key Takeaways

1. **Clerk handles WHO the user is** (authentication).
2. **SupabaseProvider creates a bridge** by passing Clerk's token to Supabase.
3. **Supabase uses the token to enforce RLS** (authorization).
4. **Together, they create a secure, authenticated data system** where users can only modify their own data.

---

## Quick Reference

| File                                | Purpose                                    |
| ----------------------------------- | ------------------------------------------ |
| `proxy.ts`                          | Clerk middleware setup                     |
| `app/layout.tsx`                    | ClerkProvider + SupabaseProvider wrappers  |
| `lib/supabase/SupabaseProvider.tsx` | Creates authenticated Supabase client      |
| `lib/supabase/server.ts`            | Server-side Supabase client                |
| `lib/supabase/models.ts`            | TypeScript interfaces for database models  |
| `lib/services.ts`                   | Service layer for database operations      |
| `lib/hooks/use-boards.ts`           | React hook for board operations            |
| `components/navbar.tsx`             | Clerk UI components (sign in, user button) |
| `app/dashboard/page.tsx`            | Example component using hooks              |

---

This architecture ensures that **every data operation is authenticated, authorized, and tied to the correct user**, providing a secure and scalable foundation for your Trello clone.
