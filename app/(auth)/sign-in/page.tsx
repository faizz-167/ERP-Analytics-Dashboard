"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { MonitorCheck } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg border border-slate-100">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-blue-100 p-3">
            <MonitorCheck className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Teacher ERP Portal
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Secure access for Faculty & Administrators. <br />
            Please sign in with your institutional Google account.
          </p>
        </div>

        {/* Google Sign In Button */}
        <Button
          size="lg"
          className="w-full font-semibold bg-primary-admin"
          onClick={() => signIn("google", { callbackUrl: "/" })}
        >
          Sign In with Google
        </Button>
      </div>
    </div>
  );
}
