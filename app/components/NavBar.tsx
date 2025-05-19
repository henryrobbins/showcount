import { SignInButton, UserButton, SignedIn, SignedOut } from "@clerk/remix";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
        }}
      >
        <SignedIn>
          <UserButton />
        </SignedIn>

        <SignedOut>
          <SignInButton mode="modal">
            <button className="sign-in-button">Sign In</button>
          </SignInButton>
        </SignedOut>
      </div>
    </nav>
  );
}
