import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid({
  title: 'CHATTA!',
  description: 'A simple WebRTC client for real-time messaging with threads and DMs',
  appearance: 'dark',
  lastUpdated: true,
  themeConfig: {
    nav: [{ text: 'Home', link: '/' }],
    sidebar: [
      {
        text: 'Guide',
        items: [{ text: 'Getting Started', link: '/getting-started' }],
      },
    ],
    search: { provider: 'local' },
  },
  mermaid: { theme: 'dark' },
})
