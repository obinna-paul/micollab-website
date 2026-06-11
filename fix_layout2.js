const fs = require('fs');

let code = fs.readFileSync('client/src/pages/Profile.jsx', 'utf8');

const rightSidebarStart = code.indexOf('{/* Right sidebar space */}');
const topRowEnd = code.indexOf('      </div>\n\n      {/* ============ BOTTOM ROW: Left info | Middle content | Right sidebar continues ============ */}');

if (rightSidebarStart === -1 || topRowEnd === -1) {
  console.log("Could not find right sidebar.");
  process.exit(1);
}

// The entire block from start of Right Sidebar to end of Top Row
let rightSidebarBlock = code.substring(rightSidebarStart, topRowEnd);
// It ends with </div> which is the closing of Top Row.
// We want to just extract the Right Sidebar block.
rightSidebarBlock = rightSidebarBlock.substring(0, rightSidebarBlock.lastIndexOf('</div>')).trim();

// Remove the block
code = code.replace(rightSidebarBlock, '');

// Fix Top Row opening
code = code.replace(
  `      {/* ============ TOP ROW: Cover & Header Info ============ */}\n      <div className="flex gap-7 mb-8">\n\n        {/* Cover & Profile Info Area */}\n        <div className="flex-1 min-w-0">`,
  `      {/* ============ MASTER LAYOUT ============ */}\n      <div className="flex gap-7">\n\n        {/* LEFT / CENTER CONTENT */}\n        <div className="flex-1 min-w-0 flex flex-col">\n          \n          {/* Cover & Header Info Area */}\n          <div className="mb-8">`
);

// Fix Top Row ending and Bottom Row opening
code = code.replace(
  `      </div>\n\n      {/* ============ BOTTOM ROW: Left info | Middle content | Right sidebar continues ============ */}\n      <div className="flex gap-7">`,
  `          </div> {/* End Cover Area */}\n\n          {/* ============ BOTTOM ROW: Left info | Middle content ============ */}\n          <div className="flex gap-7">`
);

// Fix Bottom Row ending
const bottomRowEndRegex = /\{\/\* RIGHT SIDEBAR COLUMN — continues from the top row \*\/\}[\s\S]*?<\/div>\s*<\/div>/;
code = code.replace(
  bottomRowEndRegex,
  `          </div> {/* End Bottom Row */}\n        </div> {/* End LEFT/CENTER CONTENT */}\n\n        ${rightSidebarBlock}\n      </div> {/* End MASTER LAYOUT */}`
);

fs.writeFileSync('client/src/pages/Profile.jsx', code, 'utf8');
console.log("Layout fixed successfully.");
