
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-2xl font-bold mb-4">Unauthorized Access</h1>
      <p className="text-gray-600 mb-8">You do not have permission to view this page.</p>
      <Link href="/" className="flex items-center text-primary hover:underline">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Return to Dashboard
      </Link>
    </div>
  );
}
