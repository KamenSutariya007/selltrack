import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AppLayout } from "@/components/app-layout";
import { getAuthorizedUser } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (!session.user.emailVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(session.user.email || "")}`);
  }

  const user = await getAuthorizedUser();
  if (!user) redirect("/unauthorized");

  return <AppLayout>{children}</AppLayout>;
}
