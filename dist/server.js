import compression from 'compression';
import express from 'express';
import { Eta } from 'eta';
import fs from 'fs';
import path from 'path';
import adminRoutes from './routes/adminRoutes.js';
import educationRoutes from './routes/educationRoutes.js';
import languageRoutes from './routes/languageRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import workRoutes from './routes/workRoutes.js';
import { getSiteContent } from './models/adminModel.js';
import { getProjectByName, getProjectBySlug } from './models/projectModel.js';
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const appRoot = process.cwd();
const viewsRoot = path.join(appRoot, 'views');
const templateCacheEnabled = process.env.NODE_ENV === 'production';
const assetVersion = Date.now().toString(36);
const eta = new Eta({
    views: viewsRoot,
    cache: templateCacheEnabled,
    useWith: true,
});
const cachedAssetPattern = /\.(?:css|woff2?|ttf|otf|eot)$/i;
// Gzip/Brotli-capable responses for HTML, JSON, CSS, JS, and other compressible types.
app.use(compression({
    threshold: 1024,
    level: 6,
}));
// Linux is case-sensitive: git may have `Public/` while builds write to `public/`.
function resolvePublicRoots(root) {
    const candidates = [path.join(root, 'public'), path.join(root, 'Public')];
    const seen = new Set();
    const dirs = [];
    for (const candidate of candidates) {
        if (!fs.existsSync(candidate))
            continue;
        const resolved = fs.realpathSync(candidate);
        const key = process.platform === 'win32' ? resolved.toLowerCase() : resolved;
        if (seen.has(key))
            continue;
        seen.add(key);
        dirs.push(resolved);
    }
    return dirs.length > 0 ? dirs : [path.join(root, 'public')];
}
const publicRoots = resolvePublicRoots(appRoot);
const publicRoot = publicRoots[0];
const setStaticCacheHeaders = (res, filePath) => {
    if (cachedAssetPattern.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
};
app.engine('eta', (filePath, options, callback) => {
    try {
        const templatePath = path.relative(viewsRoot, filePath);
        callback(null, eta.render(templatePath, options));
    }
    catch (error) {
        callback(error);
    }
});
app.set('view engine', 'eta');
app.set('views', viewsRoot);
app.set('view cache', templateCacheEnabled);
app.locals.assetVersion = assetVersion;
const staticOptions = {
    etag: true,
    lastModified: true,
    setHeaders: setStaticCacheHeaders,
};
for (const root of publicRoots) {
    app.use('/Public', express.static(root, staticOptions));
    app.use('/public', express.static(root, staticOptions));
    app.use(express.static(root, {
        ...staticOptions,
        extensions: ['css', 'js', 'pdf', 'webp', 'ico', 'png', 'jpg', 'svg'],
    }));
}
app.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/admin', adminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/work', workRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/languages', languageRoutes);
app.get('/', async (req, res) => {
    res.render('public/index', { content: await getSiteContent() });
});
app.get('/projects', (req, res) => {
    res.render('public/projects');
});
app.get('/projects/', (req, res) => {
    res.render('public/projects');
});
app.get('/privacy', (req, res) => {
    res.render('public/privacy');
});
app.get('/projects/detail', async (req, res) => {
    const projectName = req.query.project;
    const project = projectName ? await getProjectByName(projectName).catch(() => null) : null;
    if (project) {
        return res.redirect(301, `/projects/${project.slug}`);
    }
    res.redirect(302, '/projects');
});
app.get('/projects/:slug', async (req, res) => {
    const project = await getProjectBySlug(req.params.slug).catch(() => null);
    if (!project) {
        return res.status(404).render('public/detail', { projectName: null, project: null });
    }
    res.render('public/detail', { projectName: project.projectName, project });
});
app.listen(PORT, HOST, () => {
    console.log(`Serving static files from: ${publicRoots.join(', ')}`);
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log(`Tailscale MagicDNS: http://server1:${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
});
