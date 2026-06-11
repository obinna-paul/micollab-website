const fs = require('fs');

function restructureProfile() {
  let code = fs.readFileSync('client/src/pages/Profile.jsx', 'utf8');

  // 1. Extract the Right Sidebar Space content
  const startMarker = "{/* Right sidebar space */}";
  const endMarker = "</div>\n\n      {/* ============ BOTTOM ROW: Left info | Middle content | Right sidebar continues ============ */}";
  
  const startIndex = code.indexOf(startMarker);
  const endIndex = code.indexOf(endMarker);
  
  if (startIndex === -1 || endIndex === -1) {
    console.log("Could not find boundaries.");
    return;
  }

  const rightSidebarCode = code.substring(startIndex, endIndex).trim();

  // Remove the right sidebar from its current place
  code = code.slice(0, startIndex) + code.slice(endIndex);

  // 2. Change the Top Row wrappers to Master Layout wrappers
  code = code.replace(
    `      {/* ============ TOP ROW: Cover & Header Info ============ */}\n      <div className="flex gap-7 mb-8">\n\n        {/* Cover & Profile Info Area */}\n        <div className="flex-1 min-w-0">`,
    `      {/* ============ MASTER LAYOUT ============ */}\n      <div className="flex gap-7">\n\n        {/* LEFT / CENTER CONTENT */}\n        <div className="flex-1 min-w-0 flex flex-col">\n          \n          {/* Cover & Header Info Area */}\n          <div className="mb-8">`
  );

  // 3. Remove the end of the top row and start of the bottom row, replace with closing Cover Area and opening Bottom Row
  code = code.replace(
    `      </div>\n\n      {/* ============ BOTTOM ROW: Left info | Middle content | Right sidebar continues ============ */}\n      <div className="flex gap-7">`,
    `          </div> {/* End Cover Area */}\n\n          {/* ============ BOTTOM ROW: Left info | Middle content ============ */}\n          <div className="flex gap-7">`
  );

  // 4. Find the Empty Right Sidebar Column at the end of the bottom row, and replace it with closing LEFT/CENTER content and inserting the extracted rightSidebarCode
  const emptyColMatch = code.match(/\{\/\* RIGHT SIDEBAR COLUMN[\s\S]*?<\/div>\s*<\/div>/);
  if (emptyColMatch) {
    code = code.replace(
      emptyColMatch[0],
      `          </div> {/* End Bottom Row */}\n        </div> {/* End LEFT/CENTER CONTENT */}\n\n        ${rightSidebarCode}\n      </div> {/* End MASTER LAYOUT */}`
    );
  } else {
    console.log("Could not find empty right sidebar column.");
    return;
  }

  fs.writeFileSync('client/src/pages/Profile.jsx', code, 'utf8');
  console.log("Success");
}

restructureProfile();
