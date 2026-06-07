const fs = require('fs');
const path = require('path');

const walk = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let i = 0;
    (function next() {
      let file = list[i++];
      if (!file) return done(null, results);
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(file, (err, res) => {
            results = results.concat(res);
            next();
          });
        } else {
          if (file.endsWith('.jsx')) {
            results.push(file);
          }
          next();
        }
      });
    })();
  });
};

const replaceColors = (content) => {
  let newContent = content;
  
  // Backgrounds
  newContent = newContent.replace(/bg-\[#0F131E\]/g, 'bg-[var(--bg-base)]');
  newContent = newContent.replace(/bg-\[#131720\]/g, 'bg-[var(--bg-surface)]');
  newContent = newContent.replace(/bg-\[#141922\]/g, 'bg-[var(--bg-surface)]');
  newContent = newContent.replace(/bg-\[#181D2A\]/g, 'bg-[var(--bg-surface-alt)]');
  newContent = newContent.replace(/bg-\[#1A1F2E\]/g, 'bg-[var(--bg-elevated)]');
  newContent = newContent.replace(/bg-\[#0B0F18\]/g, 'bg-[var(--bg-sunken)]');
  
  // Text
  newContent = newContent.replace(/text-\[#8B95A5\]/g, 'text-[var(--text-secondary)]');
  newContent = newContent.replace(/text-\[#5A6478\]/g, 'text-[var(--text-muted)]');
  
  // Custom tricky replacements for text-white
  // We want to replace text-white with text-[var(--text-primary)] EXCEPT when the element has bg-[#7B5CFA] or bg-gradient etc.
  // A simple hack is to replace text-white everywhere, but then fix the specific buttons by matching them
  // Actually, replacing text-white inside classNames is dangerous using regex.
  // Let's do a more surgical replacement for text-white.
  
  // For border colors
  newContent = newContent.replace(/border-white\/5/g, 'border-[var(--border-primary)]');
  newContent = newContent.replace(/border-white\/10/g, 'border-[var(--border-secondary)]');
  newContent = newContent.replace(/border-white\/\[0\.0[234568]\]/g, 'border-[var(--border-primary)]');
  
  // For text-white:
  // Instead of replacing all text-white, let's replace text-white that are part of headings or normal paragraphs.
  // Actually, wait, since we set body { text-[var(--text-primary)] }, we can just REMOVE 'text-white' from most headings
  // Or replace text-white with text-[var(--text-primary)] and then restore it for primary buttons
  newContent = newContent.replace(/\btext-white\b/g, 'text-[var(--text-primary)]');
  
  // Restore text-white for primary accents:
  newContent = newContent.replace(/bg-\[#7B5CFA\](.*?)text-\[var\(--text-primary\)\]/g, 'bg-[#7B5CFA]$1text-white');
  newContent = newContent.replace(/bg-red-500(.*?)text-\[var\(--text-primary\)\]/g, 'bg-red-500$1text-white');
  newContent = newContent.replace(/bg-gradient-(.*?)(.*?)text-\[var\(--text-primary\)\]/g, 'bg-gradient-$1$2text-white');
  
  // Fix cases where text-[var(--text-primary)] comes BEFORE the bg color
  newContent = newContent.replace(/text-\[var\(--text-primary\)\](.*?)bg-\[#7B5CFA\]/g, 'text-white$1bg-[#7B5CFA]');
  newContent = newContent.replace(/text-\[var\(--text-primary\)\](.*?)bg-red-500/g, 'text-white$1bg-red-500');
  newContent = newContent.replace(/text-\[var\(--text-primary\)\](.*?)bg-gradient-(.*?)/g, 'text-white$1bg-gradient-$2');

  return newContent;
};

walk(path.join(__dirname, 'client/src'), (err, results) => {
  if (err) throw err;
  
  let changedFiles = 0;
  results.forEach(file => {
    const originalContent = fs.readFileSync(file, 'utf8');
    const updatedContent = replaceColors(originalContent);
    
    if (originalContent !== updatedContent) {
      fs.writeFileSync(file, updatedContent, 'utf8');
      changedFiles++;
      console.log(`Updated ${path.basename(file)}`);
    }
  });
  
  console.log(`\nSuccessfully updated ${changedFiles} files with theme CSS variables.`);
});
