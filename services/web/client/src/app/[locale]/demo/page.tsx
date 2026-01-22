"use client";

import AppLayout from "@/components/layout/AppLayout";
import { useAppSelector } from "@/store/hooks";
import { selectContextMode } from "@/store/slices/environmentSlice";

export default function DemoPage() {
  const contextMode = useAppSelector(selectContextMode);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Sidebar Demo Page</h1>
          <p className="text-muted-foreground">This page demonstrates the Redux-powered sidebar navigation system.</p>
        </div>

        <div className="bg-card p-6 rounded-xl border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Current Context Mode</h2>
          <p className="text-lg">
            You are currently in{" "}
            <span className={contextMode === "gm" ? "text-amber-600 font-bold" : "text-blue-600 font-bold"}>
              {contextMode === "gm" ? "Game Master" : "Player"}
            </span>{" "}
            mode.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Use the toggle button in the navbar to switch between modes and see the sidebar navigation change.
          </p>
        </div>

        <div className="bg-card p-6 rounded-xl border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Features</h2>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Context-aware navigation (Player vs GM mode)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Redux state management with TypeScript</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Collapsible sidebar (desktop)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Mobile-responsive with overlay menu</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Full keyboard navigation support</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>ARIA attributes for accessibility</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>i18n support (EN, FR, ES)</span>
            </li>
          </ul>
        </div>

        <div className="bg-card p-6 rounded-xl border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Try It Out</h2>
          <div className="space-y-3">
            <p>
              <strong>Desktop:</strong> Click the chevron button on the sidebar to collapse/expand it.
            </p>
            <p>
              <strong>Mobile:</strong> Click the hamburger menu in the navbar to open the sidebar.
            </p>
            <p>
              <strong>Context Toggle:</strong> Click the Player/GM button in the navbar to switch contexts.
            </p>
            <p>
              <strong>Keyboard:</strong> Press <kbd className="px-2 py-1 bg-muted rounded text-sm">Tab</kbd> to
              navigate, <kbd className="px-2 py-1 bg-muted rounded text-sm">Escape</kbd> to close menus.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
