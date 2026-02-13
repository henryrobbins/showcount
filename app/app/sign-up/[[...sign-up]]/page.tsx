import { SignUp } from '@clerk/nextjs';

function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white">
      <SignUp />
    </main>
  );
}

export default SignUpPage;
