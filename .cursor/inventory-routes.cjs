const fs = require('fs');
const path = require('path');

const root = path.join('apps', 'api', 'src');
const files = [];

function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.controller.ts')) files.push(p);
  }
}
walk(root);

const routes = [];
for (const f of files) {
  const t = fs.readFileSync(f, 'utf8');
  const ctrlMatch = t.match(/@Controller\(\s*(?:'([^']*)'|"([^"]*)")?\s*\)/);
  const ctrl = (ctrlMatch && (ctrlMatch[1] || ctrlMatch[2])) || '';
  for (const line of t.split(/\n/)) {
    const m = line.match(
      /@(Get|Post|Patch|Put|Delete)\(\s*(?:'([^']*)'|"([^"]*)")?\s*\)/,
    );
    if (!m) continue;
    const method = m[1].toUpperCase();
    const sub = m[2] || m[3] || '';
    const parts = [];
    if (ctrl) parts.push(ctrl.replace(/^\/+|\/+$/g, ''));
    if (sub) parts.push(sub.replace(/^\/+|\/+$/g, ''));
    const full = '/' + parts.filter(Boolean).join('/');
    routes.push({
      method,
      path: full.replace(/\/+/g, '/'),
      file: path.relative('.', f).replace(/\\/g, '/'),
    });
  }
}

routes.sort(
  (a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method),
);

const readme = fs.readFileSync('README.md', 'utf8');
const readmePaths = new Set();
for (const line of readme.split(/\n/)) {
  if (!line.includes('|')) continue;
  const cells = line.split('|').map((c) => c.trim());
  if (cells.length < 3) continue;
  const pathCell = cells[2] || '';
  if (!pathCell.startsWith('/')) continue;
  // expand abbreviated cells like /requests/:id[/cancel,close]
  readmePaths.add(pathCell);
}

function coveredByReadme(routePath) {
  if (readme.includes('`' + routePath + '`')) return true;
  if (readme.includes(routePath)) return true;
  // check segment roots documented
  const rootSeg = '/' + routePath.split('/').filter(Boolean)[0];
  // known abbreviated patterns in README
  const abbrevs = [
    [/\/requests\/[^/]+\/(cancel|close)/, '/requests/:id[/cancel,close]'],
    [/\/proposals\/[^/]+\/(withdraw|reject|accept)/, '/proposals/:id/[withdraw,reject,accept]'],
    [/\/projects\/[^/]+\/(cancel|on-hold|resume)/, '/projects/:id/[cancel,on-hold,resume]'],
    [/\/stages\/[^/]+\/(start|submit|approve|reject)/, '/stages/:id/[start,submit,approve,reject]'],
    [/\/payments\/[^/]+\/(pay|release)/, '/payments/:id/[pay,release]'],
    [/\/notifications\/read-all/, '/notifications[/:id/read,/read-all]'],
    [/\/notifications\/[^/]+\/read/, '/notifications[/:id/read,/read-all]'],
    [/\/verifications\/admin\/pending/, '/verifications/admin/pending'],
    [/\/verifications\/[^/]+\/(approve|reject)/, '/verifications/admin'],
    [/\/admin\/users\/[^/]+\/(suspend|reactivate)/, '/admin/users'],
    [/\/admin\/reports\/[^/]+\/(resolve|dismiss)/, '/admin/reports'],
    [/\/moodboards\/[^/]+\/items/, '/moodboards/:id/items'],
    [/\/favourites\/[^/]+/, '/favourites/:designerId'],
    [/\/blocks\/[^/]+/, '/blocks'],
    [/\/reports\/mine/, '/reports'],
  ];
  for (const [re] of abbrevs) {
    if (re.test(routePath) && readme.includes(rootSeg)) return true;
  }
  if (readme.includes(rootSeg)) {
    // soft cover if root documented in table
    const tableHasRoot = [...readme.matchAll(/\| [^|]* \| (`?\/[^`|\s]+`?)/g)].some(
      (m) => m[1].replace(/`/g, '').startsWith(rootSeg),
    );
    return tableHasRoot;
  }
  return false;
}

const uncovered = routes.filter((r) => !coveredByReadme(r.path));

console.log('TOTAL_ROUTES', routes.length);
console.log('---ALL---');
for (const r of routes) {
  console.log(r.method.padEnd(6) + r.path);
}
console.log('---UNDOCUMENTED_OR_WEAK---');
console.log(uncovered.length);
for (const r of uncovered) {
  console.log(r.method.padEnd(6) + r.path + '  (' + r.file + ')');
}
