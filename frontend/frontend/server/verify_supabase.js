require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('✖ MISSING SUPABASE CREDENTIALS in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tables = ['users', 'projects', 'tasks', 'chat_messages', 'audit_logs', 'team_members', 'invites'];

const verify = async () => {
    console.log(`Connecting to Supabase at: ${supabaseUrl}`);

    for (const table of tables) {
        try {
            const { error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.error(`✖ Table '${table}' check failed:`, error.message);
                if (error.code === '42P01') {
                    console.log(`   💡 Error 42P01: Table '${table}' does NOT exist.`);
                }
            } else {
                console.log(`✔ Table '${table}' exists. Row count: ${count}`);
            }
        } catch (err) {
            console.error(`✖ Unexpected error checking '${table}':`, err.message);
        }
    }

    console.log('\n--- Verification Complete ---');
    if (tables.some(t => t === 'users')) {
        console.log('💡 TIP: If you need to import data, you can use the Supabase CSV import or a migration script.');
    }
};

verify();
