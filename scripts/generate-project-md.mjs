#!/usr/bin/env node
/**
 * generate-project-md.mjs — builds PROJECT.md from the current state of this repository.
 *
 *   node scripts/generate-project-md.mjs            write PROJECT.md (only when something changed)
 *   node scripts/generate-project-md.mjs --watch    keep rewriting it whenever a project file changes
 *   node scripts/generate-project-md.mjs --check    exit 1 when PROJECT.md is out of date (for CI)
 *   node scripts/generate-project-md.mjs --quiet    print nothing unless something fails
 *
 * Everything in PROJECT.md is generated from package.json, the source tree, the
 * public API in src/lib/index.ts, the data catalogue, the stylesheet, the CI
 * workflows and git, except the block between <!-- manual:start --> and
 * <!-- manual:end -->, which is carried over unchanged so hand-written notes survive.
 */
import { execSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync, watch, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_NAME = 'PROJECT.md'
const OUT = join(ROOT, OUT_NAME)
const args = new Set(process.argv.slice(2))
const quiet = args.has('--quiet')
const say = (...m) => { if (!quiet) console.log(...m) }

const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'dist-demo', '.vercel'])
const TEXT_EXT = /\.(ts|tsx|js|mjs|cjs|css|json|md|ya?ml|html|toml|txt)$/i
const MANUAL_START = '<!-- manual:start -->'
const MANUAL_END = '<!-- manual:end -->'
const FILE = Symbol('file')

const DEFAULT_MANUAL = `### Known issues and next steps

This block is written by hand and survives regeneration. Edit it freely; tick items off as they are done.

- [ ] GitHub Pages is not enabled for the repository, so the homepage URL returns 404. Enable it under Settings → Pages → Source: GitHub Actions.
- [ ] \`BrowserRouter\` in \`src/demo/App.tsx\` has no \`basename\`, so the demo renders blank under the \`/delivery-journey-3d/\` base path used by the Pages build. Pass \`basename={import.meta.env.BASE_URL}\`.
- [ ] The setup guide says new \`orders\` make vehicles drive to the new station; \`setOrders\` actually clears the board and places fresh journeys instantly.
- [ ] Changing the controlled \`service\` prop calls \`setService\`, which drops the current \`orders\` until the orders array itself changes.
- [ ] \`useReducedMotion\` reads \`window.matchMedia\` during the first render, so a server-side import throws. Guard with \`typeof window\`.
- [ ] \`cssFileName\` in \`vite.lib.config.ts\` sits under \`build\` instead of \`build.lib\` and is ignored.
- [ ] \`tint()\` in \`src/lib/scene/primitives.tsx\` only understands 6-digit hex colours.
- [ ] No tests yet. \`path.ts\` and \`store.ts\` are pure and easy to cover with vitest.`

const PURPOSE = {
  'package.json': 'Package manifest: scripts, dependencies, npm entry points',
  'package-lock.json': 'Locked dependency tree',
  'vite.config.ts': 'Demo site build (output: dist-demo)',
  'vite.lib.config.ts': 'Library build: ESM + CJS + types + CSS into dist',
  'tsconfig.json': 'TypeScript project references',
  'tsconfig.app.json': 'TypeScript settings for src',
  'tsconfig.node.json': 'TypeScript settings for the Vite config',
  '.oxlintrc.json': 'oxlint rules',
  'vercel.json': 'Vercel deployment of the demo',
  'netlify.toml': 'Netlify deployment of the demo',
  'index.html': 'Demo entry page',
  '.gitignore': 'Ignored paths',
  'LICENSE': 'MIT licence',
  'README.md': 'Package readme (published to npm)',
  'PROJECT.md': 'This file (generated)',
  '.claude/launch.json': 'Dev server definition for the Claude Code browser preview',
  '.claude/settings.json': 'Claude Code hooks that keep PROJECT.md up to date',
  'scripts/generate-project-md.mjs': 'Generates PROJECT.md',
}

/* ---------- small helpers ---------- */

