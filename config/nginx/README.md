# Nginx deployment

This configuration is intentionally HTTP-only. Add Certbot or another TLS setup later; do not add HSTS until HTTPS is working correctly.

Assumptions:

- Repository: `/var/www/my-portfolio`
- Node listens privately on `127.0.0.1:3000`
- Domain: `darkguyaiman.com` and `www.darkguyaiman.com`
- Debian/Ubuntu Nginx layout

Install it:

```bash
sudo install -d -o www-data -g www-data /var/cache/nginx/portfolio
sudo install -m 0644 config/nginx/security-headers.conf /etc/nginx/snippets/portfolio-security-headers.conf
sudo install -m 0644 config/nginx/portfolio.conf /etc/nginx/sites-available/portfolio.conf
sudo ln -s /etc/nginx/sites-available/portfolio.conf /etc/nginx/sites-enabled/portfolio.conf
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Set these application values on the server:

```env
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
SITE_URL=https://darkguyaiman.com
```

Keep the HTTPS `SITE_URL` when visitors use HTTPS through Cloudflare even though Nginx listens on port 80 at the origin. If the public site is temporarily HTTP-only, use `http://darkguyaiman.com` until TLS is enabled.

Nginx behavior:

- Static files are served directly from `public/`.
- Fingerprinted URLs and uniquely named CMS uploads are immutable for one year.
- Other static files cache for one day and can revalidate in the background.
- Anonymous public HTML is cached for one minute. Admin, API, authenticated, and non-GET traffic always bypasses that cache.
- Expired public HTML can be served from Nginx for up to seven inactive days when Node is temporarily unavailable.
- `/cache-version` is never cached, allowing the service worker to notice CMS updates and deployments.

After changing the configuration, always run `sudo nginx -t` before reloading. A reload is graceful and does not interrupt active connections.

To inspect HTML cache behavior:

```bash
curl -I http://127.0.0.1/ 
curl -I http://127.0.0.1/
```

The first response should contain `X-Portfolio-Cache: MISS`; the next should normally contain `X-Portfolio-Cache: HIT`.
