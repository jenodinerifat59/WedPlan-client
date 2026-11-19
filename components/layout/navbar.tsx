"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gem,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  UserRound,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Browse Services" },
] as const;

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
};

function initials(name?: string | null) {
  if (!name) return "WP";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function NavLink({
  href,
  label,
  className,
  onNavigate,
}: {
  href: string;
  label: string;
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active =
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
        active && "text-foreground",
        className,
      )}
    >
      {label}
      <span
        aria-hidden
        className={cn(
          "absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-primary transition-transform",
          active && "scale-x-100",
        )}
      />
    </Link>
  );
}

function UserMenu({
  user,
  onSignOut,
}: {
  user: SessionUser;
  onSignOut: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Open profile menu"
      >
        <Avatar>
          {user.image ? <AvatarImage src={user.image} alt="" /> : null}
          <AvatarFallback className="bg-primary/10 text-primary">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
          {user.name ?? "Account"}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="px-2 py-2">
          <span className="block truncate text-sm font-medium text-foreground">
            {user.name ?? "WedPlan member"}
          </span>
          <span className="block truncate text-xs font-normal">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/dashboard" />}>
          <LayoutDashboard />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/dashboard/profile" />}>
          <Settings />
          Profile Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onSignOut}>
          <LogOut />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Navbar() {
  const { user, isLoading, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
            <Gem className="size-4" aria-hidden />
          </span>
          <span className="font-heading text-2xl leading-none font-semibold tracking-tight">
            WedPlan
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {navigation.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isLoading ? (
            <div className="h-8 w-28 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <UserMenu user={user} onSignOut={handleSignOut} />
          ) : (
            <>
              <Button
                variant="ghost"
                render={<Link href="/sign-in" />}
                className="h-9 px-4"
              >
                Sign In
              </Button>
              <Button
                render={<Link href="/sign-up" />}
                className="h-9 px-4 shadow-sm"
              >
                Sign Up
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <Link
            href="/services"
            aria-label="Browse services"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <Search />
          </Link>
          <Sheet>
            <SheetTrigger
              className={buttonVariants({ variant: "ghost", size: "icon" })}
              aria-label="Open menu"
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader className="border-b pb-4">
                <SheetTitle className="font-heading text-2xl">
                  WedPlan
                </SheetTitle>
              </SheetHeader>

              <nav className="flex flex-col gap-1 px-2" aria-label="Mobile">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto flex flex-col gap-2 border-t p-4">
                {user ? (
                  <>
                    <div className="mb-2 flex items-center gap-3">
                      <Avatar size="lg">
                        {user.image ? (
                          <AvatarImage src={user.image} alt="" />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {initials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {user.name ?? "Account"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      render={<Link href="/dashboard" />}
                    >
                      <LayoutDashboard />
                      Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      render={<Link href="/dashboard/profile" />}
                    >
                      <UserRound />
                      Profile Settings
                    </Button>
                    <Button variant="destructive" onClick={handleSignOut}>
                      <LogOut />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      render={<Link href="/sign-in" />}
                    >
                      Sign In
                    </Button>
                    <Button render={<Link href="/sign-up" />}>Sign Up</Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
