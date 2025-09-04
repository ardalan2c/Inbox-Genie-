export default async function sitemap() {
  const base = 'https://inboxgenie.app'
  const routes = ['', '/pricing', '/docs', '/blog', '/case-studies', '/security'].map((r) => ({ url: base + r, lastModified: new Date() }))
  return routes
}

