const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const templatesDir = path.join(__dirname, 'templates');

function usage() {
	console.log('Usage: node index.js <type> <Name> [--dir targetDir] [--force]');
	console.log('Types: component | route | store');
	process.exit(1);
}

function parseArgs(argv) {
	const args = { flags: {} };
	if (argv.length < 3) usage();
	args.type = argv[2];
	args.name = argv[3];
	for (let i = 4; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--force') args.flags.force = true;
		else if (a === '--dir') args.flags.dir = argv[++i];
	}
	return args;
}

function renderTemplate(tpl, name) {
	const lower = name[0].toLowerCase() + name.slice(1);
	const upper = name[0].toUpperCase() + name.slice(1);
	return tpl.replace(/\{\{name\}\}/g, upper).replace(/\{\{lowerName\}\}/g, lower);
}

async function writeIfNotExists(targetPath, content, force) {
	const dir = path.dirname(targetPath);
	await fsp.mkdir(dir, { recursive: true });
	try {
		await fsp.access(targetPath, fs.constants.F_OK);
		if (!force) {
			throw new Error('exists');
		}
	} catch (e) {
		// if not exists, access throws; continue
	}
	await fsp.writeFile(targetPath, content, 'utf8');
}

async function scaffoldComponent(name, targetDir, force) {
	const tpl = await fsp.readFile(path.join(templatesDir, 'Component.js.tpl'), 'utf8');
	const out = renderTemplate(tpl, name);
	const file = path.join(targetDir || path.join('Tool', 'MicroRenderer'), `${name}.js`);
	await writeIfNotExists(file, out, force);
	return file;
}

async function scaffoldRoute(name, targetDir, force) {
	const tpl = await fsp.readFile(path.join(templatesDir, 'Route.js.tpl'), 'utf8');
	const out = renderTemplate(tpl, name);
	const routesDir = targetDir || path.join('Tool', 'SimpleRouter', 'routes');
	const file = path.join(routesDir, `${name}Route.js`);
	await writeIfNotExists(file, out, force);
	// 確保 routes 匯聚檔存在（以動態掃描方式匯出所有 route）
	await ensureRoutesIndex(routesDir);
	return file;
}

async function scaffoldStore(name, targetDir, force) {
	const tpl = await fsp.readFile(path.join(templatesDir, 'Store.js.tpl'), 'utf8');
	const out = renderTemplate(tpl, name);
	const storeDir = targetDir || path.join('Tool', 'StateStore');
	const file = path.join(storeDir, `${name}Store.js`);
	await writeIfNotExists(file, out, force);
	// 確保 StateStore 的 index 匯聚檔存在
	await ensureStoresIndex(storeDir);
	return file;
}

// 新增：確保 routes 目錄下有 index.js（動態匯出所有 *Route.js）
async function ensureRoutesIndex(routesDir) {
	try {
		await fsp.mkdir(routesDir, { recursive: true });
		const indexPath = path.join(routesDir, 'index.js');
		// 若 index 已存在，跳過（我們採用動態生成 index，避免重複 append）
		try {
			await fsp.access(indexPath, fs.constants.F_OK);
			return;
		} catch (e) {
			// create dynamic index
			const content = `const fs = require('fs');\nconst path = require('path');\nconst files = fs.readdirSync(__dirname).filter(f => f.endsWith('Route.js'));\nconst routes = files.map(f => require('./' + path.basename(f, '.js')));\nmodule.exports = routes;\n`;
			await fsp.writeFile(indexPath, content, 'utf8');
		}
	} catch (e) {
		// ignore errors
	}
}

// 新增：確保 StateStore 有 index.js（動態匯出所有 *Store.js）
async function ensureStoresIndex(storeDir) {
	try {
		await fsp.mkdir(storeDir, { recursive: true });
		const indexPath = path.join(storeDir, 'index.js');
		try {
			await fsp.access(indexPath, fs.constants.F_OK);
			return;
		} catch (e) {
			const content = `const fs = require('fs');\nconst path = require('path');\nconst files = fs.readdirSync(__dirname).filter(f => f.endsWith('Store.js'));\nconst stores = {};\nfiles.forEach(f => {\n  const name = path.basename(f, '.js');\n  stores[name] = require('./' + name);\n});\nmodule.exports = stores;\n`;
			await fsp.writeFile(indexPath, content, 'utf8');
		}
	} catch (e) {
		// ignore
	}
}

(async () => {
	try {
		const args = parseArgs(process.argv);
		if (!args.type || !args.name) usage();
		const type = args.type.toLowerCase();
		const target = args.flags.dir;
		const force = !!args.flags.force;
		let created;
		if (type === 'component') {
			created = await scaffoldComponent(args.name, target, force);
		} else if (type === 'route') {
			created = await scaffoldRoute(args.name, target, force);
		} else if (type === 'store') {
			created = await scaffoldStore(args.name, target, force);
		} else {
			usage();
		}
		console.log(`Created: ${created}`);
	} catch (e) {
		if (e.message === 'exists') {
			console.error('Target file already exists. Use --force to overwrite.');
			process.exit(2);
		}
		console.error('Error:', e && e.message ? e.message : e);
		process.exit(3);
	}
})();
