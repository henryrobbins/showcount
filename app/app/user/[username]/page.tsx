import { clerkClient } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';

interface UserProfilePageProps {
  params: Promise<{ username: string }>;
}

async function UserProfilePage({ params }: UserProfilePageProps) {
  const { username } = await params;

  // Fetch user by username from Clerk
  const client = await clerkClient();
  const users = await client.users.getUserList({ username: [username] });

  if (users.data.length === 0) {
    notFound();
  }

  const user = users.data[0];
  const displayName = user.username || 'User';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white text-black">
      <div className="flex flex-col items-center gap-4 border-4 border-black px-16 py-12">
        <h1 className="text-6xl font-bold tracking-wider">SHOWCOUNT</h1>
        <div className="mt-4 border-t-2 border-black pt-4">
          <p className="font-mono text-xl tracking-wide">
            <span className="font-bold">{displayName}</span>
          </p>
        </div>
      </div>
    </main>
  );
}

export default UserProfilePage;
