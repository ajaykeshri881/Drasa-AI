const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'src', 'app');
const legal = path.join(root, '(legal)');
const marketing = path.join(root, '(marketing)');

// Delete existing duplicates
try { fs.rmSync(path.join(legal, 'privacy'), { recursive: true, force: true }); } catch(e){}
try { fs.rmSync(path.join(legal, 'terms'), { recursive: true, force: true }); } catch(e){}

// Move root to route groups
try { fs.renameSync(path.join(root, 'privacy'), path.join(legal, 'privacy')); } catch(e){}
try { fs.renameSync(path.join(root, 'terms'), path.join(legal, 'terms')); } catch(e){}
try { fs.renameSync(path.join(root, 'disclaimer'), path.join(legal, 'disclaimer')); } catch(e){}
try { fs.renameSync(path.join(root, 'refund'), path.join(legal, 'refund')); } catch(e){}

try { fs.renameSync(path.join(root, 'about'), path.join(marketing, 'about')); } catch(e){}
try { fs.renameSync(path.join(root, 'contact'), path.join(marketing, 'contact')); } catch(e){}

console.log("Folder structure fixed successfully!");
