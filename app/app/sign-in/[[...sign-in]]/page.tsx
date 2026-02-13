import { SignIn } from '@clerk/nextjs';

function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white">
      <SignIn />
    </main>
  );
}

export default SignInPage;
