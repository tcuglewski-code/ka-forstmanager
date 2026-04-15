import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args)
    } catch (error) {
      const url = args[0] instanceof Request ? args[0].url : 'unknown'
      console.error('[API Error]', url, error)

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
        if (error.code === 'P2002') return NextResponse.json({ error: 'Bereits vorhanden' }, { status: 409 })
        if (error.code === 'P2003') return NextResponse.json({ error: 'Referenzfehler' }, { status: 400 })
      }
      if (error instanceof Prisma.PrismaClientValidationError) {
        return NextResponse.json({ error: 'Ungültige Daten' }, { status: 400 })
      }

      return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
    }
  }
}
