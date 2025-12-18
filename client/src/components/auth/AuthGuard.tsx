import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-6 p-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">Hyper Notebook</h1>
              <p className="text-muted-foreground text-lg">
                AI-powered research and content creation platform
              </p>
            </div>
            <SignInButton mode="modal">
              <Button size="lg" className="gap-2">
                <LogIn className="w-5 h-5" />
                Sign in with Google
              </Button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>
    </>
  );
}

export function UserMenu() {
  const { user } = useUser();
  
  return (
    <div className="flex items-center gap-2">
      {user && (
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {user.firstName || user.emailAddresses[0]?.emailAddress}
        </span>
      )}
      <UserButton 
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: "w-8 h-8"
          }
        }}
      />
    </div>
  );
}

export function useAuthUser() {
  const { user, isLoaded, isSignedIn } = useUser();
  
  return {
    user,
    userId: user?.id,
    isLoaded,
    isSignedIn,
    email: user?.emailAddresses[0]?.emailAddress,
    name: user?.fullName || user?.firstName,
    imageUrl: user?.imageUrl,
  };
}
