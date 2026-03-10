require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use SERVICE_ROLE_KEY for administrative tasks (like bulk import) 
// to bypass Row Level Security (RLS)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('✖ MISSING SUPABASE SERVICE ROLE CREDENTIALS in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Example data - replace this with your actual data source
const usersToImport = [
    {
        name: 'Existing User 1',
        email: 'user1@example.com',
        password_hash: '$2a$10$abcdef...', // Pre-hashed password
        role: 'user'
    },
    // Add more users here
];

const importUsers = async () => {
    console.log(`Starting import of ${usersToImport.length} users...`);

    const { data, error } = await supabase
        .from('users')
        .insert(usersToImport)
        .select();

    if (error) {
        console.error('✖ Import failed:', error.message);
    } else {
        console.log('✔ Successfully imported users:', data.length);
    }
};

console.log('--- IMPORTANT: This script uses the SERVICE_ROLE_KEY. Keep it private. ---');
// importUsers(); // Uncomment to run
