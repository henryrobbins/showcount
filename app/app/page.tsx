import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white text-black">
      <div className="flex flex-col items-center gap-4 border-4 border-black px-16 py-12">
        <h1 className="text-6xl font-bold tracking-wider">SHOWCOUNT</h1>
        <p className="text-sm tracking-wide">Concert tracking. Coming soon.</p>
        <div className="mt-4 flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button
                type="button"
                className="border-2 border-black px-6 py-2 font-bold tracking-wider transition-all hover:bg-black hover:text-white"
              >
                SIGN IN
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </main>
  );
}

export default HomePage;
