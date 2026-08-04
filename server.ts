import compression from 'compression';
import express, { Request, Response } from 'express';
import { Eta } from 'eta';
import fs from 'fs';
import path from 'path';
import adminRoutes from './routes/adminRoutes.js';
import educationRoutes from './routes/educationRoutes.js';
import languageRoutes from './routes/languageRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import workRoutes from './routes/workRoutes.js';
import { getSiteContent, type SiteContent } from './models/adminModel.js';
import { getEducation } from './models/educationModel.js';
import { getLanguages } from './models/languageModel.js';
import { getProjectByName, getProjectBySlug, getProjects, type Project } from './models/projectModel.js';
import { getWorkExperiences } from './models/workModel.js';
import {
  absoluteUrl,
  DEFAULT_SOCIAL_IMAGE,
  DEFAULT_SOCIAL_IMAGE_ALT,
  DEFAULT_SOCIAL_IMAGE_HEIGHT,
  DEFAULT_SOCIAL_IMAGE_TYPE,
  DEFAULT_SOCIAL_IMAGE_WIDTH,
  getSiteUrl,
  INDEX_ROBOTS,
  serializeJsonLd,
  SITE_NAME,
  truncateDescription,
  xmlEscape,
  type SeoData,
} from './utils/seo.js';

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
const homeDescription = 'Portfolio of Mohamed Aiman, a full-stack and backend developer in Malaysia building web applications, business systems, and automation tools.';
const projectsDescription = 'Explore web applications, business systems, dashboards, and automation projects built by Mohamed Aiman with Node.js, TypeScript, MySQL, and modern web technologies.';

interface PublicPortfolioData {
  content: SiteContent;
  projects: Project[];
  workExperiences: Awaited<ReturnType<typeof getWorkExperiences>>;
  education: Awaited<ReturnType<typeof getEducation>>['education'];
  languages: Awaited<ReturnType<typeof getLanguages>>['languages'];
}

// Gzip/Brotli-capable responses for HTML, JSON, CSS, JS, and other compressible types.
app.use(compression({
  threshold: 1024,
  level: 6,
}));

// Linux is case-sensitive: git may have `Public/` while builds write to `public/`.
function resolvePublicRoots(root: string): string[] {
  const candidates = [path.join(root, 'public'), path.join(root, 'Public')];
  const seen = new Set<string>();
  const dirs: string[] = [];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    const resolved = fs.realpathSync(candidate);
    const key = process.platform === 'win32' ? resolved.toLowerCase() : resolved;
    if (seen.has(key)) continue;
    seen.add(key);
    dirs.push(resolved);
  }

  return dirs.length > 0 ? dirs : [path.join(root, 'public')];
}

const publicRoots = resolvePublicRoots(appRoot);
const publicRoot = publicRoots[0];
const publicAssetExists = (relativePath: string) => publicRoots.some((root) => fs.existsSync(path.join(root, relativePath)));
const publicAssetRoot = (relativePath: string) => publicRoots.find((root) => fs.existsSync(path.join(root, relativePath))) || null;