const read = (p) => readFileSync(join(ROOT, p), 'utf8').replace(/^\uFEFF/, '')
const exists = (p) => existsSync(join(ROOT, p))
const code = (s) => '`' + String(s) + '`'
const cell = (s) => String(s ?? '').replace(/\r?\n/g, ' ').replace(/(?<!\\)\|/g, '\\|')
const fmtSize = (n) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} kB` : `${(n / 1024 / 1024).toFixed(1)} MB`)

function table(headers, rows) {
  if (!rows.length) return '_none_\n'
  const line = (cells) => `| ${cells.map(cell).join(' | ')} |`
  return [line(headers), `|${headers.map(() => ' --- ').join('|')}|`, ...rows.map(line)].join('\n') + '\n'
}

function sh(cmd) {
  try { return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch { return '' }
}

function walk(dir = '') {
  const out = []
  for (const name of readdirSync(join(ROOT, dir)).sort()) {
    if (IGNORE_DIRS.has(name) || (!dir && name === OUT_NAME)) continue
    const rel = dir ? `${dir}/${name}` : name
    const st = statSync(join(ROOT, rel))
    if (st.isDirectory()) out.push(...walk(rel))
    else out.push({ path: rel, size: st.size, lines: TEXT_EXT.test(name) ? read(rel).split('\n').length : null })
  }
  return out
}

function renderTree(files) {
  const root = {}
  for (const f of files) {
    const parts = f.path.split('/')
    let node = root
    for (const part of parts.slice(0, -1)) node = node[part] ??= {}
    node[parts.at(-1)] = { [FILE]: f }
  }
  const out = []
  const rec = (node, depth) => {
    const keys = Object.keys(node).sort()
    for (const k of keys.filter((k) => !node[k][FILE])) { out.push(`${'  '.repeat(depth)}${k}/`); rec(node[k], depth + 1) }
    for (const k of keys.filter((k) => node[k][FILE])) {
      const f = node[k][FILE]
      const meta = f.lines != null ? `${f.lines} lines` : fmtSize(f.size)
      out.push(`${'  '.repeat(depth)}${k}`.padEnd(46) + meta)
    }
  }
  rec(root, 0)
  return out.join('\n')
}

/** `export interface Name { … }` → [{ name, optional, type, doc }]. One member per line, with an optional `/** doc *\/` line before it. */
function parseInterface(src, name) {
  const m = src.match(new RegExp(`export interface ${name}\\b[^{]*\\{([\\s\\S]*?)\\n\\}`))
  if (!m) return []
  const rows = []
  let doc = ''
  for (const raw of m[1].split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const dm = line.match(/^\/\*\*\s*(.*?)\s*\*\/$/)
    if (dm) { doc = dm[1]; continue }
    if (/^(\/\/|\/\*|\*)/.test(line)) continue
    const pm = line.match(/^(\w+)(\?)?:\s*(.+?);?$/)
    if (pm) { rows.push({ name: pm[1], optional: Boolean(pm[2]), type: pm[3], doc }); doc = '' }
  }
  return rows
}

/** Names a module exports at the top level: `export const X`, `export function X`, `export { A, B }`, `export type { T }`. */
function moduleExports(file) {
  if (!exists(file)) return { values: [], types: [] }
  const src = read(file).replace(/\{[^{}]*\}/g, (s) => s.replace(/\s+/g, ' '))
  const values = new Set(), types = new Set()
  for (const m of src.matchAll(/^export (?:const|function|class) (\w+)/gm)) values.add(m[1])
  for (const m of src.matchAll(/^export (type )?\{([^}]+)\}(?!\s*from)/gm)) {
    for (const n of m[2].split(',').map((s) => s.trim()).filter(Boolean)) (m[1] ? types : values).add(n.replace(/^type /, ''))
  }
  for (const m of src.matchAll(/^export (?:type|interface) (\w+)/gm)) types.add(m[1])
  return { values: [...values], types: [...types] }
}

