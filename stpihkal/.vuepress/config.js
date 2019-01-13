// .vuepress/config.js
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
          "/hardware/fleshlight-launch.md",
          "/hardware/kiiroo-onyx-pearl-1.md",
          "/hardware/kiiroo-onyx-2.md",
          "/hardware/lovense.md",
          "/hardware/mysteryvibe.md",
          "/hardware/petrainer.md",
          "/hardware/petroom.md",
          "/hardware/sportdog-sd400.md",
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
  },
  plugins: [
    [
      "stpihkal/.vuepress/plugin-matomo",
      {
        'siteId': 8,
        'trackerUrl': "https://matomo.nonpolynomial.com/"
      }
    ],
    "@vuepress/plugin-back-to-top"
  ]
};
