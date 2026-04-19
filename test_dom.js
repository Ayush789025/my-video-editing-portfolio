const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(__dirname, 'public', 'js', 'main.js'), 'utf8');

const dom = new JSDOM(html, { runScripts: "outside-only" });
dom.window.fetch = async (url) => {
    if (url === '/api/videos') {
        const videos = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'videos.json'), 'utf8')).videos;
        // mock sort
        videos.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
        return { json: async () => ({ videos }) };
    }
    throw new Error('Unknown URL: ' + url);
};

dom.window.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Evaluate the script in the context of the window
dom.window.eval(script);


// trigger DOMContentLoaded
const event = new dom.window.Event('DOMContentLoaded');
dom.window.document.dispatchEvent(event);

setTimeout(() => {
    const grid = dom.window.document.getElementById('video-grid');
    console.log("Video grid innerHTML:");
    console.log(grid.innerHTML);
    console.log("Children count:", grid.children.length);
}, 1000);