const setStaticCacheHeaders = (res: Response, filePath: string) => {
  if (cachedAssetPattern.test(filePath)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
};

app.engine('eta', (filePath, options, callback) => {
  try {
    const templatePath = path.relative(viewsRoot, filePath);
    callback(null, eta.render(templatePath, options));
  } catch (error) {
    callback(error as Error);
  }
});
app.set('view engine', 'eta');
app.set('views', viewsRoot);
app.set('view cache', templateCacheEnabled);
app.locals.assetVersion = assetVersion;
app.locals.formatMonthYear = (value: string) => {
  if (value.toLowerCase() === 'present') return 'Present';
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return value;
  return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, 1)));
};
app.locals.institutionLogo = (name: string) => ({
  'International Modern Arabic School': 'education-institutions/Imas.webp',
  'Malaysia University of Science and Technology': 'education-institutions/MUST.webp',
  IMAS: 'education-institutions/Imas.webp',
  MUST: 'education-institutions/MUST.webp',
}[name] || null);
app.locals.projectThumbnail = (assetPath: string) => {
  const normalized = String(assetPath || '').replace(/^\/+/, '').replace(/\\/g, '/').replace(/^public\//i, '');
  const lowerPath = normalized.toLowerCase();
  const candidate = lowerPath.startsWith('projects/')
    ? `projects/thumbnails/${path.parse(path.basename(normalized)).name}.webp`
    : lowerPath.startsWith('uploads/images/') && !lowerPath.startsWith('uploads/images/thumbnails/')
      ? `${path.dirname(normalized).replace(/\\/g, '/')}/thumbnails/${path.parse(path.basename(normalized)).name}.webp`
      : null;
  if (!candidate) return normalized;
  return publicAssetExists(candidate) ? candidate : normalized;
};
interface ProjectImageSource {
  src: string;
  srcset: string | null;
  sizes: string;
  width: number | null;
  height: number | null;
}
interface ProjectImageMetadata {
  src: string;
  width: number;
  height: number;
  sources: Array<{ path: string; width: number }>;
}
const projectImageMetadataCache = new Map<string, ProjectImageSource>();
app.locals.projectImageSources = (assetPath: string): ProjectImageSource => {
  const normalized = String(assetPath || '').replace(/^\/+/, '').replace(/\\/g, '/').replace(/^public\//i, '');
  const cached = projectImageMetadataCache.get(normalized);
  if (cached) return cached;

  const baseDirectory = path.dirname(normalized).replace(/\\/g, '/');
  const basename = path.parse(path.basename(normalized)).name;
  const metadataRelativePath = path.join(baseDirectory, 'detail', `${basename}.json`);
  const metadataRoot = publicAssetRoot(metadataRelativePath);
  const metadataPath = metadataRoot ? path.join(metadataRoot, metadataRelativePath) : '';
  const fallback: ProjectImageSource = {
    src: normalized,
    srcset: null,
    sizes: '(max-width: 480px) calc(100vw - 32px), (max-width: 900px) calc(100vw - 40px), (max-width: 1200px) calc(50vw - 48px), 560px',
    width: null,
    height: null,
  };

  try {
    if (!metadataPath) return fallback;
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8')) as ProjectImageMetadata;
    const source: ProjectImageSource = {
      src: `${baseDirectory}/${metadata.src}`,
      srcset: metadata.sources.map((item) => `/${baseDirectory}/${item.path} ${item.width}w`).join(', '),
      sizes: fallback.sizes,
      width: metadata.width,
      height: metadata.height,
    };
    projectImageMetadataCache.set(normalized, source);
    return source;
  } catch {
    return fallback;
  }
};
app.locals.optimizedAsset = (assetPath: string, width: number) => {
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
  if (!directory) return normalized;
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
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
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
  if (!isPublicDuplicate) return next();

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

app.get('/robots.txt', (req: Request, res: Response) => {
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

app.get('/sitemap.xml', async (req: Request, res: Response) => {
  const siteUrl = getSiteUrl(req);
  const projects = await getProjects().catch((error) => {
    console.error('Error loading projects for sitemap:', error);
    return [];
  });
  const latestProjectUpdate = projects
    .map((project) => validDate(project.updatedAt))
    .filter((date): date is Date => date !== null)
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

app.get(['/llms.txt', '/llms-full.txt'], async (req: Request, res: Response) => {
  const siteUrl = getSiteUrl(req);
  const data = await loadPublicPortfolioData();
  const full = req.path === '/llms-full.txt';
  const projectLines = data.projects.map((project) => {
    const technologies = project.techUsed.length ? ` Technologies: ${project.techUsed.join(', ')}.` : '';
    const description = full ? ` ${project.description}` : '';
    return `- [${project.projectName}](${absoluteUrl(siteUrl, `/projects/${project.slug}`)}):${description}${technologies}`;
  });
  const experienceLines = full
    ? data.workExperiences.map((work) => `- ${work.role} at ${work.company} (${work.startDate}–${work.endDate})`)
    : [];

  res.type('text/plain').setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
  res.send([
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
    ...projectLines,
    ...(experienceLines.length ? ['', '## Experience', '', ...experienceLines] : []),
    '',
    '## Contact and profiles',
    '',
    `- GitHub: ${data.content.githubUrl}`,
    `- LinkedIn: ${data.content.linkedinUrl}`,
    `- Email: mailto:${data.content.email}`,
    '',
    'Public portfolio content may be quoted with attribution to Mohamed Aiman and a link to the canonical page.',
    '',
  ].join('\n'));
});

app.get('/.well-known/llms.txt', (_req: Request, res: Response) => {
  res.redirect(308, '/llms.txt');
});

app.get('/portfolio.json', async (req: Request, res: Response) => {
  const siteUrl = getSiteUrl(req);
  const data = await loadPublicPortfolioData();
  res.type('application/json').setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
  res.json({
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: absoluteUrl(siteUrl, '/'),
    mainEntity: {
      '@type': 'Person',
      name: 'Mohamed Aiman',
      jobTitle: 'Full-Stack and Backend Developer',
      email: `mailto:${data.content.email}`,
      sameAs: socialProfiles(data.content),
      knowsAbout: ['TypeScript', 'Node.js', 'Express.js', 'MySQL', 'Next.js', 'React', 'Google Apps Script'],
    },
    projects: data.projects.map((project) => ({
      '@type': 'CreativeWork',
      name: project.projectName,
      description: project.description,
      url: absoluteUrl(siteUrl, `/projects/${project.slug}`),
      image: project.images?.map((image) => absoluteUrl(siteUrl, `/${image}`)) || [],
      keywords: project.techUsed,
      codeRepository: project.githubLink,
      workExample: project.deployedLink,
      dateModified: validDate(project.updatedAt)?.toISOString(),
    })),
    workExperience: data.workExperiences,
    education: data.education,
    languages: data.languages,
  });
});

app.get('/', async (req: Request, res: Response) => {
  const siteUrl = getSiteUrl(req);
  const data = await loadPublicPortfolioData();
  const personId = `${absoluteUrl(siteUrl, '/')}#person`;
  const seo = createSeo(siteUrl, {
    title: 'Mohamed Aiman | Full-Stack & Backend Developer in Malaysia',
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
          name: SITE_NAME,
          inLanguage: 'en',
          publisher: { '@id': personId },
        },
        {
          '@type': 'ProfilePage',
          '@id': `${absoluteUrl(siteUrl, '/')}#profile`,
          url: absoluteUrl(siteUrl, '/'),
          name: 'Mohamed Aiman – Developer Portfolio',
          mainEntity: { '@id': personId },
          isPartOf: { '@id': `${absoluteUrl(siteUrl, '/')}#website` },
        },
        {
          '@type': 'Person',
          '@id': personId,
          name: 'Mohamed Aiman',
          alternateName: 'Darkguyaiman',
          url: absoluteUrl(siteUrl, '/'),
          image: absoluteUrl(siteUrl, DEFAULT_SOCIAL_IMAGE),
          jobTitle: 'Full-Stack and Backend Developer',
          email: `mailto:${data.content.email}`,
          sameAs: socialProfiles(data.content),
          knowsAbout: ['TypeScript', 'Node.js', 'Express.js', 'MySQL', 'Next.js', 'React', 'Google Apps Script', 'Web application development'],
        },
      ],
    },
  });

  res.render('public/index', { ...data, projects: data.projects.slice(0, 3), seo });
});

app.get('/projects', async (req: Request, res: Response) => {
  const siteUrl = getSiteUrl(req);
  const projects = await getProjects().catch((error) => {
    console.error('Error loading projects page:', error);
    return [];
  });
  const seo = createSeo(siteUrl, {
    title: 'Web Development Projects | Mohamed Aiman',
    description: projectsDescription,
    path: '/projects',
    imageAlt: DEFAULT_SOCIAL_IMAGE_ALT,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Web Development Projects by Mohamed Aiman',
      url: absoluteUrl(siteUrl, '/projects'),
      description: projectsDescription,
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

app.get('/privacy', (req: Request, res: Response) => {
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

app.get('/projects/detail', async (req: Request, res: Response) => {
  const projectName = req.query.project as string | undefined;
  const project = projectName ? await getProjectByName(projectName).catch(() => null) : null;

  if (project) {
    return res.redirect(301, `/projects/${project.slug}`);
  }

  res.redirect(302, '/projects');
});

app.get('/projects/:slug', async (req: Request, res: Response) => {
  const siteUrl = getSiteUrl(req);
  const project = await getProjectBySlug(req.params.slug).catch(() => null);

  if (!project) {
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
          '@type': 'CreativeWork',
          '@id': `${absoluteUrl(siteUrl, projectPath)}#project`,
          name: project.projectName,
          description: project.description,
          url: absoluteUrl(siteUrl, projectPath),
          image: project.images?.map((image) => absoluteUrl(siteUrl, `/${image}`)) || [],
          keywords: project.techUsed.join(', '),
          creator: { '@type': 'Person', name: 'Mohamed Aiman', url: absoluteUrl(siteUrl, '/') },
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

async function loadPublicPortfolioData(): Promise<PublicPortfolioData> {
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

function createSeo(siteUrl: string, options: {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt: string;
  type?: SeoData['type'];
  robots?: string;
  tags?: string[];
  jsonLd: unknown;
}): SeoData {
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

function socialProfiles(content: SiteContent): string[] {
  return [content.linkedinUrl, content.githubUrl, content.xUrl, content.instagramUrl, content.facebookUrl]
    .filter((url) => /^https?:\/\//i.test(url));
}

function validDate(value: Date): Date | null {
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
  });
});
