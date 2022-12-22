/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  tutorialSidebar: [
    'README',
    {
      type: 'category',
      label: 'Protocols and Memory Layouts',
      items: [{
        type: 'autogenerated',
        dirName: 'protocols'
      }]
    },
    {
      type: 'category',
      label: 'Firmware and Bootloaders',
      items: [{
        type: 'autogenerated',
        dirName: 'firmware'
      }]
    },
    {
      type: 'category',
      label: 'Network Protocols',
      items: [{
        type: 'autogenerated',
        dirName: 'network'
      }]
    },
    {
      type: 'category',
      label: 'Video Encoding Formats',
      items: [{
        type: 'autogenerated',
        dirName: 'video-encoding-formats'
      }]
    },
  ],
};

module.exports = sidebars;
