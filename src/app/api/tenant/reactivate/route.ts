/**
 * API: /api/tenant/reactivate
 * Sprint OF: IMPL-CHURN-06 - Tenant Reaktivierung
 * 
 * POST: Vertrag reaktivieren
 * - Nur möglich wenn status = "cancelled" oder "grace_period"
 * - Setzt status zurück auf "active"
 * - Löscht alle Kündigungsdaten
 * 
 * Nur für Admins. Bei archived/deleted ist keine Reaktivierung möglich.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, isAdmin } from "@/lib/auth-helpers";

// Tenant-ID aus Config (für Single-Tenant Setup)
const TENANT_ID = process.env.TENANT_ID || "koch-aufforstung";

// Erlaubte Status für Reaktivierung
const REACTIVATABLE_STATUSES = ["cancelled", "grace_period"];

interface ReactivateRequest {
  reason?: string; // Optionaler Grund für Reaktivierung
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    // Nur Admins können reaktivieren
    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({})) as ReactivateRequest;

    // Prüfe aktuellen Tenant-Status
    const tenant = await prisma.tenant.findUnique({
      where: { slug: TENANT_ID },
      select: { 
        id: true, 
        status: true, 
        name: true,
        contractEndDate: true,
        graceEndDate: true,
        cancelledAt: true,
        archivedAt: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant nicht gefunden" }, { status: 404 });
    }

    // Prüfe ob Reaktivierung möglich ist
    if (!REACTIVATABLE_STATUSES.includes(tenant.status)) {
      let errorMessage = `Reaktivierung nicht möglich. Aktueller Status: ${tenant.status}`;
      
      if (tenant.status === "active") {
        errorMessage = "Vertrag ist bereits aktiv";
      } else if (tenant.status === "archived") {
        errorMessage = "Vertrag wurde archiviert. Bitte kontaktieren Sie den Support für eine Neuerstellung.";
      } else if (tenant.status === "deleted") {
        errorMessage = "Tenant wurde gelöscht. Keine Reaktivierung möglich.";
      }

      return NextResponse.json({ 
        error: errorMessage,
        currentStatus: tenant.status,
        hint: tenant.status === "archived" 
          ? "Nach Archivierung sind GPS-Daten gelöscht. Nur steuerrelevante Daten können wiederhergestellt werden."
          : undefined,
      }, { status: 409 });
    }

    // Bei Grace Period: Prüfe ob noch Zeit ist
    if (tenant.status === "grace_period" && tenant.graceEndDate) {
      const daysLeft = Math.ceil((tenant.graceEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 0) {
        return NextResponse.json({ 
          error: "Grace Period abgelaufen. Bitte kontaktieren Sie den Support.",
          graceEndDate: tenant.graceEndDate,
        }, { status: 409 });
      }
    }

    // Reaktivierung durchführen
    const updatedTenant = await prisma.tenant.update({
      where: { slug: TENANT_ID },
      data: {
        status: "active",
        contractEndDate: null,
        graceEndDate: null,
        cancelledAt: null,
        cancelledBy: null,
        cancellationNote: null,
        // Notification-Tracking zurücksetzen
        lastChurnNotifyAt: null,
        lastChurnNotifyDays: null,
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    // Aktivität loggen
    await prisma.activityLog.create({
      data: {
        action: "TENANT_REACTIVATED",
        entityType: "tenant",
        entityId: tenant.id,
        entityName: tenant.name,
        userId: user.id,
        metadata: JSON.stringify({
          previousStatus: tenant.status,
          previousContractEndDate: tenant.contractEndDate?.toISOString(),
          previousGraceEndDate: tenant.graceEndDate?.toISOString(),
          reason: body.reason,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Vertrag erfolgreich reaktiviert",
      tenant: updatedTenant,
      details: {
        previousStatus: tenant.status,
        reactivatedAt: new Date().toISOString(),
        reactivatedBy: user.id,
      },
      nextSteps: [
        "Voller Zugriff auf alle Funktionen wiederhergestellt",
        "Alle Daten wurden beibehalten",
        "Kündigungsfelder wurden zurückgesetzt",
      ],
    });

  } catch (error) {
    console.error("Reaktivierung-Fehler:", error);
    return NextResponse.json({ error: "Server-Fehler" }, { status: 500 });
  }
}

// GET: Prüfen ob Reaktivierung möglich ist
export async function GET(req: NextRequest) {
  try {
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: TENANT_ID },
      select: {
        id: true,
        name: true,
        status: true,
        contractEndDate: true,
        graceEndDate: true,
        cancelledAt: true,
        archivedAt: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant nicht gefunden" }, { status: 404 });
    }

    const canReactivate = REACTIVATABLE_STATUSES.includes(tenant.status);
    
    let reason = "";
    let daysLeft: number | null = null;

    if (!canReactivate) {
      if (tenant.status === "active") {
        reason = "Vertrag ist bereits aktiv";
      } else if (tenant.status === "archived") {
        reason = "Vertrag wurde archiviert - nur Neueinrichtung möglich";
      } else if (tenant.status === "deleted") {
        reason = "Tenant wurde gelöscht";
      }
    } else {
      if (tenant.status === "cancelled" && tenant.contractEndDate) {
        daysLeft = Math.ceil((tenant.contractEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        reason = `Kündigung eingereicht - noch ${daysLeft} Tage aktiver Zugriff`;
      } else if (tenant.status === "grace_period" && tenant.graceEndDate) {
        daysLeft = Math.ceil((tenant.graceEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        reason = `In Grace Period - noch ${daysLeft} Tage Lesezugriff`;
      }
    }

    return NextResponse.json({
      canReactivate,
      currentStatus: tenant.status,
      reason,
      daysLeft,
      contractEndDate: tenant.contractEndDate,
      graceEndDate: tenant.graceEndDate,
      cancelledAt: tenant.cancelledAt,
    });

  } catch (error) {
    console.error("Reaktivierung-Check Fehler:", error);
    return NextResponse.json({ error: "Server-Fehler" }, { status: 500 });
  }
}
