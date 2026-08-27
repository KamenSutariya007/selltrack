import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4 bg-gradient-to-br from-red-50 to-slate-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 text-center space-y-4">
        <ShieldX className="h-16 w-16 text-red-600 mx-auto" />
        <h1 className="text-2xl font-bold">Unauthorized</h1>
        <p className="text-slate-600">
          You are not authorized to access this application. Registration is restricted to
          authorized email addresses only.
        </p>
        <Link href="/login">
          <Button variant="secondary" className="w-full" size="lg">
            Back to Login
          </Button>
        </Link>
      </div>
    </div>
  );
}
