const fs = require('fs');
const path = './client/src/pages/Profile.jsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Change the top layout wrapper
content = content.replace(
  `      {/* ============ TOP ROW: Cover & Header Info ============ */}\n      <div className="flex gap-7 mb-8">\n\n        {/* Cover & Profile Info Area */}\n        <div className="flex-1 min-w-0">`,
  `      {/* ============ MASTER LAYOUT ============ */}\n      <div className="flex gap-7">\n\n        {/* LEFT / CENTER CONTENT */}\n        <div className="flex-1 min-w-0 flex flex-col">\n          \n          {/* Cover & Profile Info Area */}\n          <div className="mb-8">`
);

// 2. Wrap the bottom row inside the Left/Center content, and move the Right Sidebar to the end
// Let's use regex to extract the right sidebar.
const rightSidebarRegex = /\{\/\* Right sidebar space \*\/\}([\s\S]*?)<\/aside>/;
const match = content.match(rightSidebarRegex);

if (match) {
  const rightSidebarCode = match[0];
  
  // Remove it from its current position
  content = content.replace(rightSidebarCode, '');
  
  // Also remove the closing div of the old TOP ROW and the start of the BOTTOM ROW
  content = content.replace(
    `      </div>\n\n      {/* ============ BOTTOM ROW: Left info | Middle content | Right sidebar continues ============ */}\n      <div className="flex gap-7">`,
    `          </div> {/* End Cover Area mb-8 */}\n\n          {/* ============ BOTTOM ROW: Left info | Middle content ============ */}\n          <div className="flex gap-7">`
  );

  // Now find the end of the BOTTOM ROW and insert the Right Sidebar after it, then close the LEFT/CENTER content.
  const emptyRightColumnRegex = /\{\/\* RIGHT SIDEBAR COLUMN — continues from the top row \*\/\}\s*<div className="hidden xl:block w-\[240px\] flex-shrink-0">\s*\{\/\*.*?\*\/\}\s*<\/div>\s*<\/div>/;
  const emptyRightColumnRegexFallback = /\{\/\* RIGHT SIDEBAR COLUMN \?" continues from the top row \*\/\}\s*<div className="hidden xl:block w-\[240px\] flex-shrink-0">[\s\S]*?<\/div>\s*<\/div>/;

  let endMatch = content.match(emptyRightColumnRegex) || content.match(emptyRightColumnRegexFallback) || content.match(/\{\/\* RIGHT SIDEBAR COLUMN .*?\*\/\}\s*<div className="hidden xl:block w-\[240px\] flex-shrink-0">[\s\S]*?<\/div>\s*<\/div>/);

  if (endMatch) {
    const replacement = `          </div>\n        </div> {/* End LEFT/CENTER CONTENT */}\n\n        ${rightSidebarCode}\n      </div> {/* End MASTER LAYOUT */}`;
    content = content.replace(endMatch[0], replacement);
  } else {
    console.log("Could not find the end of the BOTTOM ROW.");
  }
} else {
  console.log("Could not find the Right Sidebar code.");
}

fs.writeFileSync(path, content, 'utf8');
console.log("Layout fixed.");
