const fs = require('fs');
try {
    const data = fs.readFileSync('error.log', 'utf16le');
    console.log(data);
} catch (err) {
    console.error(err.message);
}
