import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

async function UserPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await currentUser();
  const userName = user?.firstName || user?.username || 'User';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white text-black">
      <div className="flex flex-col items-center gap-4 border-4 border-black px-16 py-12">
        <h1 className="text-6xl font-bold tracking-wider">SHOWCOUNT</h1>
        <div className="mt-4 border-t-2 border-black pt-4">
          <p className="font-mono text-xl tracking-wide">
            Welcome, <span className="font-bold">{userName}</span>
          </p>
        </div>
      </div>
    </main>
  );
}

export default UserPage;
