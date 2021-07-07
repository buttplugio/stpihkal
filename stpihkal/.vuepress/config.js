// .vuepress/config.js
let date = new Date().toJSON();
module.exports = {
  themeConfig: {
    sidebar: [
      "/",
      {
        title: "Protocols and Memory Layouts",
        collapsable: false,
        children: [
          "/hardware/erostek-et232.md",
          "/hardware/erostek-et312b.md",
          "/hardware/estim-systems-2b.md",
          "/hardware/f-machine.md",
          "/hardware/fleshlight-launch.md",
          "/hardware/kiiroo-onyx-pearl-1.md",
          "/hardware/kiiroo-onyx-2.md",
          "/hardware/lovense.md",
          "/hardware/mysteryvibe.md",
          "/hardware/nobra.md",
          "/hardware/oriori-ball.md",
          "/hardware/petrainer.md",
          "/hardware/petroom.md",
          "/hardware/sportdog-sd400.md",
          "/hardware/tcode.md",
          "/hardware/vibratissimo.md",
          "/hardware/vorze-sa.md",
        ]
      },
      {
        title: "Firmware and Bootloaders",
        collapsable: false,
        children: [
          "/firmware/kiiroo.md"
        ]
      },
      {
        title: "Network Protocols",
        collapsable: false,
        children: [
          "/network/kiiroo-platform-server.md"
        ]
      },
      {
        title: "Video Encoding Formats",
        collapsable: false,
        children: [
          "/video-encoding-formats/feelme.md",
          "/video-encoding-formats/funscript.md",
          "/video-encoding-formats/kiiroo.md",
          "/video-encoding-formats/realtouch.md",
          "/video-encoding-formats/virtualrealplayer.md",
          "/video-encoding-formats/vorze-interactive.md",
        ]
      },
    ],
    repo: 'buttplugio/stpihkal',
  },
  plugins: [
    [
      "vuepress-plugin-matomo",
      {
        'siteId': 8,
        'trackerUrl': "https://matomo.nonpolynomial.com/"
      }
    ],
    "@vuepress/plugin-back-to-top"
  ],
  evergreen: true,
  title: "STPIHKAL: Sex Toy Protocols I Have Known And Loved",
  description: "Documentation of sex toy and intimate hardware control protocols, firmware details, file formats, and other proprietary specifications.",
  head: [
    ['link', { rel: 'icon', href: '/buttplug.svg' }],
    ["meta", {property: "og:type", content:"website"}],
    ["meta", {property: "og:title", content:"STPIHKAL: Sex Toy Protocols I Have Known And Loved"}],
    ["meta", {property: "og:url", content:"https://stpihkal.docs.buttplug.io"}],
    ["meta", {property: "og:site_name", content:"STPIHKAL: Sex Toy Protocols I Have Known And Loved"}],
    ["meta", {property: "og:description", content:"Documentation of sex toy and intimate hardware control protocols, firmware details, file formats, and other proprietary specifications."}],
    ["meta", {property: "og:locale", content:"default"}],
    ["meta", {property: "og:image", content:"https://stpihkal.docs.buttplug.io/buttplug-logo-opengraph.png"}],
    ["meta", {property: "og:updated_time", content:date}],
    ["meta", {name:"twitter:card", content:"summary"}],
    ["meta", {name:"twitter:title", content:"STPIHKAL: Sex Toy Protocols I Have Known And Loved"}],
    ["meta", {name:"twitter:description", content:"Documentation of sex toy and intimate hardware control protocols, firmware details, file formats, and other proprietary specifications."}],
    ["meta", {name:"twitter:image", content:"https://stpihkal.docs.buttplug.io/buttplug-logo-opengraph.png"}],
    ["meta", {name:"twitter:creator", content:"@buttplugio"}],
  ]
};
