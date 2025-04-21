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
        <h1 className="font-zen leading-tight text-8xl antialiased">
          showcount.com
        </h1>
        <p className="font-mono text-1xl font-light">
          Concert tracking. Coming soon.
          <br />
          <Link to="/list/love-music-will-travel" className="underline hover">
            @love-music-will-travel
          </Link>
          <br />
        </p>
      </div>
    </div>
  );
}
