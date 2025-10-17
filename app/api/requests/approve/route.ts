import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import {
  getAbsenceRequestById,
  updateRequestStatus,
  addApprovalHistory,
  createNotification,
  getDatabase,
  type ApprovalStage,
} from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { request_id, action, comments, stage } = await request.json()

    if (!request_id || !action || !stage) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify user has permission for this stage
    const stageRoleMap: Record<string, string[]> = {
      SUPERVISOR: ["SUPERVISOR"],
      MANAGER: ["MANAGER"],
      HR: ["HR"],
    }

    if (!stageRoleMap[stage]?.includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized for this approval stage" }, { status: 403 })
    }

    const absenceRequest = getAbsenceRequestById(request_id)

    if (!absenceRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // Add approval history
    addApprovalHistory({
      request_id,
      approver_id: session.id,
      approval_stage: stage as ApprovalStage,
      action,
      comments,
    })

    if (action === "DECLINED") {
      // If declined, update status and notify employee
      updateRequestStatus(request_id, "DECLINED", "COMPLETED")

      createNotification({
        user_id: absenceRequest.employee_id,
        request_id,
        message: `Your absence request has been declined by ${session.name}`,
      })
    } else {
      // If approved, move to next stage
      const nextStageMap: Record<string, ApprovalStage> = {
        SUPERVISOR: "MANAGER",
        MANAGER: "HR",
        HR: "PAYROLL",
      }

      const nextStage = nextStageMap[stage]

      if (nextStage === "PAYROLL") {
        // Final approval - mark as approved and notify payroll
        updateRequestStatus(request_id, "APPROVED", "COMPLETED")

        // Notify employee
        createNotification({
          user_id: absenceRequest.employee_id,
          request_id,
          message: `Your absence request has been fully approved!`,
        })

        // Notify payroll users
        const db = getDatabase()
        const payrollUsers = db.prepare("SELECT id FROM users WHERE role = 'PAYROLL'").all() as { id: number }[]

        payrollUsers.forEach((user) => {
          createNotification({
            user_id: user.id,
            request_id,
            message: `New approved absence request requires payroll processing`,
          })
        })
      } else {
        // Move to next approval stage
        updateRequestStatus(request_id, "PENDING", nextStage)

        // Notify next approver
        const db = getDatabase()
        const nextApprovers = db
          .prepare(`SELECT id FROM users WHERE role = ?`)
          .all(nextStage === "MANAGER" ? "MANAGER" : "HR") as { id: number }[]

        nextApprovers.forEach((user) => {
          createNotification({
            user_id: user.id,
            request_id,
            message: `New absence request requires your approval`,
          })
        })
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] Approve request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
