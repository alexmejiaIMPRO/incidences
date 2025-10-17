import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"

export default async function HomePage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  // Redirect to role-specific dashboard
  switch (session.role) {
    case "EMPLOYEE":
      redirect("/employee/dashboard")
    case "SUPERVISOR":
      redirect("/supervisor/dashboard")
    case "MANAGER":
      redirect("/manager/dashboard")
    case "HR":
      redirect("/hr/dashboard")
    case "PAYROLL":
      redirect("/payroll/dashboard")
    default:
      redirect("/login")
  }
}
