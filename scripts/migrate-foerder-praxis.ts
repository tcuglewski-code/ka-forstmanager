/**
 * Sprint CC: Schema-Erweiterung für foerder_praxis
 * Führt ALTER TABLE Befehle aus um fehlende Spalten zu ergänzen
 */

import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.SECOND_BRAIN_URL,
  ssl: { rejectUnauthorized: false },
})

async function migrate() {
  const client = await pool.connect()
  
  try {
    console.log("🔄 Prüfe foerder_praxis Tabelle...")
    
    // Prüfe ob Tabelle existiert
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'foerder_praxis'
      )
    `)
    
    if (!tableCheck.rows[0].exists) {
      console.log("📦 Tabelle foerder_praxis existiert nicht, erstelle neu...")
      await client.query(`
        CREATE TABLE foerder_praxis (
          id SERIAL PRIMARY KEY,
          programm_id INT REFERENCES foerderprogramme(id),
          bundesland TEXT,
          bewilligungsdauer_wochen INT,
          beantragter_betrag_eur FLOAT,
          bewilligter_betrag_eur FLOAT,
          hinweis TEXT,
          fallstricke TEXT,
          erfolgreich BOOLEAN DEFAULT true,
          antrag_datum DATE,
          bewilligung_datum DATE,
          erstellt_von TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `)
      console.log("✅ Tabelle foerder_praxis erstellt")
    } else {
      console.log("✅ Tabelle foerder_praxis existiert, ergänze fehlende Spalten...")
      
      const alterStatements = [
        "ALTER TABLE foerder_praxis ADD COLUMN IF NOT EXISTS bundesland TEXT",
        "ALTER TABLE foerder_praxis ADD COLUMN IF NOT EXISTS bewilligungsdauer_wochen INT",
        "ALTER TABLE foerder_praxis ADD COLUMN IF NOT EXISTS beantragter_betrag_eur FLOAT",
        "ALTER TABLE foerder_praxis ADD COLUMN IF NOT EXISTS bewilligter_betrag_eur FLOAT",
        "ALTER TABLE foerder_praxis ADD COLUMN IF NOT EXISTS fallstricke TEXT",
        "ALTER TABLE foerder_praxis ADD COLUMN IF NOT EXISTS erfolgreich BOOLEAN DEFAULT true",
        "ALTER TABLE foerder_praxis ADD COLUMN IF NOT EXISTS antrag_datum DATE",
        "ALTER TABLE foerder_praxis ADD COLUMN IF NOT EXISTS bewilligung_datum DATE",
        "ALTER TABLE foerder_praxis ADD COLUMN IF NOT EXISTS erstellt_von TEXT",
        "ALTER TABLE foerder_praxis ADD COLUMN IF NOT EXISTS hinweis TEXT",
        "ALTER TABLE foerder_praxis ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()",
        "ALTER TABLE foerder_praxis ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()",
      ]
      
      for (const stmt of alterStatements) {
        await client.query(stmt)
        console.log(`  ✓ ${stmt.split("ADD COLUMN IF NOT EXISTS ")[1]?.split(" ")[0] || "OK"}`)
      }
    }
    
    // Zeige finale Struktur
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'foerder_praxis'
      ORDER BY ordinal_position
    `)
    
    console.log("\n📋 Finale Tabellenstruktur foerder_praxis:")
    columns.rows.forEach((col: { column_name: string; data_type: string }) => {
      console.log(`   - ${col.column_name}: ${col.data_type}`)
    })
    
    console.log("\n✅ Migration abgeschlossen!")
    
  } catch (error) {
    console.error("❌ Migration fehlgeschlagen:", error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
