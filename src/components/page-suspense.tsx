import { Suspense, ViewTransition, type ReactNode } from "react";
import { PageSkeleton } from "./skeleton";

// The skeleton slips away and the real content rises in, both on first load and on every navigation.
export function PageSuspense({ children, fallback = <PageSkeleton /> }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <Suspense
      fallback={
        <ViewTransition exit="slide-down" default="none">
          <div>{fallback}</div>
        </ViewTransition>
      }
    >
      <ViewTransition enter="slide-up" exit="fade-out" default="none">
        <div>{children}</div>
      </ViewTransition>
    </Suspense>
  );
}
