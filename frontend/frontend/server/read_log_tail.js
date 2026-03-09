const fs = require('fs');
try {
    const stats = fs.statSync('error.log');
    const size = stats.size;
    const buffer = Buffer.alloc(2000);
    const fd = fs.openSync('error.log', 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, Math.min(size, 2000), Math.max(0, size - 2000));
    fs.closeSync(fd);
    console.log(buffer.toString('utf16le', 0, bytesRead));
} catch (err) {
    console.error(err.message);
}