/** src/lib/index.ts → [{ title, items: [{ names, types, from, star }] }], grouped by the `// comment` above each run of exports. */
function publicApi() {
  if (!exists('src/lib/index.ts')) return []
  const src = read('src/lib/index.ts').replace(/\{[^{}]*\}/g, (s) => s.replace(/\s+/g, ' '))
  const groups = []
  let cur = null
  for (const raw of src.split('\n')) {
    const line = raw.trim()
    const cm = line.match(/^\/\/\s*(.+)$/)
    if (cm) { cur = { title: cm[1], items: [] }; groups.push(cur); continue }
    const em = line.match(/^export\s+(type\s+)?\{([^}]+)\}\s+from\s+'([^']+)'/)
    const sm = line.match(/^export\s+\*\s+from\s+'([^']+)'/)
    if (!em && !sm) continue
    if (!cur) { cur = { title: 'Exports', items: [] }; groups.push(cur) }
    if (em) {
      const names = em[2].split(',').map((s) => s.trim()).filter(Boolean)
      cur.items.push({ names: em[1] ? [] : names, types: em[1] ? names : [], from: em[3], star: false })
    } else {
      const target = ['.ts', '.tsx', '/index.ts'].map((ext) => `src/lib/${sm[1].replace(/^\.\//, '')}${ext}`).find(exists)
      const ex = target ? moduleExports(target) : { values: [], types: [] }
      cur.items.push({ names: ex.values, types: ex.types, from: sm[1], star: true })
    }
  }
  return groups.filter((g) => g.items.length)
}

/** Keys of `export const <name> … = { key: Component, … }` in a models file. */
function modelKeys(file, constName) {
  if (!exists(file)) return []
  const m = read(file).match(new RegExp(`export const ${constName}\\b[^=]*=\\s*\\{([\\s\\S]*?)\\n\\}`))
  return m ? [...m[1].matchAll(/(\w+):\s*(\w+)/g)].map((x) => ({ key: x[1], component: x[2] })) : []
}

function themeTokens() {
  if (!exists('src/lib/styles.css')) return []
  const m = read('src/lib/styles.css').match(/\.dj-root\s*\{([\s\S]*?)\n\}/)
  return m ? [...m[1].matchAll(/(--dj-[\w-]+):\s*([^;]+);/g)].map((x) => ({ name: x[1], value: x[2].trim() })) : []
}

function demoRoutes() {
  if (!exists('src/demo/App.tsx')) return []
  return [...read('src/demo/App.tsx').matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1])
}

function workflows() {
  const dir = '.github/workflows'
  if (!exists(dir)) return []
  return readdirSync(join(ROOT, dir)).filter((f) => /\.ya?ml$/.test(f)).sort().map((f) => {
    const src = read(`${dir}/${f}`)
    const name = src.match(/^name:\s*(.+)$/m)?.[1]?.trim() ?? f
    const on = src.match(/^on:\s*(.*)$/m)
    let trigger = on?.[1]?.trim() ?? ''
    if (on && !trigger) {
      const events = []
      for (const l of src.slice(on.index + on[0].length).split('\n').slice(1)) {
        if (l.trim() && !/^\s/.test(l)) break
        const ev = l.match(/^\s{2}(\w[\w-]*):\s*(.*)$/)
        const detail = l.match(/^\s{4}(\w[\w-]*):\s*(.+)$/)
        if (ev) events.push({ name: ev[1], details: ev[2] ? [ev[2]] : [] })
        else if (detail && events.length) events.at(-1).details.push(`${detail[1]}: ${detail[2]}`)
      }
      trigger = events.map((e) => (e.details.length ? `${e.name} (${e.details.join(', ')})` : e.name)).join(', ')
    }
    const steps = [...src.matchAll(/^\s*-\s+run:\s*(.+)$/gm)].map((m) => m[1].trim())
    return { file: `${dir}/${f}`, name, trigger, steps }
  })
}

async function loadCatalogue() {
  // The data files are plain TypeScript with type-only imports, so Node can load them directly.
  // The query string defeats the module cache in --watch mode.
  const imp = (p) => import(pathToFileURL(join(ROOT, p)).href + `?t=${Date.now()}`)
  const [{ defaultServices }, { defaultVehicles }, { defaultSteps }] = await Promise.all([
    imp('src/lib/data/services.ts'), imp('src/lib/data/vehicles.ts'), imp('src/lib/data/steps.ts'),
  ])
  return { services: defaultServices, vehicles: defaultVehicles, steps: defaultSteps }
}

