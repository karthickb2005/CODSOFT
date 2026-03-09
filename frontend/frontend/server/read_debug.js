const fs = require('fs');
try {
    const data = fs.readFileSync('debug_out.json', 'utf16le');
    console.log(data);
} catch (err) {
    console.error(err.message);
}
