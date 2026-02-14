import Link from 'next/link';

interface StatsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}

async function StatsLayout({ children, params }: StatsLayoutProps) {
  const { username } = await params;

  return (
    <main className="min-h-screen bg-white text-black py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-6">
          <Link
            href={`/user/${username}`}
            className="font-mono text-sm underline hover:no-underline"
          >
            ← Back to {username}'s profile
          </Link>
        </div>
        {children}
      </div>
    </main>
  );
}

export default StatsLayout;
