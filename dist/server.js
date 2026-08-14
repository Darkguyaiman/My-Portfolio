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
import { defaultSiteContent, getSiteContent } from './models/adminModel.js';
import { getEducation } from './models/educationModel.js';
import { getLanguages } from './models/languageModel.js';
import { getProjectByName, getProjectBySlug, getProjects } from './models/projectModel.js';
import { getWorkExperiences } from './models/workModel.js';
import { absoluteUrl, DEFAULT_SITE_URL, DEFAULT_SOCIAL_IMAGE, DEFAULT_SOCIAL_IMAGE_ALT, DEFAULT_SOCIAL_IMAGE_HEIGHT, DEFAULT_SOCIAL_IMAGE_TYPE, DEFAULT_SOCIAL_IMAGE_WIDTH, getSiteUrl, INDEX_ROBOTS, serializeJsonLd, SITE_NAME, truncateDescription, WEB_APP_TITLE, xmlEscape, } from './utils/seo.js';
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const appRoot = process.cwd();
const viewsRoot = path.join(appRoot, 'views');
const templateCacheEnabled = process.env.NODE_ENV === 'production';
const assetVersion = Date.now().toString(36);
const publicHtmlEdgeTtlSeconds = 60;
const publicHtmlStaleSeconds = 600;
const eta = new Eta({
    views: viewsRoot,
    cache: templateCacheEnabled,
    useWith: true,
});
const cachedAssetPattern = /\.(?:css|js|svg|woff2?|ttf|otf|eot)$/i;
const techIconClasses = {
    'Next.js': 'devicon-nextjs-plain colored',
    React: 'devicon-react-original colored',
    TypeScript: 'devicon-typescript-plain colored',
    Nginx: 'devicon-nginx-original colored',
    Ubuntu: 'fa-brands fa-ubuntu colored',
    'Google Cloud': 'devicon-googlecloud-plain colored',
    'Google Cloud Platform': 'devicon-googlecloud-plain colored',
    GCP: 'devicon-googlecloud-plain colored',
    'Node.js': 'fa-brands fa-node-js colored',
    Node: 'fa-brands fa-node-js colored',
    'Express.js': 'devicon-express-original colored',
    Express: 'devicon-express-original colored',
    jQuery: 'devicon-jquery-plain colored',
    HTML: 'devicon-html5-plain colored',
    CSS: 'devicon-css3-plain colored',
    JavaScript: 'devicon-javascript-plain colored',
    MySQL: 'devicon-mysql-plain colored',
    Bootstrap: 'devicon-bootstrap-plain colored',
    'Tailwind CSS': 'devicon-tailwindcss-plain colored',
    Python: 'devicon-python-plain colored',
    SQL: 'devicon-mysql-plain colored',
    'MySQL Workbench': 'devicon-mysql-plain colored',
    'Google Apps Script': 'devicon-google-plain colored',
    'Google Drive API': 'fa-brands fa-google-drive',
    'Google Sheets API': 'fa-regular fa-file-excel',
    'Google Sheets': 'fa-regular fa-file-excel',
};
const developerSkills = [
    'Backend development',
    'Full-stack web development',
    'TypeScript',
    'Node.js',
    'Express.js',
    'MySQL',
    'Next.js',
    'React',
    'Google Apps Script',
    'Business systems',
    'Web application development',
];
const homeDescription = 'Mohamed Aiman, known as Darkguyaiman, is a full-stack and backend developer in Malaysia building web applications, business systems, dashboards, and automation.';
const projectsDescription = 'Explore full-stack and backend development projects by Mohamed Aiman (Darkguyaiman), built with Node.js, TypeScript, MySQL, React, and Google Apps Script.';
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
const publicAssetExists = (relativePath) => publicRoots.some((root) => fs.existsSync(path.join(root, relativePath)));
const publicAssetRoot = (relativePath) => publicRoots.find((root) => fs.existsSync(path.join(root, relativePath))) || null;
const encodeAssetPath = (assetPath) => assetPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
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
app.locals.webAppTitle = WEB_APP_TITLE;
app.locals.techIcon = (technology) => techIconClasses[technology] || null;
app.locals.formatMonthYear = (value) => {
    if (value.toLowerCase() === 'present')
        return 'Present';
    const [year, month] = value.split('-').map(Number);
    if (!year || !month)
        return value;
    return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' })
        .format(new Date(Date.UTC(year, month - 1, 1)));
};
app.locals.institutionLogo = (name) => ({
    'International Modern Arabic School': 'education-institutions/Imas.webp',
    'Malaysia University of Science and Technology': 'education-institutions/MUST.webp',
    IMAS: 'education-institutions/Imas.webp',
    MUST: 'education-institutions/MUST.webp',
}[name] || null);
app.locals.projectThumbnail = (assetPath) => {
    const normalized = String(assetPath || '').replace(/^\/+/, '').replace(/\\/g, '/').replace(/^public\//i, '');
    const lowerPath = normalized.toLowerCase();
    const candidate = lowerPath.startsWith('projects/')
        ? `projects/thumbnails/${path.parse(path.basename(normalized)).name}.webp`
        : lowerPath.startsWith('uploads/images/') && !lowerPath.startsWith('uploads/images/thumbnails/')
            ? `${path.dirname(normalized).replace(/\\/g, '/')}/thumbnails/${path.parse(path.basename(normalized)).name}.webp`
            : null;
    if (!candidate)
        return normalized;
    return publicAssetExists(candidate) ? candidate : normalized;
};
const projectImageMetadataCache = new Map();
app.locals.projectImageSources = (assetPath) => {
    const normalized = String(assetPath || '').replace(/^\/+/, '').replace(/\\/g, '/').replace(/^public\//i, '');
    const cached = projectImageMetadataCache.get(normalized);
    if (cached)
        return cached;
    const baseDirectory = path.dirname(normalized).replace(/\\/g, '/');
    const basename = path.parse(path.basename(normalized)).name;
    const metadataRelativePath = path.join(baseDirectory, 'detail', `${basename}.json`);
    const metadataRoot = publicAssetRoot(metadataRelativePath);
    const metadataPath = metadataRoot ? path.join(metadataRoot, metadataRelativePath) : '';
    const fallback = {
        src: encodeAssetPath(normalized),
        srcset: null,
        sizes: '(max-width: 480px) calc(100vw - 32px), (max-width: 900px) calc(100vw - 40px), (max-width: 1200px) calc(50vw - 48px), 560px',
        width: null,
        height: null,
    };
    try {
        if (!metadataPath)
            return fallback;
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        const source = {
            src: encodeAssetPath(`${baseDirectory}/${metadata.src}`),
            srcset: metadata.sources
                .map((item) => `/${encodeAssetPath(`${baseDirectory}/${item.path}`)} ${item.width}w`)
                .join(', '),
            sizes: fallback.sizes,
            width: metadata.width,
            height: metadata.height,
        };
        projectImageMetadataCache.set(normalized, source);
        return source;
    }
    catch {
        return fallback;
    }
};
app.locals.optimizedAsset = (assetPath, width) => {
    const normalized = String(assetPath || '').replace(/^\/+/, '').replace(/\\/g, '/').replace(/^public\//i, '');
    const lowerPath = normalized.toLowerCase();
    const directory = lowerPath.startsWith('companies/')
        ? 'companies'
        : lowerPath.startsWith('education-institutions/')
            ? 'education-institutions'
            : null;
    const baseName = path.parse(path.basename(normalized)).name;
    if (lowerPath.startsWith('assets/') && /^2d mohamed(?: leaning)?$/i.test(baseName)) {
        const candidate = `assets/optimized/${baseName}-${width <= 256 ? 240 : 480}.webp`;
        return publicAssetExists(candidate) ? candidate : normalized;
    }
    if (!directory)
        return normalized;
    const candidate = `${directory}/optimized/${baseName}-${width}.webp`;
    return publicAssetExists(candidate) ? candidate : normalized;
};
const staticOptions = {
    etag: true,
    lastModified: true,
    redirect: false,
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
app.use((req, res, next) => {
    const isPublicHtml = (req.method === 'GET' || req.method === 'HEAD') && (req.path === '/'
        || req.path === '/projects'
        || req.path === '/privacy'
        || (req.path !== '/projects/detail' && /^\/projects\/[^/]+$/.test(req.path)));
    res.setHeader('Cache-Control', isPublicHtml
        ? `public, max-age=0, s-maxage=${publicHtmlEdgeTtlSeconds}, stale-while-revalidate=${publicHtmlStaleSeconds}`
        : 'no-store');
    next();
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Avoid indexing private CMS pages and duplicate API representations.
app.use(['/admin', '/api'], (_req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    next();
});
// Consolidate the public trailing-slash variants into one canonical URL.
app.use((req, res, next) => {
    const isPublicDuplicate = req.method === 'GET'
        && (req.path === '/projects/' || req.path === '/privacy/' || /^\/projects\/[^/]+\/$/.test(req.path));
    if (!isPublicDuplicate)
        return next();
    const canonicalPath = req.path.replace(/\/+$/, '');
    const queryIndex = req.originalUrl.indexOf('?');
    const query = queryIndex >= 0 ? req.originalUrl.slice(queryIndex) : '';
    return res.redirect(301, `${canonicalPath}${query}`);
});
app.use('/admin', adminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/work', workRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/languages', languageRoutes);
app.get('/robots.txt', (req, res) => {
    const sitemapUrl = absoluteUrl(getSiteUrl(req), '/sitemap.xml');
    res.type('text/plain').setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.send([
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin/',
        'Disallow: /api/',
        '',
        '# Explicitly allow major AI search and assistant crawlers to read public pages.',
        'User-agent: GPTBot',
        'Allow: /',
        'Disallow: /admin/',
        'Disallow: /api/',
        '',
        'User-agent: ChatGPT-User',
        'Allow: /',
        'Disallow: /admin/',
        'Disallow: /api/',
        '',
        'User-agent: ClaudeBot',
        'Allow: /',
        'Disallow: /admin/',
        'Disallow: /api/',
        '',
        'User-agent: PerplexityBot',
        'Allow: /',
        'Disallow: /admin/',
        'Disallow: /api/',
        '',
        `Sitemap: ${sitemapUrl}`,
        '',
    ].join('\n'));
});
app.get('/sitemap.xml', async (req, res) => {
    const siteUrl = getSiteUrl(req);
    const projects = await getProjects().catch((error) => {
        console.error('Error loading projects for sitemap:', error);
        return [];
    });
    const latestProjectUpdate = projects
        .map((project) => validDate(project.updatedAt))
        .filter((date) => date !== null)
        .sort((a, b) => b.getTime() - a.getTime())[0];
    const entries = [
        { path: '/', lastModified: latestProjectUpdate, priority: '1.0' },
        { path: '/projects', lastModified: latestProjectUpdate, priority: '0.9' },
        ...projects.map((project) => ({ path: `/projects/${project.slug}`, lastModified: validDate(project.updatedAt), priority: '0.8' })),
        { path: '/privacy', lastModified: null, priority: '0.2' },
    ];
    const urls = entries.map(({ path: pathname, lastModified, priority }) => {
        const lastmod = lastModified ? `\n    <lastmod>${lastModified.toISOString()}</lastmod>` : '';
        return `  <url>\n    <loc>${xmlEscape(absoluteUrl(siteUrl, pathname))}</loc>${lastmod}\n    <priority>${priority}</priority>\n  </url>`;
    }).join('\n');
    res.type('application/xml').setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
});
const llmsBodies = new Map();
const llmsRefreshInFlight = new Map();
const llmsRefreshedAt = new Map();
const llmsRefreshMs = 60000;
const llmsCacheControl = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';
function llmsCacheKey(siteUrl, full) {
    return `${full ? 'full' : 'summary'}:${siteUrl}`;
}
function fallbackLlmsMarkdown(siteUrl) {
    return buildLlmsMarkdown(siteUrl, {
        content: defaultSiteContent,
        projects: [],
        workExperiences: [],
        education: [],
        languages: [],
    }, false);
}
function buildLlmsMarkdown(siteUrl, data, full) {
    const projectLines = data.projects.map((project) => {
        const technologies = project.techUsed.length ? ` Technologies: ${project.techUsed.join(', ')}.` : '';
        const description = full ? ` ${project.description}` : '';
        return `- [${project.projectName}](${absoluteUrl(siteUrl, `/projects/${project.slug}`)}):${description}${technologies}`;
    });
    const experienceLines = full
        ? data.workExperiences.map((work) => `- ${work.role} at ${work.company} (${work.startDate}–${work.endDate})`)
        : [];
    return [
        '# Mohamed Aiman',
        '',
        '> Full-stack and backend developer in Malaysia building web applications, business systems, dashboards, and automation tools.',
        '',
        '## Canonical resources',
        '',
        `- [Portfolio](${absoluteUrl(siteUrl, '/')})`,
        `- [Projects index](${absoluteUrl(siteUrl, '/projects')})`,
        `- [Machine-readable portfolio](${absoluteUrl(siteUrl, '/portfolio.json')})`,
        `- [Resume](${absoluteUrl(siteUrl, data.content.resumePath)})`,
        '',
        '## Projects',
        '',
        ...(projectLines.length
            ? projectLines
            : [`- [Projects index](${absoluteUrl(siteUrl, '/projects')}): Full-stack and backend development projects.`]),
        ...(experienceLines.length ? ['', '## Experience', '', ...experienceLines] : []),
        '',
        '## Contact and profiles',
        '',
        `- [GitHub](${data.content.githubUrl})`,
        `- [LinkedIn](${data.content.linkedinUrl})`,
        `- [Email](mailto:${data.content.email})`,
        '',
        'Public portfolio content may be quoted with attribution to Mohamed Aiman and a link to the canonical page.',
        '',
    ].join('\n');
}
function maybeRefreshLlmsMarkdown(siteUrl, full) {
    const key = llmsCacheKey(siteUrl, full);
    const lastRefresh = llmsRefreshedAt.get(key) || 0;
    if (llmsBodies.has(key) && Date.now() - lastRefresh < llmsRefreshMs)
        return;
    const inFlight = llmsRefreshInFlight.get(key);
    if (inFlight)
        return;
    llmsRefreshedAt.set(key, Date.now());
    const refresh = loadPublicPortfolioData()
        .then((data) => {
        const body = buildLlmsMarkdown(siteUrl, data, full);
        llmsBodies.set(key, body);
        return body;
    })
        .catch((error) => {
        console.error('Error refreshing llms.txt:', error);
        return llmsBodies.get(key) || fallbackLlmsMarkdown(siteUrl);
    })
        .finally(() => {
        if (llmsRefreshInFlight.get(key) === refresh) {
            llmsRefreshInFlight.delete(key);
        }
    });
    llmsRefreshInFlight.set(key, refresh);
}
app.get(['/llms.txt', '/llms-full.txt', '/.well-known/llms.txt'], (req, res) => {
    const siteUrl = getSiteUrl(req);
    const full = req.path === '/llms-full.txt';
    const key = llmsCacheKey(siteUrl, full);
    maybeRefreshLlmsMarkdown(siteUrl, full);
    const body = llmsBodies.get(key) || fallbackLlmsMarkdown(siteUrl);
    res.type('text/plain').setHeader('Cache-Control', llmsCacheControl);
    res.send(body.endsWith('\n') ? body : `${body}\n`);
});
app.get('/portfolio.json', async (req, res) => {
    const siteUrl = getSiteUrl(req);
    const data = await loadPublicPortfolioData();
    const personId = `${absoluteUrl(siteUrl, '/')}#person`;
    res.type('application/json').setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    res.json({
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        '@id': `${absoluteUrl(siteUrl, '/')}#profile`,
        url: absoluteUrl(siteUrl, '/'),
        mainEntity: {
            '@type': 'Person',
            '@id': personId,
            name: 'Mohamed Aiman',
            alternateName: 'Darkguyaiman',
            identifier: 'darkguyaiman',
            description: homeDescription,
            jobTitle: 'Full-Stack and Backend Developer',
            email: `mailto:${data.content.email}`,
            sameAs: socialProfiles(data.content),
            knowsAbout: developerSkills,
            hasOccupation: {
                '@type': 'Occupation',
                name: 'Full-Stack and Backend Developer',
                occupationLocation: { '@type': 'Country', name: 'Malaysia' },
                skills: developerSkills.join(', '),
            },
        },
        projects: data.projects.map((project) => ({
            '@type': 'SoftwareSourceCode',
            '@id': `${absoluteUrl(siteUrl, `/projects/${project.slug}`)}#project`,
            name: project.projectName,
            description: project.description,
            url: absoluteUrl(siteUrl, `/projects/${project.slug}`),
            image: project.images?.map((image) => absoluteUrl(siteUrl, `/${image}`)) || [],
            keywords: project.techUsed,
            programmingLanguage: project.techUsed,
            author: { '@id': personId },
            codeRepository: project.githubLink,
            workExample: project.deployedLink,
            dateModified: validDate(project.updatedAt)?.toISOString(),
        })),
        workExperience: data.workExperiences,
        education: data.education,
        languages: data.languages,
    });
});
app.get('/', async (req, res) => {
    const siteUrl = getSiteUrl(req);
    const data = await loadPublicPortfolioData();
    const personId = `${absoluteUrl(siteUrl, '/')}#person`;
    const seo = createSeo(siteUrl, {
        title: 'Mohamed Aiman (Darkguyaiman) | Backend Developer',
        description: homeDescription,
        path: '/',
        type: 'profile',
        imageAlt: DEFAULT_SOCIAL_IMAGE_ALT,
        jsonLd: {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'WebSite',
                    '@id': `${absoluteUrl(siteUrl, '/')}#website`,
                    url: absoluteUrl(siteUrl, '/'),
                    name: 'Mohamed Aiman',
                    alternateName: ['Darkguyaiman', SITE_NAME],
                    description: homeDescription,
                    inLanguage: 'en-MY',
                    publisher: { '@id': personId },
                },
                {
                    '@type': 'ProfilePage',
                    '@id': `${absoluteUrl(siteUrl, '/')}#profile`,
                    url: absoluteUrl(siteUrl, '/'),
                    name: 'Mohamed Aiman – Developer Portfolio',
                    mainEntity: { '@id': personId },
                    isPartOf: { '@id': `${absoluteUrl(siteUrl, '/')}#website` },
                    description: homeDescription,
                    hasPart: data.projects.map((project) => ({
                        '@id': `${absoluteUrl(siteUrl, `/projects/${project.slug}`)}#project`,
                    })),
                },
                {
                    '@type': 'Person',
                    '@id': personId,
                    name: 'Mohamed Aiman',
                    alternateName: 'Darkguyaiman',
                    identifier: 'darkguyaiman',
                    url: absoluteUrl(siteUrl, '/'),
                    image: absoluteUrl(siteUrl, DEFAULT_SOCIAL_IMAGE),
                    jobTitle: 'Full-Stack and Backend Developer',
                    description: homeDescription,
                    email: `mailto:${data.content.email}`,
                    sameAs: socialProfiles(data.content),
                    knowsAbout: developerSkills,
                    hasOccupation: {
                        '@type': 'Occupation',
                        name: 'Full-Stack and Backend Developer',
                        occupationLocation: { '@type': 'Country', name: 'Malaysia' },
                        skills: developerSkills.join(', '),
                    },
                },
                ...data.projects.map((project) => ({
                    '@type': 'SoftwareSourceCode',
                    '@id': `${absoluteUrl(siteUrl, `/projects/${project.slug}`)}#project`,
                    name: project.projectName,
                    url: absoluteUrl(siteUrl, `/projects/${project.slug}`),
                    description: project.description,
                    programmingLanguage: project.techUsed,
                    author: { '@id': personId },
                })),
            ],
        },
    });
    res.render('public/index', { ...data, projects: data.projects.slice(0, 3), seo });
});
app.get('/projects', async (req, res) => {
    const siteUrl = getSiteUrl(req);
    const projects = await getProjects().catch((error) => {
        console.error('Error loading projects page:', error);
        return [];
    });
    const seo = createSeo(siteUrl, {
        title: 'Developer Portfolio & Web Projects | Mohamed Aiman',
        description: projectsDescription,
        path: '/projects',
        imageAlt: DEFAULT_SOCIAL_IMAGE_ALT,
        jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Web Development Projects by Mohamed Aiman',
            url: absoluteUrl(siteUrl, '/projects'),
            description: projectsDescription,
            about: { '@id': `${absoluteUrl(siteUrl, '/')}#person` },
            isPartOf: { '@id': `${absoluteUrl(siteUrl, '/')}#website` },
            mainEntity: {
                '@type': 'ItemList',
                numberOfItems: projects.length,
                itemListElement: projects.map((project, index) => ({
                    '@type': 'ListItem',
                    position: index + 1,
                    url: absoluteUrl(siteUrl, `/projects/${project.slug}`),
                    name: project.projectName,
                })),
            },
        },
    });
    res.render('public/projects', { projects, seo });
});
app.get('/privacy', (req, res) => {
    const siteUrl = getSiteUrl(req);
    const description = 'Privacy policy for Mohamed Aiman’s portfolio, including how site analytics, cookies, and contact information are handled.';
    const seo = createSeo(siteUrl, {
        title: 'Privacy Policy | Mohamed Aiman',
        description,
        path: '/privacy',
        imageAlt: DEFAULT_SOCIAL_IMAGE_ALT,
        jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Privacy Policy',
            url: absoluteUrl(siteUrl, '/privacy'),
            description,
            isPartOf: { '@type': 'WebSite', url: absoluteUrl(siteUrl, '/') },
        },
    });
    res.render('public/privacy', { seo });
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
    const siteUrl = getSiteUrl(req);
    const project = await getProjectBySlug(req.params.slug).catch(() => null);
    if (!project) {
        res.setHeader('Cache-Control', 'no-store');
        const seo = createSeo(siteUrl, {
            title: 'Project Not Found | Mohamed Aiman',
            description: 'The requested project could not be found. Explore Mohamed Aiman’s current web development portfolio.',
            path: `/projects/${req.params.slug}`,
            imageAlt: 'Mohamed Aiman portfolio',
            robots: 'noindex,follow',
            jsonLd: {
                '@context': 'https://schema.org',
                '@type': 'WebPage',
                name: 'Project Not Found',
                url: absoluteUrl(siteUrl, `/projects/${req.params.slug}`),
            },
        });
        return res.status(404).render('public/detail', { projectName: null, project: null, projectJson: 'null', seo });
    }
    const projectDescription = truncateDescription(project.description);
    const projectPath = `/projects/${project.slug}`;
    const projectImagePath = project.images?.[0] ? `/${project.images[0]}` : DEFAULT_SOCIAL_IMAGE;
    const seo = createSeo(siteUrl, {
        title: `${project.projectName} | Mohamed Aiman`,
        description: projectDescription,
        path: projectPath,
        image: projectImagePath,
        imageAlt: `${project.projectName} project preview`,
        type: 'article',
        tags: project.techUsed,
        jsonLd: {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'SoftwareSourceCode',
                    '@id': `${absoluteUrl(siteUrl, projectPath)}#project`,
                    name: project.projectName,
                    description: project.description,
                    url: absoluteUrl(siteUrl, projectPath),
                    image: project.images?.map((image) => absoluteUrl(siteUrl, `/${image}`)) || [],
                    keywords: project.techUsed,
                    programmingLanguage: project.techUsed,
                    author: { '@id': `${absoluteUrl(siteUrl, '/')}#person` },
                    creator: { '@id': `${absoluteUrl(siteUrl, '/')}#person` },
                    isPartOf: { '@id': `${absoluteUrl(siteUrl, '/')}#website` },
                    codeRepository: project.githubLink,
                    workExample: project.deployedLink,
                    dateModified: validDate(project.updatedAt)?.toISOString(),
                },
                {
                    '@type': 'BreadcrumbList',
                    itemListElement: [
                        { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl(siteUrl, '/') },
                        { '@type': 'ListItem', position: 2, name: 'Projects', item: absoluteUrl(siteUrl, '/projects') },
                        { '@type': 'ListItem', position: 3, name: project.projectName, item: absoluteUrl(siteUrl, projectPath) },
                    ],
                },
            ],
        },
    });
    res.render('public/detail', {
        projectName: project.projectName,
        project,
        projectJson: serializeJsonLd(project),
        seo,
    });
});
async function loadPublicPortfolioData() {
    const [content, projects, workExperiences, education, languages] = await Promise.all([
        getSiteContent(),
        getProjects().catch((error) => {
            console.error('Error loading public projects:', error);
            return [];
        }),
        getWorkExperiences().catch((error) => {
            console.error('Error loading public work experience:', error);
            return [];
        }),
        getEducation().catch((error) => {
            console.error('Error loading public education:', error);
            return { education: [] };
        }),
        getLanguages().catch((error) => {
            console.error('Error loading public languages:', error);
            return { languages: [] };
        }),
    ]);
    return {
        content,
        projects,
        workExperiences,
        education: education.education,
        languages: languages.languages,
    };
}
function createSeo(siteUrl, options) {
    const imagePath = options.image || DEFAULT_SOCIAL_IMAGE;
    const usingDefaultSocialImage = imagePath === DEFAULT_SOCIAL_IMAGE;
    return {
        siteUrl,
        title: options.title,
        description: truncateDescription(options.description),
        canonical: absoluteUrl(siteUrl, options.path),
        image: absoluteUrl(siteUrl, imagePath),
        imageAlt: options.imageAlt,
        imageWidth: usingDefaultSocialImage ? DEFAULT_SOCIAL_IMAGE_WIDTH : undefined,
        imageHeight: usingDefaultSocialImage ? DEFAULT_SOCIAL_IMAGE_HEIGHT : undefined,
        imageType: usingDefaultSocialImage ? DEFAULT_SOCIAL_IMAGE_TYPE : undefined,
        type: options.type || 'website',
        robots: options.robots || INDEX_ROBOTS,
        tags: options.tags,
        jsonLd: serializeJsonLd(options.jsonLd),
    };
}
function socialProfiles(content) {
    return [content.linkedinUrl, content.githubUrl, content.xUrl, content.instagramUrl, content.facebookUrl]
        .filter((url) => /^https?:\/\//i.test(url));
}
function validDate(value) {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}
app.listen(PORT, HOST, () => {
    console.log(`Serving static files from: ${publicRoots.join(', ')}`);
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log(`Tailscale MagicDNS: http://server1:${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
    void loadPublicPortfolioData().then(() => {
        console.log('Public portfolio cache warmed.');
        maybeRefreshLlmsMarkdown(DEFAULT_SITE_URL, false);
        maybeRefreshLlmsMarkdown(DEFAULT_SITE_URL, true);
    });
});
