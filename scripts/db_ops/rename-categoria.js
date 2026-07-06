/**
 * Script per renombrar una categoria a totes les normes (grups i/o alumnes).
 *
 * Ús:
 *   node rename-categoria.js --from <categoria_vella> --to <categoria_nova> [opcions]
 *
 * Opcions:
 *   --from <cat>       Categoria actual a canviar (obligatori)
 *   --to <cat>         Nom nou de la categoria (obligatori)
 *   --scope <àmbit>    Àmbit: "grup", "alumne" o "all" (defecte: "all")
 *   --dry-run          Mostra què es canviaria sense aplicar canvis
 *   -h, --help         Mostra aquesta ajuda
 *
 * Exemples:
 *   node rename-categoria.js --from ai --to ia
 *   node rename-categoria.js --from ai --to ia --scope grup
 *   node rename-categoria.js --from ai --to ia --dry-run
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL no està definit al fitxer .env');
    process.exit(1);
}

// ---------------------------------------------------------------------------
// Parseig d'arguments
// ---------------------------------------------------------------------------

function parseArgs() {
    const args = process.argv.slice(2);
    const opts = {
        from: null,
        to: null,
        scope: 'all',
        dryRun: false,
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--from':
                opts.from = args[++i];
                break;
            case '--to':
                opts.to = args[++i];
                break;
            case '--scope':
                opts.scope = args[++i];
                break;
            case '--dry-run':
                opts.dryRun = true;
                break;
            case '--help':
            case '-h':
                printHelp();
                process.exit(0);
            default:
                console.error(`❌ Argument desconegut: ${args[i]}`);
                printHelp();
                process.exit(1);
        }
    }

    return opts;
}

function printHelp() {
    console.log(`
Ús: node rename-categoria.js --from <categoria_vella> --to <categoria_nova> [opcions]

Opcions:
  --from <cat>     Categoria actual a canviar (obligatori)
  --to <cat>       Nom nou de la categoria (obligatori)
  --scope <àmbit>  Àmbit: "grup", "alumne" o "all" (defecte: "all")
  --dry-run        Mostra què es canviaria sense aplicar canvis
  -h, --help       Mostra aquesta ajuda
`);
}

// ---------------------------------------------------------------------------
// Funció principal
// ---------------------------------------------------------------------------

async function main() {
    const opts = parseArgs();

    if (!opts.from || !opts.to) {
        console.error('❌ Cal especificar --from i --to.');
        printHelp();
        process.exit(1);
    }

    if (!['grup', 'alumne', 'all'].includes(opts.scope)) {
        console.error(`❌ --scope ha de ser "grup", "alumne" o "all". Valor rebut: "${opts.scope}"`);
        process.exit(1);
    }

    const fromCat = opts.from.trim().toLowerCase();
    const toCat = opts.to.trim().toLowerCase();

    console.log('🔌 Connectant a MongoDB...');
    await mongoose.connect(DATABASE_URL);
    const db = mongoose.connection.db;
    console.log('✅ Connexió establerta.\n');

    console.log(`🔍 Renombrant categoria: "${fromCat}" → "${toCat}"`);
    console.log(`📦 Àmbit: ${opts.scope}`);
    if (opts.dryRun) console.log('🔍 Mode: --dry-run (sense canvis reals)');
    console.log('');

    let totalNormesTrobades = 0;
    let totalNormesModificades = 0;
    let totalEntitatsTrobades = 0;
    let totalEntitatsModificades = 0;

    // -----------------------------------------------------------------------
    // Processar grups
    // -----------------------------------------------------------------------
    if (opts.scope === 'grup' || opts.scope === 'all') {
        const grups = await db.collection('grups').find({
            normes2Web: { $elemMatch: { categories: fromCat } }
        }).toArray();

        if (grups.length === 0) {
            console.log('📭 Cap grup té normes amb la categoria "' + fromCat + '".');
        } else {
            console.log(`📋 Grups amb normes que contenen "${fromCat}": ${grups.length}`);
        }

        for (const grup of grups) {
            const normes = grup.normes2Web || [];
            const normesAfectades = normes.filter((n) =>
                (n.categories || []).some((c) => c.toLowerCase() === fromCat)
            );

            totalNormesTrobades += normesAfectades.length;
            totalEntitatsTrobades++;

            if (opts.dryRun) {
                console.log(`\n📁 ${grup.grupId} (${grup.nom || 'sense nom'}) — ${normesAfectades.length} normes:`);
                for (const norma of normesAfectades) {
                    const firstLine = (norma.lines && norma.lines.length > 0)
                        ? `${norma.lines[0].host || '?'}${norma.lines[0].pathname || ''}`
                        : 'sense lines';
                    console.log(`   · ${firstLine} → [${norma.categories.map((c) => c.toLowerCase() === fromCat ? `${c}👉${toCat}` : c).join(', ')}]`);
                }
            } else {
                // Aplicar el canvi: actualitzar l'element dins de l'array categories
                await db.collection('grups').updateMany(
                    {
                        grupId: grup.grupId,
                        'normes2Web.categories': fromCat,
                    },
                    {
                        $set: {
                            'normes2Web.$[].categories.$[elem]': toCat,
                        },
                    },
                    {
                        arrayFilters: [
                            { 'elem': { $regex: new RegExp(`^${escapeRegex(fromCat)}$`, 'i') } },
                        ],
                    }
                );
                totalNormesModificades += normesAfectades.length;
                totalEntitatsModificades++;
            }
        }

        if (!opts.dryRun && grups.length > 0) {
            console.log(`\n✅ Grups actualitzats: ${grups.length}`);
        }
    }

    // -----------------------------------------------------------------------
    // Processar alumnes
    // -----------------------------------------------------------------------
    if (opts.scope === 'alumne' || opts.scope === 'all') {
        const alumnes = await db.collection('alumnes').find({
            normes2Web: { $elemMatch: { categories: fromCat } }
        }).toArray();

        if (alumnes.length === 0) {
            console.log('\n📭 Cap alumne té normes amb la categoria "' + fromCat + '".');
        } else {
            console.log(`\n📋 Alumnes amb normes que contenen "${fromCat}": ${alumnes.length}`);
        }

        for (const alumne of alumnes) {
            const normes = alumne.normes2Web || [];
            const normesAfectades = normes.filter((n) =>
                (n.categories || []).some((c) => c.toLowerCase() === fromCat)
            );

            totalNormesTrobades += normesAfectades.length;
            totalEntitatsTrobades++;

            if (opts.dryRun) {
                console.log(`\n📁 ${alumne.alumneId} (${alumne.nom || alumne.cognoms || 'sense nom'}) — ${normesAfectades.length} normes:`);
                for (const norma of normesAfectades) {
                    const firstLine = (norma.lines && norma.lines.length > 0)
                        ? `${norma.lines[0].host || '?'}${norma.lines[0].pathname || ''}`
                        : 'sense lines';
                    console.log(`   · ${firstLine} → [${norma.categories.map((c) => c.toLowerCase() === fromCat ? `${c}👉${toCat}` : c).join(', ')}]`);
                }
            } else {
                await db.collection('alumnes').updateMany(
                    {
                        alumneId: alumne.alumneId,
                        'normes2Web.categories': fromCat,
                    },
                    {
                        $set: {
                            'normes2Web.$[].categories.$[elem]': toCat,
                        },
                    },
                    {
                        arrayFilters: [
                            { 'elem': { $regex: new RegExp(`^${escapeRegex(fromCat)}$`, 'i') } },
                        ],
                    }
                );
                totalNormesModificades += normesAfectades.length;
                totalEntitatsModificades++;
            }
        }

        if (!opts.dryRun && alumnes.length > 0) {
            console.log(`\n✅ Alumnes actualitzats: ${alumnes.length}`);
        }
    }

    // -----------------------------------------------------------------------
    // Resum final
    // -----------------------------------------------------------------------
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('📊 RESUM:');
    console.log(`   Categoria: "${fromCat}" → "${toCat}"`);
    console.log(`   Entitats trobades: ${totalEntitatsTrobades}`);
    if (!opts.dryRun) console.log(`   Entitats modificades: ${totalEntitatsModificades}`);
    console.log(`   Normes afectades: ${totalNormesTrobades}`);
    if (!opts.dryRun) console.log(`   Normes actualitzades: ${totalNormesModificades}`);
    if (opts.dryRun) console.log('   ⚠️  DRY-RUN: no s\'ha aplicat cap canvi real.');
    console.log('═══════════════════════════════════════════');

    await mongoose.disconnect();
    console.log('👋 Desconnectat.');
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
