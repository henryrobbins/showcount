import { Card } from "@heroui/react";
import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex text-center flex-col items-center gap-5">
        <h1 className="font-title leading-tight tracking-tighter antialiased text-center text-[clamp(3.5rem,10vw,5.5rem)]">
          SHOWCOUNT
        </h1>
        <p className="font-mono text-[clamp(0.875rem, 2.5vw, 1.25rem)]">
          Concert tracking.
          <br />
          Coming soon.
        </p>
        <p className="font-mono text-[clamp(0.875rem, 2.5vw, 1.25rem)]">
          <Link to="/list/love-music-will-travel" className="underline hover">
            @love-music-will-travel
          </Link>
        </p>
      </div>
    </div>
  );
}
