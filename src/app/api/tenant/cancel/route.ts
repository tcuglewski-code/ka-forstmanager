/**
 * API: /api/tenant/cancel
 * Sprint OF: IMPL-CHURN-06 - Tenant Kündigung
 * 
 * POST: Kündigung einreichen
 * - Setzt status auf "cancelled"
 * - Speichert Kündigungsdatum und -grund
 * - Berechnet Vertragsende und Grace Period
 * 
 * Nur für Admins. Vertrag bleibt bis contractEndDate aktiv.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, isAdmin } from "@/lib/auth-helpers";

// Tenant-ID aus Config (für Single-Tenant Setup)
const TENANT_ID = process.env.TENANT_ID || "koch-aufforstung";

// Standard Grace Period in Tagen
const GRACE_PERIOD_DAYS = 30;

interface CancelRequest {
  contractEndDate: string; // ISO-Datum wann der Vertrag endet
  cancellationNote?: string; // Optionaler Kündigungsgrund
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    // Nur Admins können kündigen
    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
    }

    const body = await req.json() as CancelRequest;

    // Validierung
    if (!body.contractEndDate) {
      return NextResponse.json({ 
        error: "contractEndDate ist erforderlich (ISO-Datum)" 
      }, { status: 400 });
    }

    const contractEndDate = new Date(body.contractEndDate);
    if (isNaN(contractEndDate.getTime())) {
      return NextResponse.json({ 
        error: "Ungültiges Datumsformat für contractEndDate" 
      }, { status: 400 });
    }

    // Vertragsende muss in der Zukunft liegen
    if (contractEndDate <= new Date()) {
      return NextResponse.json({ 
        error: "Vertragsende muss in der Zukunft liegen" 
      }, { status: 400 });
    }

    // Prüfe aktuellen Tenant-Status
    const tenant = await prisma.tenant.findUnique({
      where: { slug: TENANT_ID },
      select: { id: true, status: true, name: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant nicht gefunden" }, { status: 404 });
    }

    // Nur aktive Tenants können gekündigt werden
    if (tenant.status !== "active") {
      return NextResponse.json({ 
        error: `Kündigung nicht möglich. Aktueller Status: ${tenant.status}`,
        currentStatus: tenant.status,
      }, { status: 409 });
    }

    // Grace Period berechnen (Vertragsende + 30 Tage)
    const graceEndDate = new Date(contractEndDate);
    graceEndDate.setDate(graceEndDate.getDate() + GRACE_PERIOD_DAYS);

    // Kündigung durchführen
    const updatedTenant = await prisma.tenant.update({
      where: { slug: TENANT_ID },
      data: {
        status: "cancelled",
        contractEndDate,
        graceEndDate,
        cancelledAt: new Date(),
        cancelledBy: user.id,
        cancellationNote: body.cancellationNote || null,
      },
      select: {
        id: true,
        name: true,
        status: true,
        contractEndDate: true,
        graceEndDate: true,
        cancelledAt: true,
        cancellationNote: true,
      },
    });

    // Aktivität loggen
    await prisma.activityLog.create({
      data: {
        action: "TENANT_CANCELLED",
        entityType: "tenant",
        entityId: tenant.id,
        entityName: tenant.name,
        userId: user.id,
        metadata: JSON.stringify({
          contractEndDate: contractEndDate.toISOString(),
          graceEndDate: graceEndDate.toISOString(),
          reason: body.cancellationNote,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Kündigung erfolgreich eingereicht",
      tenant: updatedTenant,
      timeline: {
        cancelledAt: updatedTenant.cancelledAt,
        activeUntil: updatedTenant.contractEndDate,
        gracePeriodUntil: updatedTenant.graceEndDate,
        gracePeriodDays: GRACE_PERIOD_DAYS,
      },
      nextSteps: [
        `Voller Zugriff bis ${contractEndDate.toLocaleDateString("de-DE")}`,
        `Lesezugriff + Export bis ${graceEndDate.toLocaleDateString("de-DE")}`,
        "Danach: Archivierung steuerrelevanter Daten, Löschung GPS-Rohdaten",
      ],
    });

  } catch (error) {
    console.error("Kündigung-Fehler:", error);
    return NextResponse.json({ error: "Server-Fehler" }, { status: 500 });
  }
}

// GET: Aktuellen Kündigungsstatus abrufen
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
        cancelledBy: true,
        cancellationNote: true,
        archivedAt: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant nicht gefunden" }, { status: 404 });
    }

    // Berechne verbleibende Tage
    const now = new Date();
    let daysUntilEnd: number | null = null;
    let daysUntilGraceEnd: number | null = null;

    if (tenant.contractEndDate) {
      daysUntilEnd = Math.ceil((tenant.contractEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
    if (tenant.graceEndDate) {
      daysUntilGraceEnd = Math.ceil((tenant.graceEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    return NextResponse.json({
      tenant,
      daysUntilEnd,
      daysUntilGraceEnd,
      canReactivate: ["cancelled", "grace_period"].includes(tenant.status),
    });

  } catch (error) {
    console.error("Status-Abfrage Fehler:", error);
    return NextResponse.json({ error: "Server-Fehler" }, { status: 500 });
  }
}
