/**
 * Миграция через Supabase Management API
 *
 * Использование:
 *   node scripts/run-migration.mjs <SUPABASE_ACCESS_TOKEN>
 *
 * Получить access token:
 *   1. Откройте https://supabase.com/dashboard/account/tokens
 *   2. Нажмите "Generate new token"
 *   3. Скопируйте токен и передайте как аргумент
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRef = 'juufnwrqdcgfhjmngril'

const accessToken = process.argv[2]

if (!accessToken) {
    console.log('Использование: node scripts/run-migration.mjs <SUPABASE_ACCESS_TOKEN>')
    console.log('')
    console.log('Получить токен:')
    console.log('  1. Откройте https://supabase.com/dashboard/account/tokens')
    console.log('  2. Нажмите "Generate new token"')
    console.log('  3. Скопируйте и передайте как аргумент')
    process.exit(1)
}

async function runMigration() {
    console.log('=== Supabase Migration via Management API ===\n')

    const sqlPath = join(__dirname, '..', 'supabase', 'migrations', 'add_form_configs_and_cities.sql')
    const sql = readFileSync(sqlPath, 'utf8')

    console.log('Running migration SQL...')

    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ query: sql }),
    })

    if (!res.ok) {
        const text = await res.text()
        console.error(`API error (${res.status}):`, text)
        process.exit(1)
    }

    const result = await res.json()
    console.log('Migration result:', JSON.stringify(result, null, 2).substring(0, 500))

    // Verify tables
    console.log('\nVerifying...')
    const verifyRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            query: `
                SELECT 'regions' as tbl, count(*) as cnt FROM public.regions
                UNION ALL
                SELECT 'cities', count(*) FROM public.cities
                UNION ALL
                SELECT 'form_configs', count(*) FROM public.form_configs
            `
        }),
    })

    if (verifyRes.ok) {
        const verifyResult = await verifyRes.json()
        console.log('Table counts:', JSON.stringify(verifyResult, null, 2))
    }

    console.log('\n=== Migration completed! ===')
}

runMigration().catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
})