function manualBlock() {
  if (!existsSync(OUT)) return DEFAULT_MANUAL
  const cur = readFileSync(OUT, 'utf8')
  const a = cur.indexOf(MANUAL_START), b = cur.indexOf(MANUAL_END)
  return a >= 0 && b > a ? cur.slice(a + MANUAL_START.length, b).trim() : DEFAULT_MANUAL
}

const stripStamp = (s) => s.replace(/^_Last generated:.*$/m, '')

/* ---------- document ---------- */

async function build() {
  const pkg = JSON.parse(read('package.json'))
  const files = walk()
  const sum = (prefix) => {
    const fs = files.filter((f) => f.path.startsWith(prefix))
    return { files: fs.length, lines: fs.reduce((n, f) => n + (f.lines ?? 0), 0) }
  }
  const lib = sum('src/lib/'), demo = sum('src/demo/'), all = sum('')
  const routes = demoRoutes()
  const api = publicApi()
  const props = exists('src/lib/DeliveryJourney.tsx') ? parseInterface(read('src/lib/DeliveryJourney.tsx'), 'DeliveryJourneyProps') : []
  const state = exists('src/lib/store.ts') ? parseInterface(read('src/lib/store.ts'), 'JourneyState') : []
  const stationModels = modelKeys('src/lib/scene/stations/defaultStationModels.tsx', 'defaultStationModels')
  const vehicleModels = modelKeys('src/lib/scene/vehicles/defaultVehicleModels.tsx', 'defaultVehicleModels')
  const tokens = themeTokens()
  const flows = workflows()
  let catalogue = null, catalogueError = ''
  try { catalogue = await loadCatalogue() } catch (e) { catalogueError = e?.message ?? String(e) }

  const branch = sh('git rev-parse --abbrev-ref HEAD')
  const remote = sh('git remote get-url origin')
  const commits = sh('git log -8 --date=short --format=%h%x09%ad%x09%s').split('\n').filter(Boolean).map((l) => l.split('\t'))
  const dirty = sh('git status --porcelain').split('\n').filter((l) => l.trim() && !l.endsWith(OUT_NAME))
    .map((l) => ({ status: l.slice(0, 2).trim() || '?', file: l.slice(3) }))

  const deploy = []
  if (flows.some((f) => /pages/i.test(f.name))) deploy.push('GitHub Pages (workflow)')
  if (exists('vercel.json')) deploy.push('Vercel (`vercel.json`)')
  if (exists('netlify.toml')) deploy.push('Netlify (`netlify.toml`)')

  const entryPoints = Object.entries(pkg.exports ?? {}).map(([k, v]) =>
    typeof v === 'string' ? `${code(k)} → ${code(v)}` : `${code(k)} → ${Object.entries(v).map(([c, p]) => `${c}: ${code(p)}`).join(', ')}`)

  const s = []
  s.push(`# ${pkg.name}`)
  s.push('')
  s.push(`> ${pkg.description ?? ''}`)
  s.push('')
  s.push(`_Last generated: ${new Date().toISOString().replace('T', ' ').slice(0, 16)} UTC_`)
  s.push('')
  s.push(`This file is generated by ${code('scripts/generate-project-md.mjs')}. Do not edit it by hand, except inside the`)
  s.push(`"Known issues and next steps" block near the end. It is refreshed automatically by the Claude Code hooks in`)
  s.push(`${code('.claude/settings.json')} after every file edit, or on demand with ${code('npm run docs:project')}.`)
  s.push(`Run ${code('npm run docs:watch')} to keep it updated while editing in another tool.`)
  s.push('')

  s.push('## At a glance')
  s.push('')
  s.push(table(['', ''], [
    ['Version', pkg.version ?? ''],
    ['Licence', pkg.license ?? ''],
    ['Module type', pkg.type ?? '(unset)'],
    ['Repository', pkg.repository?.url ?? remote],
    ['Homepage', pkg.homepage ?? ''],
    ['Entry points', entryPoints.join('<br>')],
    ['Peer dependencies', Object.entries(pkg.peerDependencies ?? {}).map(([k, v]) => `${k} ${v}`).join(', ')],
    ['Runtime dependencies', Object.entries(pkg.dependencies ?? {}).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'],
    ['Source', `${lib.files} files / ${lib.lines} lines in src/lib, ${demo.files} files / ${demo.lines} lines in src/demo`],
    ['Demo routes', routes.map(code).join(', ')],
    ['Deploy targets', deploy.join(', ') || 'none'],
    ['Branch', `${code(branch)}${commits[0] ? ` at ${code(commits[0][0])}` : ''}`],
  ]))

  s.push('## Scripts')
  s.push('')
  s.push(table(['Script', 'Command'], Object.entries(pkg.scripts ?? {}).map(([k, v]) => [code(`npm run ${k}`), code(v)])))

  s.push('## Repository layout')
  s.push('')
  s.push(`${all.files} files, ${all.lines} lines of text (node_modules, build output and local tool state excluded).`)
  s.push('')
  s.push('```')
  s.push(renderTree(files))
  s.push('```')
  s.push('')
  s.push('### Configuration and tooling files')
  s.push('')
  s.push(table(['File', 'Purpose'], files.filter((f) => PURPOSE[f.path]).map((f) => [code(f.path), PURPOSE[f.path]])))

  s.push('## Public API')
  s.push('')
  s.push(`Everything exported from ${code('src/lib/index.ts')}, grouped as the file groups it.`)
  s.push('')
  for (const g of api) {
    s.push(`**${g.title}**`)
    s.push('')
    for (const it of g.items) {
      const parts = []
      if (it.names.length) parts.push(it.names.map(code).join(', '))
      if (it.types.length) parts.push(`types ${it.types.map(code).join(', ')}`)
      s.push(`- ${parts.join('; ')} (${it.star ? 'everything in ' : ''}${code(it.from)})`)
    }
    s.push('')
  }

  s.push('## `<DeliveryJourney>` props')
  s.push('')
  s.push(`Parsed from ${code('DeliveryJourneyProps')} in ${code('src/lib/DeliveryJourney.tsx')}.`)
  s.push('')
  s.push(table(['Prop', 'Type', 'Description'], props.map((p) => [code(p.name + (p.optional ? '?' : '')), code(p.type), p.doc])))

  s.push('## Store state and actions')
  s.push('')
  s.push(`Parsed from ${code('JourneyState')} in ${code('src/lib/store.ts')}. Use ${code('useJourney(selector)')} to read and ${code('useJourneyStore().getState()')} for imperative calls.`)
  s.push('')
  s.push('**State**')
  s.push('')
  s.push(table(['Field', 'Type', 'Description'], state.filter((m) => !m.type.includes('=>')).map((m) => [code(m.name), code(m.type), m.doc])))
  s.push('**Actions**')
  s.push('')
  s.push(table(['Action', 'Signature', 'Description'], state.filter((m) => m.type.includes('=>')).map((m) => [code(m.name), code(m.type), m.doc])))

  s.push('## Content catalogue')
  s.push('')
  if (!catalogue) {
    s.push(`Could not load ${code('src/lib/data/*.ts')}: ${catalogueError}. Run ${code('npm run docs:project')} to see the full error.`)
    s.push('')
  } else {
    const { services, vehicles, steps } = catalogue
    const stepName = (id) => steps[id]?.name ?? `?${id}`
    s.push(`${Object.keys(services).length} delivery types, ${Object.keys(steps).length} catalogue steps, ${stationModels.length} station models, ${Object.keys(vehicles).length} vehicles, ${vehicleModels.length} vehicle models. Loaded from ${code('src/lib/data/')}.`)
    s.push('')
    s.push('### Delivery types')
    s.push('')
    s.push(table(['Id', 'Label', 'Vehicle', 'ETA', 'Stations', 'Done word', 'Route'],
      Object.values(services).map((sv) => [code(sv.id), sv.label, sv.vehicle, sv.eta, sv.steps.length, sv.doneWord, sv.steps.map(stepName).join(' → ')])))
    s.push('### Vehicles')
    s.push('')
    s.push(table(['Id', 'Label', 'Speed (units/s)', 'km/h', 'Altitude', 'Colour', 'Model component', 'Blurb'],
      Object.values(vehicles).map((v) => [code(v.id), v.label, v.speed, v.kmh, v.altitude, code(v.color), code(vehicleModels.find((m) => m.key === v.id)?.component ?? 'missing'), v.blurb])))
    s.push('### Steps')
    s.push('')
    s.push(`Each step carries the backend ${code('status')} it stands for; ${code('routeIndexForStatus')} maps a status to a station on the selected route.`)
    s.push('')
    s.push(table(['Id', 'Name', 'Short', 'Status', 'Model', 'Colour'],
      Object.values(steps).map((st) => [code(st.id), st.name, st.short, code(st.status), code(st.model), code(st.color)])))
    s.push('### Station models')
    s.push('')
    s.push(table(['Key', 'Component', 'Used by steps'],
      stationModels.map((m) => [code(m.key), code(m.component), Object.values(steps).filter((st) => st.model === m.key).map((st) => st.id).join(', ') || 'unused'])))
  }

  s.push('## Theme tokens')
  s.push('')
  s.push(`Defaults declared on ${code('.dj-root')} in ${code('src/lib/styles.css')}; override with the ${code('theme')} prop or your own CSS.`)
  s.push('')
  s.push(table(['Token', 'Default'], tokens.map((t) => [code(t.name), code(t.value)])))

  s.push('## CI and deployment')
  s.push('')
  s.push(table(['Workflow', 'File', 'Trigger', 'Runs'], flows.map((f) => [f.name, code(f.file), f.trigger, f.steps.map(code).join('<br>')])))
  if (exists('vercel.json')) {
    const v = JSON.parse(read('vercel.json'))
    s.push(`**Vercel**: build ${code(v.buildCommand ?? 'default')}, output ${code(v.outputDirectory ?? 'default')}, framework ${code(v.framework ?? 'auto')}.`)
    s.push('')
  }
  if (exists('netlify.toml')) {
    const t = read('netlify.toml')
    s.push(`**Netlify**: build ${code(t.match(/command\s*=\s*"([^"]+)"/)?.[1] ?? '?')}, publish ${code(t.match(/publish\s*=\s*"([^"]+)"/)?.[1] ?? '?')}.`)
    s.push('')
  }

  s.push('## Git')
  s.push('')
  s.push(`Branch ${code(branch || '?')}, remote ${code(remote || 'none')}.`)
  s.push('')
  s.push('**Recent commits**')
  s.push('')
  s.push(table(['Commit', 'Date', 'Subject'], commits.map(([h, d, m]) => [code(h), d, m])))
  s.push('**Uncommitted changes**')
  s.push('')
  s.push(dirty.length ? table(['Status', 'File'], dirty.map((d) => [code(d.status), code(d.file)])) : 'Working tree clean.\n')

  s.push('## Notes')
  s.push('')
  s.push(MANUAL_START)
  s.push(manualBlock())
  s.push(MANUAL_END)
  s.push('')
  return s.join('\n')
}

/* ---------- entry ---------- */

async function run() {
  const next = await build()
  const prev = existsSync(OUT) ? readFileSync(OUT, 'utf8') : ''
  const changed = stripStamp(next) !== stripStamp(prev)
  if (args.has('--check')) {
    if (changed) { console.error(`${OUT_NAME} is out of date. Run: npm run docs:project`); process.exit(1) }
    say(`${OUT_NAME} is up to date.`)
    return
  }
  if (!changed) { say(`${OUT_NAME} unchanged.`); return }
  writeFileSync(OUT, next)
  say(`${OUT_NAME} updated.`)
}

if (args.has('--watch')) {
  await run()
  say(`Watching ${ROOT} for changes... (Ctrl+C to stop)`)
  let timer = null
  watch(ROOT, { recursive: true }, (_event, file) => {
    const rel = String(file ?? '').split('\\').join('/')
    if (!rel || rel === OUT_NAME || [...IGNORE_DIRS].some((d) => rel === d || rel.startsWith(`${d}/`))) return
    clearTimeout(timer)
    timer = setTimeout(() => run().catch((e) => console.error(e)), 300)
  })
} else {
  await run()
}
