import { Toaster } from "@/components/ui/sonner";

/**
 * App-wide toast host. Sonner renders its own portal, so this can be mounted
 * once in the root layout.
 */
export function AppToaster() {
  return <Toaster position="top-right" closeButton richColors />;
}
