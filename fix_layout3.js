const fs = require('fs');

let code = fs.readFileSync('client/src/pages/Profile.jsx', 'utf8');

const rightSidebarRegex = /\{\/\* Right sidebar space \*\/\}[\s\S]*?<\/aside>/;
const match = code.match(rightSidebarRegex);

if (!match) {
  console.log("Could not find right sidebar.");
  process.exit(1);
}

const rightSidebarBlock = match[0];
code = code.replace(rightSidebarBlock, '');

// Replace TOP ROW
code = code.replace(
  /\{\/\* ============ TOP ROW: Cover & Header Info ============ \*\/\}[\s\S]*?<div className="flex-1 min-w-0">/,
  `{/* ============ MASTER LAYOUT ============ */}\n      <div className="flex xl:flex-row flex-col gap-7">\n\n        {/* LEFT / CENTER CONTENT */}\n        <div className="flex-1 min-w-0 flex flex-col">\n          \n          {/* Cover & Header Info Area */}\n          <div className="mb-8 relative">`
);

// Replace end of Top Row and start of Bottom Row
code = code.replace(
  /<\/div>\s*\{\/\* ============ BOTTOM ROW: Left info \| Middle content \| Right sidebar continues ============ \*\/\}\s*<div className="flex gap-7">/,
  `</div> {/* End Cover Area */}\n\n          {/* ============ BOTTOM ROW: Left info | Middle content ============ */}\n          <div className="flex gap-7">`
);

// Replace end of Bottom Row
code = code.replace(
  /\{\/\* RIGHT SIDEBAR COLUMN [^\n]*\*\/\}[\s\S]*?<\/div>\s*<\/div>/,
  `</div> {/* End Bottom Row */}\n        </div> {/* End LEFT/CENTER CONTENT */}\n\n        ${rightSidebarBlock}\n      </div> {/* End MASTER LAYOUT */}`
);

fs.writeFileSync('client/src/pages/Profile.jsx', code, 'utf8');
console.log("Layout fixed successfully.");
