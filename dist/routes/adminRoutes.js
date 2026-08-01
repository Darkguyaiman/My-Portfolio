import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import { createEducation, createLanguage, createProject, createWork, deleteEducation, deleteLanguage, deleteProject, deleteWork, getAdminEducation, getAdminLanguage, getAdminProject, getAdminWork, getDashboardStats, getNextEducationDisplayOrder, getNextLanguageDisplayOrder, getNextProjectDisplayOrder, getNextWorkDisplayOrder, getSiteContent, listAdminEducation, listAdminLanguages, listAdminProjects, listAdminWork, reorderEducation, reorderLanguages, reorderProjects, reorderWork, saveSiteContent, updateEducation, updateLanguage, updateProject, updateWork, } from '../models/adminModel.js';
const router = Router();
const cookieName = 'portfolio_cms';
const uploadRoot = path.join(process.cwd(), 'public', 'uploads');
const upload = multer({
    storage: multer.diskStorage({
        destination: (_req, file, callback) => {
            const folder = file.fieldname === 'resumeFile' ? 'documents' : 'images';
            const destination = path.join(uploadRoot, folder);
            fs.mkdirSync(destination, { recursive: true });
            callback(null, destination);
        },
        filename: (_req, file, callback) => {
            const extension = path.extname(file.originalname).toLowerCase();
            const basename = path.basename(file.originalname, extension).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'upload';
            callback(null, `${Date.now()}-${basename}${extension}`);
        },
    }),
    limits: {
        fileSize: 12 * 1024 * 1024,
        files: 12,
    },
    fileFilter: (_req, file, callback) => {
        const allowedTypes = new Set([
            'image/avif',
            'image/gif',
            'image/jpeg',
            'image/png',
            'image/svg+xml',
            'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]);
        callback(null, allowedTypes.has(file.mimetype));
    },
});
const cmsUploads = upload.fields([
    { name: 'projectImages', maxCount: 10 },
    { name: 'resumeFile', maxCount: 1 },
    { name: 'workLogo', maxCount: 1 },
]);
router.get('/login', (req, res) => {
    if (isAuthenticated(req))
        return res.redirect('/admin');
    res.render('admin/login', { error: req.query.error === '1' });
});
router.post('/login', (req, res) => {
    const username = String(req.body.username || '');
    const password = String(req.body.password || '');
    if (!getCmsPassword() || !getCmsUsername()) {
        return res.render('admin/login', {
            error: true,
            setupMessage: 'Set CMS_USERNAME and CMS_PASSWORD in your .env file before using the CMS.',
        });
    }
    if (username !== getCmsUsername() || password !== getCmsPassword()) {
        return res.redirect('/admin/login?error=1');
    }
    res.setHeader('Set-Cookie', `${cookieName}=${signSession()}; HttpOnly; SameSite=Lax; Path=/admin; Max-Age=86400`);
    res.redirect('/admin');
});
router.post('/logout', (_req, res) => {
    res.setHeader('Set-Cookie', `${cookieName}=; HttpOnly; SameSite=Lax; Path=/admin; Max-Age=0`);
    res.redirect('/admin/login');
});
router.use(requireAuth);
router.get('/', async (_req, res, next) => {
    try {
        res.render('admin/dashboard', {
            active: 'dashboard',
            stats: await getDashboardStats(),
            message: null,
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/content', async (_req, res, next) => {
    try {
        res.render('admin/content', {
            active: 'content',
            content: await getSiteContent(),
            message: null,
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/content', cmsUploads, async (req, res, next) => {
    try {
        await saveSiteContent(parseSiteContent(req.body, getUploadedPaths(req)));
        res.render('admin/content', {
            active: 'content',
            content: await getSiteContent(),
            message: 'Homepage content saved.',
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/projects', async (_req, res, next) => {
    try {
        res.render('admin/projects', {
            active: 'projects',
            projects: await listAdminProjects(),
            message: null,
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/projects/new', (_req, res) => {
    res.render('admin/project-form', {
        active: 'projects',
        project: emptyProject(),
        action: '/admin/projects',
        title: 'New Project',
    });
});
router.post('/projects', cmsUploads, async (req, res, next) => {
    try {
        const id = await createProject({
            ...parseProject(req.body, getUploadedPaths(req)),
            displayOrder: await getNextProjectDisplayOrder(),
        });
        res.redirect(`/admin/projects/${id}/edit`);
    }
    catch (error) {
        next(error);
    }
});
router.post('/projects/reorder', async (req, res, next) => {
    try {
        await reorderProjects(parseReorderIds(req.body));
        res.json({ ok: true });
    }
    catch (error) {
        next(error);
    }
});
router.get('/projects/:id/edit', async (req, res, next) => {
    try {
        const project = await getAdminProject(Number(req.params.id));
        if (!project)
            return res.redirect('/admin/projects');
        res.render('admin/project-form', {
            active: 'projects',
            project,
            action: `/admin/projects/${project.id}`,
            title: 'Edit Project',
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/projects/:id', cmsUploads, async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const existing = await getAdminProject(id);
        if (!existing)
            return res.redirect('/admin/projects');
        await updateProject(id, {
            ...parseProject(req.body, getUploadedPaths(req)),
            displayOrder: existing.displayOrder,
        });
        res.redirect('/admin/projects');
    }
    catch (error) {
        next(error);
    }
});
router.post('/projects/:id/delete', async (req, res, next) => {
    try {
        await deleteProject(Number(req.params.id));
        res.redirect('/admin/projects');
    }
    catch (error) {
        next(error);
    }
});
router.get('/work', async (_req, res, next) => {
    try {
        res.render('admin/work', { active: 'work', rows: await listAdminWork() });
    }
    catch (error) {
        next(error);
    }
});
router.get('/work/new', (_req, res) => {
    res.render('admin/work-form', { active: 'work', work: emptyWork(), action: '/admin/work', title: 'New Work Item' });
});
router.post('/work', cmsUploads, async (req, res, next) => {
    try {
        const id = await createWork({
            ...parseWork(req.body, getUploadedPaths(req)),
            displayOrder: await getNextWorkDisplayOrder(),
        });
        res.redirect(`/admin/work/${id}/edit`);
    }
    catch (error) {
        next(error);
    }
});
router.post('/work/reorder', async (req, res, next) => {
    try {
        await reorderWork(parseReorderIds(req.body));
        res.json({ ok: true });
    }
    catch (error) {
        next(error);
    }
});
router.get('/work/:id/edit', async (req, res, next) => {
    try {
        const work = await getAdminWork(Number(req.params.id));
        if (!work)
            return res.redirect('/admin/work');
        res.render('admin/work-form', { active: 'work', work, action: `/admin/work/${work.id}`, title: 'Edit Work Item' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/work/:id', cmsUploads, async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const existing = await getAdminWork(id);
        if (!existing)
            return res.redirect('/admin/work');
        const parsed = parseWork(req.body, getUploadedPaths(req));
        await updateWork(id, {
            ...parsed,
            logo: parsed.logo ?? existing.logo,
            displayOrder: existing.displayOrder,
        });
        res.redirect('/admin/work');
    }
    catch (error) {
        next(error);
    }
});
router.post('/work/:id/delete', async (req, res, next) => {
    try {
        await deleteWork(Number(req.params.id));
        res.redirect('/admin/work');
    }
    catch (error) {
        next(error);
    }
});
router.get('/education', async (_req, res, next) => {
    try {
        res.render('admin/education', { active: 'education', rows: await listAdminEducation() });
    }
    catch (error) {
        next(error);
    }
});
router.get('/education/new', (_req, res) => {
    res.render('admin/education-form', { active: 'education', education: emptyEducation(), action: '/admin/education', title: 'New Education' });
});
router.post('/education', async (req, res, next) => {
    try {
        const id = await createEducation({
            ...parseEducation(req.body),
            displayOrder: await getNextEducationDisplayOrder(),
        });
        res.redirect(`/admin/education/${id}/edit`);
    }
    catch (error) {
        next(error);
    }
});
router.post('/education/reorder', async (req, res, next) => {
    try {
        await reorderEducation(parseReorderIds(req.body));
        res.json({ ok: true });
    }
    catch (error) {
        next(error);
    }
});
router.get('/education/:id/edit', async (req, res, next) => {
    try {
        const education = await getAdminEducation(Number(req.params.id));
        if (!education)
            return res.redirect('/admin/education');
        res.render('admin/education-form', { active: 'education', education, action: `/admin/education/${education.id}`, title: 'Edit Education' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/education/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const existing = await getAdminEducation(id);
        if (!existing)
            return res.redirect('/admin/education');
        await updateEducation(id, {
            ...parseEducation(req.body),
            displayOrder: existing.displayOrder,
        });
        res.redirect('/admin/education');
    }
    catch (error) {
        next(error);
    }
});
router.post('/education/:id/delete', async (req, res, next) => {
    try {
        await deleteEducation(Number(req.params.id));
        res.redirect('/admin/education');
    }
    catch (error) {
        next(error);
    }
});
router.get('/languages', async (_req, res, next) => {
    try {
        res.render('admin/languages', { active: 'languages', rows: await listAdminLanguages() });
    }
    catch (error) {
        next(error);
    }
});
router.get('/languages/new', (_req, res) => {
    res.render('admin/language-form', { active: 'languages', language: emptyLanguage(), action: '/admin/languages', title: 'New Language' });
});
router.post('/languages', async (req, res, next) => {
    try {
        const id = await createLanguage({
            ...parseLanguage(req.body),
            displayOrder: await getNextLanguageDisplayOrder(),
        });
        res.redirect(`/admin/languages/${id}/edit`);
    }
    catch (error) {
        next(error);
    }
});
router.post('/languages/reorder', async (req, res, next) => {
    try {
        await reorderLanguages(parseReorderIds(req.body));
        res.json({ ok: true });
    }
    catch (error) {
        next(error);
    }
});
router.get('/languages/:id/edit', async (req, res, next) => {
    try {
        const language = await getAdminLanguage(Number(req.params.id));
        if (!language)
            return res.redirect('/admin/languages');
        res.render('admin/language-form', { active: 'languages', language, action: `/admin/languages/${language.id}`, title: 'Edit Language' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/languages/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const existing = await getAdminLanguage(id);
        if (!existing)
            return res.redirect('/admin/languages');
        await updateLanguage(id, {
            ...parseLanguage(req.body),
            displayOrder: existing.display_order,
        });
        res.redirect('/admin/languages');
    }
    catch (error) {
        next(error);
    }
});
router.post('/languages/:id/delete', async (req, res, next) => {
    try {
        await deleteLanguage(Number(req.params.id));
        res.redirect('/admin/languages');
    }
    catch (error) {
        next(error);
    }
});
router.use((error, _req, res, _next) => {
    console.error('CMS error:', error);
    res.status(500).render('admin/error', {
        active: '',
        error,
    });
});
function requireAuth(req, res, next) {
    if (isAuthenticated(req))
        return next();
    res.redirect('/admin/login');
}
function isAuthenticated(req) {
    const session = getCookie(req, cookieName);
    if (!session)
        return false;
    const expected = signSession();
    const sessionBuffer = Buffer.from(session);
    const expectedBuffer = Buffer.from(expected);
    return sessionBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(sessionBuffer, expectedBuffer);
}
function getCmsPassword() {
    return process.env.CMS_PASSWORD || '';
}
function getCmsUsername() {
    return process.env.CMS_USERNAME || '';
}
function signSession() {
    const secret = getCmsPassword() || 'portfolio-cms-unconfigured';
    return crypto.createHmac('sha256', secret).update('portfolio-cms-session').digest('hex');
}
function getCookie(req, name) {
    const cookies = req.headers.cookie?.split(';') || [];
    const cookie = cookies.find((item) => item.trim().startsWith(`${name}=`));
    return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : null;
}
function textLines(value) {
    return String(value || '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
}
function nullable(value) {
    const text = String(value || '').trim();
    return text || null;
}
function parseReorderIds(body) {
    return Array.isArray(body.ids)
        ? body.ids.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0)
        : [];
}
function parseProject(body, uploads = {}) {
    const images = [...textLines(body.images), ...(uploads.projectImages || [])];
    return {
        projectName: String(body.projectName || '').trim(),
        description: String(body.description || '').trim(),
        deployedLink: nullable(body.deployedLink),
        githubLink: nullable(body.githubLink),
        technologies: textLines(body.technologies),
        images,
    };
}
function parseWork(body, uploads = {}) {
    return {
        company: String(body.company || '').trim(),
        role: String(body.role || '').trim(),
        startDate: String(body.startDate || '').trim(),
        endDate: String(body.endDate || '').trim(),
        logo: uploads.workLogo?.[0] || nullable(body.logo),
        descriptions: textLines(body.descriptions),
    };
}
function parseEducation(body) {
    return {
        qualification: String(body.qualification || '').trim(),
        institution: String(body.institution || '').trim(),
        field: String(body.field || '').trim(),
        durationStart: String(body.durationStart || '').trim(),
        durationEnd: String(body.durationEnd || '').trim(),
        results: buildEducationResults(body),
        description: String(body.description || '').trim(),
    };
}
function buildEducationResults(body) {
    const semester = numberField(body.semester);
    const gpa = numberField(body.gpa);
    const totalSubjects = numberField(body.totalSubjects);
    const grades = {
        'A*': numberField(body.gradeAStar),
        A: numberField(body.gradeA),
        B: numberField(body.gradeB),
        C: numberField(body.gradeC),
        D: numberField(body.gradeD),
        F: numberField(body.gradeF),
    };
    const filteredGrades = Object.fromEntries(Object.entries(grades).filter(([, value]) => value !== null));
    const results = {};
    if (semester !== null)
        results.semester = semester;
    if (gpa !== null)
        results.gpa = gpa;
    if (totalSubjects !== null || Object.keys(filteredGrades).length > 0) {
        results.total_subjects = totalSubjects ?? Object.values(filteredGrades).reduce((total, count) => total + Number(count), 0);
        results.grades = filteredGrades;
    }
    return JSON.stringify(results);
}
function numberField(value) {
    const text = String(value ?? '').trim();
    if (!text)
        return null;
    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : null;
}
function parseLanguage(body) {
    return {
        name: String(body.name || '').trim(),
        level: String(body.level || '').trim(),
    };
}
function parseSiteContent(body, uploads = {}) {
    return {
        heroTitlePrefix: String(body.heroTitlePrefix || '').trim(),
        heroName: String(body.heroName || '').trim(),
        heroSubtitle: String(body.heroSubtitle || '').trim(),
        heroDescription: String(body.heroDescription || '').trim(),
        resumePath: uploads.resumeFile?.[0] || String(body.resumePath || '').trim(),
        contactText: String(body.contactText || '').trim(),
        linkedinUrl: String(body.linkedinUrl || '').trim(),
        githubUrl: String(body.githubUrl || '').trim(),
        xUrl: String(body.xUrl || '').trim(),
        instagramUrl: String(body.instagramUrl || '').trim(),
        facebookUrl: String(body.facebookUrl || '').trim(),
        email: String(body.email || '').trim(),
    };
}
function getUploadedPaths(req) {
    const files = req.files;
    if (!files)
        return {};
    return Object.fromEntries(Object.entries(files).map(([field, fieldFiles]) => [
        field,
        fieldFiles.map((file) => `/${path.relative(path.join(process.cwd(), 'public'), file.path).replace(/\\/g, '/')}`),
    ]));
}
function emptyProject() {
    return { id: null, projectName: '', description: '', deployedLink: '', githubLink: '', displayOrder: 0, technologies: [], images: [] };
}
function emptyWork() {
    return { id: null, company: '', role: '', startDate: '', endDate: 'present', logo: '', displayOrder: 0, descriptions: [] };
}
function emptyEducation() {
    return { id: null, qualification: '', institution: '', field: '', durationStart: '', durationEnd: '', results: '{}', resultFields: {}, description: '', displayOrder: 0 };
}
function emptyLanguage() {
    return { id: null, name: '', level: '', displayOrder: 0 };
}
export default router;
