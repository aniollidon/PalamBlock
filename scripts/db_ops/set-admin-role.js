/**
 * Script per gestionar els rols i grups permesos dels administradors.
 * Permet promocionar admins a superadmin, assignar grups i llistar l'estat actual.
 *
 * Ús:
 *   node set-admin-role.js --list                              Llista tots els admins
 *   node set-admin-role.js --user <nom> --role <rol>           Canvia el rol d'un admin
 *   node set-admin-role.js --user <nom> --grups <g1,g2,...>    Assigna grups permesos
 *   node set-admin-role.js --promote <nom>                     Drecera: promociona a superadmin
 *   node set-admin-role.js --migrate-all                       Assigna role='admin' i grupsPermesos=[] a tots
 *
 * Exemples:
 *   node set-admin-role.js --list
 *   node set-admin-role.js --promote admin
 *   node set-admin-role.js --user prof1 --role superadmin
 *   node set-admin-role.js --user prof2 --grups "1batx,2batx,FPB1"
 *   node set-admin-role.js --user prof2 --role admin --grups "1batx,FPB1"
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL no està definit al fitxer scripts/.env');
    process.exit(1);
}

// ---------------------------------------------------------------------------
// Schema mínim per accedir a la col·lecció d'admins
// ---------------------------------------------------------------------------
const AdminSchema = new mongoose.Schema({
    user: String,
    clauMd5: String,
    role: { type: String, default: 'admin' },
    grupsPermesos: { type: [String], default: [] },
}, { collection: 'admins', strict: false });

const Admin = mongoose.model('Admin', AdminSchema);

// ---------------------------------------------------------------------------
// Parseig d'arguments
// ---------------------------------------------------------------------------
function parseArgs() {
    const args = process.argv.slice(2);
    const opts = {
        list: false,
        promote: null,
        migrateAll: false,
        user: null,
        role: null,
        grups: null,
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--list':
                opts.list = true;
                break;
            case '--promote':
                opts.promote = args[++i];
                break;
            case '--migrate-all':
                opts.migrateAll = true;
                break;
            case '--user':
                opts.user = args[++i];
                break;
            case '--role':
                opts.role = args[++i];
                break;
            case '--grups':
                opts.grups = args[++i];
                break;
            case '-h':
            case '--help':
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
📋 Script de gestió de rols d'administradors de PalamBlock
═══════════════════════════════════════════════════════════

Ús:
  node set-admin-role.js [opcions]

Opcions:
  --list                   Llista tots els admins amb el seu rol i grups
  --promote <nom>          Promociona un admin a superadmin (drecera ràpida)
  --user <nom>             Admin a modificar (obligatori amb --role/--grups)
  --role <superadmin|admin>  Assigna un rol a l'admin
  --grups <g1,g2,...>      Assigna grups permesos (separats per comes)
  --migrate-all            Assigna role='admin' i grupsPermesos=[] a tots
                           els admins que no tinguin aquests camps
  -h, --help               Mostra aquesta ajuda

Exemples:
  node set-admin-role.js --list
  node set-admin-role.js --promote admin
  node set-admin-role.js --user prof1 --role superadmin
  node set-admin-role.js --user prof2 --grups "1batx,2batx,FPB1"
  node set-admin-role.js --user prof2 --role admin --grups "1batx,FPB1"
  node set-admin-role.js --migrate-all
`);
}

// ---------------------------------------------------------------------------
// Funcions principals
// ---------------------------------------------------------------------------

async function llistarAdmins() {
    const admins = await Admin.find({}).lean();

    if (admins.length === 0) {
        console.log('📭 No hi ha cap administrador a la base de dades.');
        return;
    }

    console.log(`\n📋 ${admins.length} administrador(s) trobat(s):`);
    console.log('═══════════════════════════════════════════════════════════════');

    for (const admin of admins) {
        const role = admin.role || 'admin';
        const grups = admin.grupsPermesos || [];
        const roleIcon = role === 'superadmin' ? '👑' : '👤';
        const roleText = role === 'superadmin' ? 'Superadmin' : 'Admin';
        const grupsText = role === 'superadmin'
            ? 'Tots els grups'
            : (grups.length > 0 ? grups.join(', ') : '⚠️  Sense grups assignats');

        console.log(`  ${roleIcon} ${admin.user}`);
        console.log(`     Rol:    ${roleText}`);
        console.log(`     Grups:  ${grupsText}`);
        console.log('');
    }
    console.log('═══════════════════════════════════════════════════════════════');
}

async function promocionarSuperadmin(user) {
    const admin = await Admin.findOne({ user });
    if (!admin) {
        console.error(`❌ No s'ha trobat l'administrador "${user}".`);
        console.log('   Usa --list per veure els admins disponibles.');
        process.exit(1);
    }

    admin.role = 'superadmin';
    admin.grupsPermesos = [];
    await admin.save();

    console.log(`👑 "${user}" promocionat a Superadmin correctament!`);
    console.log('   Ara té accés total a tots els grups i menús de gestió.');
}

async function actualitzarAdmin(user, role, grupsRaw) {
    const admin = await Admin.findOne({ user });
    if (!admin) {
        console.error(`❌ No s'ha trobat l'administrador "${user}".`);
        console.log('   Usa --list per veure els admins disponibles.');
        process.exit(1);
    }

    let haCanviat = false;

    if (role) {
        if (!['superadmin', 'admin'].includes(role)) {
            console.error(`❌ Rol invàlid: "${role}". Ha de ser "superadmin" o "admin".`);
            process.exit(1);
        }
        const rolAntic = admin.role || 'admin';
        admin.role = role;
        console.log(`   Rol: ${rolAntic} → ${role}`);
        haCanviat = true;

        // Si es canvia a superadmin, netegem grupsPermesos
        if (role === 'superadmin') {
            admin.grupsPermesos = [];
            console.log('   GrupsPermesos: netejat (superadmin no necessita grups)');
        }
    }

    if (grupsRaw !== null) {
        const grups = grupsRaw
            .split(',')
            .map(g => g.trim())
            .filter(g => g.length > 0);

        const grupsAntics = admin.grupsPermesos || [];
        admin.grupsPermesos = grups;
        console.log(`   Grups: [${grupsAntics.join(', ') || 'cap'}] → [${grups.join(', ') || 'cap'}]`);
        haCanviat = true;
    }

    if (!haCanviat) {
        console.log('⚠️  No s\'ha especificat cap canvi. Usa --role i/o --grups.');
        return;
    }

    await admin.save();
    console.log(`✅ Administrador "${user}" actualitzat correctament.`);
}

async function migrarTots() {
    const admins = await Admin.find({});

    let migrats = 0;
    for (const admin of admins) {
        let modificat = false;

        if (admin.role === undefined || admin.role === null) {
            admin.role = 'admin';
            modificat = true;
        }
        if (admin.grupsPermesos === undefined || admin.grupsPermesos === null) {
            admin.grupsPermesos = [];
            modificat = true;
        }

        if (modificat) {
            await admin.save();
            migrats++;
            console.log(`   ✅ ${admin.user}: role='${admin.role}', grupsPermesos=[]`);
        }
    }

    if (migrats === 0) {
        console.log('✅ Tots els administradors ja tenen els camps role i grupsPermesos.');
    } else {
        console.log(`\n🎉 ${migrats} administrador(s) migrat(s) correctament.`);
    }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
    const opts = parseArgs();

    // Si no hi ha cap opció, mostrar ajuda
    if (!opts.list && !opts.promote && !opts.user && !opts.migrateAll) {
        printHelp();
        process.exit(0);
    }

    console.log('🔌 Connectant a MongoDB...');
    await mongoose.connect(DATABASE_URL);
    console.log('✅ Connexió establerta.\n');

    try {
        if (opts.list) {
            await llistarAdmins();
        }

        if (opts.migrateAll) {
            console.log('🔄 Migrant tots els administradors...\n');
            await migrarTots();
        }

        if (opts.promote) {
            await promocionarSuperadmin(opts.promote);
        }

        if (opts.user) {
            if (!opts.role && opts.grups === null) {
                console.error('❌ Amb --user cal especificar --role i/o --grups.');
                process.exit(1);
            }
            await actualitzarAdmin(opts.user, opts.role, opts.grups);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Fet!');
    }
}

main();
