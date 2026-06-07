const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

// GET /api/public/share/:linkId - Retrieve file metadata or verify passcode
exports.getPublicFileDetails = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { password } = req.body; // Passcode sent via POST payload

    // 1. Locate the file containing this linkId
    // Since publicLinks are saved inside a JSON column in CircleFile,
    // we query all files or use Prisma filters. Since SQLite JSON search is limited,
    // we can search files that have non-empty publicLinks and filter in memory.
    const files = await prisma.circleFile.findMany({
      where: {
        isDeleted: false,
        publicLinks: {
          not: '[]'
        }
      }
    });

    let targetFile = null;
    let targetLink = null;

    for (const file of files) {
      if (file.publicLinks) {
        try {
          const links = JSON.parse(file.publicLinks);
          const found = links.find(l => l.linkId === linkId);
          if (found) {
            targetFile = file;
            targetLink = found;
            break;
          }
        } catch (e) {
          console.error('Failed to parse publicLinks for file id:', file.id, e);
        }
      }
    }

    if (!targetFile || !targetLink) {
      return res.status(404).json({ error: 'Public share link not found or revoked' });
    }

    // 2. Validate Link Expiry and Status
    if (!targetLink.active) {
      return res.status(410).json({ error: 'This share link has been deactivated by the administrator' });
    }

    if (targetLink.expiresAt && new Date(targetLink.expiresAt) < new Date()) {
      return res.status(410).json({ error: 'This share link has expired' });
    }

    // 3. Handle Password Protection Checks
    if (targetLink.passwordProtected) {
      if (!password) {
        // Return a safe response prompting the user to enter password
        return res.status(200).json({
          passwordProtected: true,
          fileName: targetFile.originalName,
          type: targetFile.type
        });
      }

      // Hash the inputted password and match
      const hashedInput = crypto.createHash('sha256').update(password.trim()).digest('hex');
      if (hashedInput !== targetLink.passwordHash) {
        return res.status(401).json({ error: 'Incorrect passcode. Access denied.' });
      }
    }

    // 4. Return metadata + fileUrl
    res.json({
      passwordProtected: false,
      id: targetFile.id,
      name: targetFile.originalName,
      type: targetFile.type,
      size: targetFile.size,
      fileUrl: targetFile.fileUrl,
      role: targetLink.role, // "VIEW" or "DOWNLOAD"
      createdAt: targetFile.createdAt
    });
  } catch (error) {
    console.error('Error resolving public share link:', error);
    res.status(500).json({ error: 'Failed to resolve public share link' });
  }
};
