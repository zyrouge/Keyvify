const { description } = require('../../package')
const fs = require('fs')
const getChildren = (folder) => [
  '',
  ...fs
    .readdirSync(`${__dirname}/../${folder}`)
    .filter(f => f.endsWith(".md") && f.toLowerCase() !== "readme.md")
    .map(f => f.replace(".md", ""))
]

module.exports = {
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#title
   */
  title: 'Keyvify',
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#description
   */
  description: description,

  /**
   * Extra tags to be injected to the page HTML `<head>`
   *
   * ref：https://v1.vuepress.vuejs.org/config/#head
   */
  head: [
    ['meta', { name: 'theme-color', content: '#53B3CB' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }]
  ],

  /**
   * Theme configuration, here is the default theme configuration for VuePress.
   *
   * ref：https://v1.vuepress.vuejs.org/theme/default-theme-config.html
   */
  themeConfig: {
    repo: '',
    editLinks: false,
    docsDir: '',
    editLinkText: '',
    lastUpdated: false,
    nav: [
      {
        text: 'Guide',
        link: '/guide/',
      },
      {
        text: 'Documentation',
        link: '/docs/',
        target: '_blank'
      },
      {
        text: 'Examples',
        link: '/examples/',
      },
      {
        text: 'NPM',
        link: 'https://npmjs.com/package/keyvify'
      },
      {
        text: 'GitHub',
        link: 'https://github.com/zyrouge/keyvify'
      }
    ],
    sidebar: {
      '/guide/': [
        {
          title: 'Guide',
          collapsable: false,
          children: getChildren("guide")
        }
      ],
      '/examples/': [
        {
          title: 'Examples',
          collapsable: false,
          children: getChildren("examples")
        }
      ],
    }
  },

  /**
   * Apply plugins，ref：https://v1.vuepress.vuejs.org/zh/plugin/
   */
  plugins: [
    '@vuepress/plugin-back-to-top',
    '@vuepress/plugin-medium-zoom',
  ]
}
