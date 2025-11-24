import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4">Welcome to Your App</h1>
      <p className="text-muted-foreground">
        Built with React, TanStack Router, and shadcn/ui
      </p>
    </div>
  );
}
