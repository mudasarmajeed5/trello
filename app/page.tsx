import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import Link from "next/link";
import { ClipboardList, Users, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
      <Navbar />

      <main className="container mx-auto px-4 py-20">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              Organize work. Ship fast.
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              A lightweight Trello-style project board to manage tasks,
              collaborate with teammates, and stay focused on what matters.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Link href="/pricing" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">Get started</Button>
              </Link>
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">
                  View demo
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-6 w-6 text-blue-600" />
                  <CardTitle>Boards & Lists</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create flexible boards to plan projects, visualize progress,
                  and keep tasks organized.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-purple-600" />
                  <CardTitle>Real-time collaboration</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Invite teammates, assign tasks, and discuss work in context.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Zap className="h-6 w-6 text-green-600" />
                  <CardTitle>Integrations</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Connect with popular tools and automate repetitive tasks.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-3">
            Simple pricing, no surprises
          </h2>
          <p className="text-gray-600 mb-6">
            Try all features free for 14 days.
          </p>
          <Link href="/pricing">
            <Button>See pricing</Button>
          </Link>
        </section>
      </main>

      <footer className="border-t bg-white/60">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
          Built with ❤️ — demo app for learning Next.js
        </div>
      </footer>
    </div>
  );
}
