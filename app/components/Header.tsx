'use client';

import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';

function Header() {
  const { user } = useUser();

  return (
    <header className="w-full bg-white">
      <div className="mx-auto max-w-6xl px-4">
        <nav className="flex items-center justify-between font-mono py-4 border-b-2 border-black">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-black hover:font-bold"
            >
              Home
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <SignedIn>
              {user?.username && (
                <Link
                  href={`/user/${user.username}`}
                  className="text-black hover:font-bold"
                >
                  My Shows
                </Link>
              )}
            </SignedIn>
            <SignedOut>
              <SignInButton mode="redirect">
                <button
                  type="button"
                  className="text-black hover:font-bold"
                >
                  My Shows
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="border border-black px-4 py-1 text-black hover:bg-black hover:text-white"
                >
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;
