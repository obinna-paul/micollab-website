const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary from Env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer Storage for general files
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'creative-platform/circle-files',
    resource_type: 'auto',
    public_id: (req, file) => {
      const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      return `${Date.now()}-${cleanOriginalName.substring(0, 50)}`;
    }
  }
});

// Broad file filter - block executable files for basic security
const fileFilter = (req, file, cb) => {
  const blockedExtensions = ['.exe', '.bat', '.cmd', '.sh', '.vbs', '.scr', '.msi', '.com'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (blockedExtensions.includes(ext)) {
    cb(new Error('Security check failed: Executable and script files are not allowed!'), false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB maximum file size
});

// Middleware for single file upload with clean error handling
const uploadSingle = upload.single('file');
exports.uploadMiddleware = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// Middleware for bulk upload (up to 10 files)
const uploadMultiple = upload.array('files', 10);
exports.uploadMultipleMiddleware = (req, res, next) => {
  uploadMultiple(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// ── Helpers for Permissions Checking ──
const checkCircleMembership = async (circleId, userId) => {
  const membership = await prisma.circleMember.findUnique({
    where: {
      circleId_userId: { circleId, userId }
    }
  });
  return membership;
};

const getPermissionLevel = async (file, userId) => {
  const circle = await prisma.circle.findUnique({
    where: { id: file.circleId },
    include: { members: true }
  });
  
  if (!circle) return 'NONE';
  if (circle.ownerId === userId) return 'EDIT'; // Circle Owner gets full edit

  const member = circle.members.find(m => m.userId === userId);
  if (member && member.role === 'ADMIN') return 'EDIT'; // Admin gets full edit

  if (file.uploadedBy === userId) return 'EDIT'; // Creator gets edit access

  // Check Folder-level access inheritances
  if (file.folderId) {
    const folder = await prisma.circleFolder.findUnique({
      where: { id: file.folderId }
    });
    if (folder && folder.folderAccess) {
      try {
        const folderPerms = JSON.parse(folder.folderAccess);
        const userPerm = folderPerms.find(p => p.userId === userId);
        if (userPerm) return userPerm.role; // DOWNLOAD or EDIT
      } catch (err) {
        console.error('Folder access parse error:', err);
      }
    }
  }

  // Check File-level accessList
  if (file.accessList) {
    try {
      const perms = JSON.parse(file.accessList);
      const userPerm = perms.find(p => p.userId === userId);
      if (userPerm) return userPerm.role; // DOWNLOAD or EDIT
    } catch (err) {
      console.error('File access parse error:', err);
    }
  }

  return 'NONE';
};

const getOriginalName = (filename) => {
  const parts = filename.split('-');
  if (parts.length > 2) {
    return parts.slice(2).join('-');
  }
  return filename;
};

// ── GET /api/circles/:id/files ──
exports.getCircleFiles = async (req, res) => {
  try {
    const { id: circleId } = req.params;
    const userId = req.user.id;

    // 1. Verify Circle and Membership
    const circle = await prisma.circle.findUnique({
      where: { id: circleId },
      include: { members: true }
    });

    if (!circle) {
      return res.status(404).json({ error: 'Circle not found' });
    }

    const isMember = circle.members.some(m => m.userId === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this Circle' });
    }

    const isCircleOwnerOrAdmin = circle.ownerId === userId || 
      circle.members.some(m => m.userId === userId && m.role === 'ADMIN');

    // 2. Fetch Active Circle Files
    const files = await prisma.circleFile.findMany({
      where: { circleId, isDeleted: false },
      orderBy: { createdAt: 'desc' }
    });

    // 3. Map File Uploader Details manually without migration
    const uploaderIds = [...new Set(files.map(f => f.uploadedBy))];
    const uploaders = await prisma.user.findMany({
      where: { id: { in: uploaderIds } },
      select: { id: true, username: true, profileImage: true }
    });

    const uploaderMap = uploaders.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    // 4. Enforce Access Filter & Add Permission Roles
    const filteredFiles = [];
    for (const file of files) {
      const perm = await getPermissionLevel(file, userId);
      if (isCircleOwnerOrAdmin || perm !== 'NONE') {
        filteredFiles.push({
          ...file,
          permission: isCircleOwnerOrAdmin ? 'EDIT' : perm,
          uploader: uploaderMap[file.uploadedBy] || { username: 'Unknown', profileImage: null }
        });
      }
    }

    res.json(filteredFiles);
  } catch (error) {
    console.error('Error fetching circle files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
};

// ── POST /api/circles/:id/files (Manual Single/Bulk Upload) ──
exports.uploadCircleFile = async (req, res) => {
  try {
    const { id: circleId } = req.params;
    const userId = req.user.id;
    const { folderId, sourceTaskId } = req.body;

    const filesToProcess = req.files || (req.file ? [req.file] : []);
    if (filesToProcess.length === 0) {
      return res.status(400).json({ error: 'No files uploaded or file type blocked' });
    }

    // 1. Verify Circle and Membership
    const circle = await prisma.circle.findUnique({
      where: { id: circleId },
      include: { members: true }
    });

    if (!circle) {
      // Clean up files
      filesToProcess.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
      return res.status(404).json({ error: 'Circle not found' });
    }

    const isMember = circle.members.some(m => m.userId === userId);
    if (!isMember) {
      filesToProcess.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
      return res.status(403).json({ error: 'Access denied: You are not a member of this Circle' });
    }

    // Fetch user details for log
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, profileImage: true }
    });

    const createdRecords = [];

    for (const f of filesToProcess) {
      const fileUrl = f.path;
      const originalName = f.originalname;
      const size = f.size;

      // Access control & history initial state
      const accessList = '[]';
      const publicLinks = '[]';
      const versionHistory = JSON.stringify([{
        version: 1,
        fileUrl,
        uploadedBy: userId,
        uploaderName: user?.username || 'Unknown',
        createdAt: new Date().toISOString(),
        originalName,
        size
      }]);
      const activityLog = JSON.stringify([{
        id: crypto.randomBytes(8).toString('hex'),
        action: 'CREATED',
        userId,
        username: user?.username || 'Unknown',
        details: `File uploaded manually`,
        timestamp: new Date().toISOString()
      }]);
      const comments = '[]';

      const newFile = await prisma.circleFile.create({
        data: {
          circleId,
          uploadedBy: userId,
          fileUrl,
          type: f.mimetype,
          version: 1,
          folderId: folderId || null,
          originalName,
          size,
          sourceTaskId: sourceTaskId || null,
          versionHistory,
          accessList,
          publicLinks,
          activityLog,
          comments,
          isDeleted: false
        }
      });

      createdRecords.push({
        ...newFile,
        permission: 'EDIT',
        uploader: user || { username: 'Unknown', profileImage: null }
      });
    }

    // Return the uploads array
    res.status(201).json(createdRecords.length === 1 ? createdRecords[0] : createdRecords);
  } catch (error) {
    console.error('Error uploading file:', error);
    if (req.files) {
      req.files.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
    } else if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload files' });
  }
};

// ── POST /api/files/version/:fileId (Upload Newer Version) ──
exports.uploadNewVersion = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = await prisma.circleFile.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify EDIT permission
    const perm = await getPermissionLevel(file, userId);
    if (perm !== 'EDIT') {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Permission denied: You need EDIT access to upload new versions' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true }
    });

    const fileUrl = req.file.path;
    const originalName = req.file.originalname;
    const size = req.file.size;
    const newVersionNum = file.version + 1;

    // Expand Version History list
    let history = [];
    if (file.versionHistory) {
      try { history = JSON.parse(file.versionHistory); } catch (e) {}
    }
    history.push({
      version: newVersionNum,
      fileUrl,
      uploadedBy: userId,
      uploaderName: user?.username || 'Unknown',
      createdAt: new Date().toISOString(),
      originalName,
      size
    });

    // Expand Activity Log list
    let logs = [];
    if (file.activityLog) {
      try { logs = JSON.parse(file.activityLog); } catch (e) {}
    }
    const sizeDelta = size - (file.size || 0);
    const formattedDelta = sizeDelta >= 0 ? `+${(sizeDelta/1024).toFixed(1)} KB` : `${(sizeDelta/1024).toFixed(1)} KB`;
    logs.push({
      id: crypto.randomBytes(8).toString('hex'),
      action: 'NEW_VERSION',
      userId,
      username: user?.username || 'Unknown',
      details: `Uploaded v${newVersionNum} (${formattedDelta})`,
      timestamp: new Date().toISOString()
    });

    const updatedFile = await prisma.circleFile.update({
      where: { id: fileId },
      data: {
        fileUrl,
        type: req.file.mimetype,
        version: newVersionNum,
        originalName,
        size,
        versionHistory: JSON.stringify(history),
        activityLog: JSON.stringify(logs)
      }
    });

    res.json(updatedFile);
  } catch (error) {
    console.error('Error adding version:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to upload new version' });
  }
};

// ── POST /api/files/restore-version/:fileId (Restore Version) ──
exports.restoreVersion = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;
    const { version } = req.body;

    if (!version) {
      return res.status(400).json({ error: 'Version number to restore is required' });
    }

    const file = await prisma.circleFile.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const perm = await getPermissionLevel(file, userId);
    if (perm !== 'EDIT') {
      return res.status(403).json({ error: 'Permission denied: EDIT access required to restore versions' });
    }

    let history = [];
    try { history = JSON.parse(file.versionHistory || '[]'); } catch (e) {}

    const selectedVer = history.find(h => h.version === parseInt(version));
    if (!selectedVer) {
      return res.status(404).json({ error: `Version v${version} not found in file history` });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true }
    });

    // Create a new version entry pointing to the restored file URL
    const restoredVersionNum = file.version + 1;
    history.push({
      version: restoredVersionNum,
      fileUrl: selectedVer.fileUrl,
      uploadedBy: userId,
      uploaderName: user?.username || 'Unknown',
      createdAt: new Date().toISOString(),
      originalName: selectedVer.originalName,
      size: selectedVer.size
    });

    let logs = [];
    try { logs = JSON.parse(file.activityLog || '[]'); } catch (e) {}
    logs.push({
      id: crypto.randomBytes(8).toString('hex'),
      action: 'RESTORE_VERSION',
      userId,
      username: user?.username || 'Unknown',
      details: `Restored active file to version v${version}`,
      timestamp: new Date().toISOString()
    });

    const updatedFile = await prisma.circleFile.update({
      where: { id: fileId },
      data: {
        fileUrl: selectedVer.fileUrl,
        version: restoredVersionNum,
        originalName: selectedVer.originalName,
        size: selectedVer.size,
        versionHistory: JSON.stringify(history),
        activityLog: JSON.stringify(logs)
      }
    });

    res.json(updatedFile);
  } catch (error) {
    console.error('Error restoring version:', error);
    res.status(500).json({ error: 'Failed to restore file version' });
  }
};

// ── PUT /api/files/details/:fileId (Rename & Move) ──
exports.updateFileDetails = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;
    const { name, folderId } = req.body;

    const file = await prisma.circleFile.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const perm = await getPermissionLevel(file, userId);
    if (perm !== 'EDIT') {
      return res.status(403).json({ error: 'Permission denied: EDIT access required to edit file details' });
    }

    const updateData = {};
    let detailsStr = '';

    if (name !== undefined && name.trim()) {
      updateData.originalName = name.trim();
      detailsStr += `Renamed to "${name.trim()}". `;
    }

    if (folderId !== undefined) {
      updateData.folderId = folderId || null;
      if (folderId) {
        const folder = await prisma.circleFolder.findUnique({ where: { id: folderId } });
        detailsStr += `Moved to folder "${folder?.name || 'Folder'}". `;
      } else {
        detailsStr += `Moved to Root workspace. `;
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });

    let logs = [];
    try { logs = JSON.parse(file.activityLog || '[]'); } catch (e) {}
    logs.push({
      id: crypto.randomBytes(8).toString('hex'),
      action: 'UPDATE_DETAILS',
      userId,
      username: user?.username || 'Unknown',
      details: detailsStr.trim(),
      timestamp: new Date().toISOString()
    });
    updateData.activityLog = JSON.stringify(logs);

    const updatedFile = await prisma.circleFile.update({
      where: { id: fileId },
      data: updateData
    });

    res.json(updatedFile);
  } catch (error) {
    console.error('Error updating file details:', error);
    res.status(500).json({ error: 'Failed to update file' });
  }
};

// ── POST /api/files/access/:fileId (Manage Permissions) ──
exports.manageAccess = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;
    const { accessList } = req.body; // Expect JSON Array string: `[{ userId, role }]`

    const file = await prisma.circleFile.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify Admin/Owner role
    const circle = await prisma.circle.findUnique({
      where: { id: file.circleId }
    });
    const membership = await checkCircleMembership(file.circleId, userId);
    const isOwner = circle && circle.ownerId === userId;
    const isAdmin = membership && membership.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied: Only Circle Owners or Admins can share files' });
    }

    // Validate accessList is valid array
    let parsedList = [];
    try {
      parsedList = JSON.parse(accessList);
      if (!Array.isArray(parsedList)) throw new Error('Not array');
    } catch (e) {
      return res.status(400).json({ error: 'accessList must be a JSON array string mapping user IDs to roles' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });

    let logs = [];
    try { logs = JSON.parse(file.activityLog || '[]'); } catch (e) {}
    logs.push({
      id: crypto.randomBytes(8).toString('hex'),
      action: 'SHARE_LIST_UPDATED',
      userId,
      username: user?.username || 'Unknown',
      details: `Updated sharing settings (${parsedList.length} shared entries)`,
      timestamp: new Date().toISOString()
    });

    const updatedFile = await prisma.circleFile.update({
      where: { id: fileId },
      data: {
        accessList,
        activityLog: JSON.stringify(logs)
      }
    });

    res.json(updatedFile);
  } catch (error) {
    console.error('Error updating sharing permissions:', error);
    res.status(500).json({ error: 'Failed to update access control' });
  }
};

// ── POST /api/files/public-links/:fileId (External Public Links) ──
exports.managePublicLinks = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;
    const { action, linkId, role, expiresInDays, password } = req.body;

    const file = await prisma.circleFile.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify Admin/Owner/Uploader status
    const circle = await prisma.circle.findUnique({
      where: { id: file.circleId }
    });
    const membership = await checkCircleMembership(file.circleId, userId);
    const isOwner = circle && circle.ownerId === userId;
    const isAdmin = membership && membership.role === 'ADMIN';
    const isUploader = file.uploadedBy === userId;

    if (!isOwner && !isAdmin && !isUploader) {
      return res.status(403).json({ error: 'Access denied: Only Circle Owners, Admins, or file uploaders can manage public links' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });

    let links = [];
    try { links = JSON.parse(file.publicLinks || '[]'); } catch (e) {}
    let logs = [];
    try { logs = JSON.parse(file.activityLog || '[]'); } catch (e) {}

    if (action === 'CREATE') {
      const generatedLinkId = crypto.randomBytes(16).toString('hex');
      
      let expiresAt = null;
      if (expiresInDays && parseInt(expiresInDays) > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));
        expiresAt = expiresAt.toISOString();
      }

      let passwordHash = null;
      if (password && password.trim()) {
        passwordHash = crypto.createHash('sha256').update(password.trim()).digest('hex');
      }

      const newLinkObj = {
        linkId: generatedLinkId,
        role: role || 'VIEW',
        expiresAt,
        passwordProtected: !!passwordHash,
        passwordHash,
        active: true,
        createdAt: new Date().toISOString()
      };

      links.push(newLinkObj);
      logs.push({
        id: crypto.randomBytes(8).toString('hex'),
        action: 'PUBLIC_LINK_CREATED',
        userId,
        username: user?.username || 'Unknown',
        details: `Generated public shareable link. Expire: ${expiresAt ? new Date(expiresAt).toLocaleDateString() : 'Never'}. Password: ${!!passwordHash}`,
        timestamp: new Date().toISOString()
      });

      const updatedFile = await prisma.circleFile.update({
        where: { id: fileId },
        data: {
          publicLinks: JSON.stringify(links),
          activityLog: JSON.stringify(logs)
        }
      });

      return res.json({ message: 'Public link generated successfully', link: newLinkObj, file: updatedFile });
    } 
    
    if (action === 'REVOKE') {
      if (!linkId) {
        return res.status(400).json({ error: 'linkId to revoke is required' });
      }

      links = links.filter(l => l.linkId !== linkId);
      logs.push({
        id: crypto.randomBytes(8).toString('hex'),
        action: 'PUBLIC_LINK_REVOKED',
        userId,
        username: user?.username || 'Unknown',
        details: `Revoked external share link ID ${linkId.substring(0,6)}...`,
        timestamp: new Date().toISOString()
      });

      const updatedFile = await prisma.circleFile.update({
        where: { id: fileId },
        data: {
          publicLinks: JSON.stringify(links),
          activityLog: JSON.stringify(logs)
        }
      });

      return res.json({ message: 'Public link revoked successfully', file: updatedFile });
    }

    res.status(400).json({ error: 'Invalid link action (must be CREATE or REVOKE)' });
  } catch (error) {
    console.error('Error managing public links:', error);
    res.status(500).json({ error: 'Failed to manage public sharing' });
  }
};

// ── POST /api/files/comments/:fileId (Comments & Pin Annotations) ──
exports.handleFileComment = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;
    const { action, content, pins, commentId } = req.body;

    const file = await prisma.circleFile.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const perm = await getPermissionLevel(file, userId);
    if (perm === 'NONE') {
      return res.status(403).json({ error: 'Access denied: You do not have view access to this file' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, profileImage: true }
    });

    let fileComments = [];
    try { fileComments = JSON.parse(file.comments || '[]'); } catch (e) {}

    if (action === 'ADD') {
      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Comment body content is required' });
      }

      const newComment = {
        id: crypto.randomBytes(8).toString('hex'),
        userId,
        username: user?.username || 'Unknown',
        userAvatar: user?.profileImage || `https://ui-avatars.com/api/?name=${user?.username}`,
        content: content.trim(),
        pins: pins || null, // Coordinates [{ x, y, text }] for image pins
        resolved: false,
        createdAt: new Date().toISOString()
      };

      fileComments.push(newComment);

      const updatedFile = await prisma.circleFile.update({
        where: { id: fileId },
        data: {
          comments: JSON.stringify(fileComments)
        }
      });

      return res.json({ message: 'Comment added successfully', comment: newComment, file: updatedFile });
    }

    if (action === 'RESOLVE') {
      if (!commentId) {
        return res.status(400).json({ error: 'commentId to resolve is required' });
      }

      if (perm !== 'EDIT') {
        return res.status(403).json({ error: 'Permission denied: EDIT privileges required to resolve annotations' });
      }

      fileComments = fileComments.map(c => c.id === commentId ? { ...c, resolved: true } : c);

      const updatedFile = await prisma.circleFile.update({
        where: { id: fileId },
        data: {
          comments: JSON.stringify(fileComments)
        }
      });

      return res.json({ message: 'Comment resolved successfully', file: updatedFile });
    }

    res.status(400).json({ error: 'Invalid comments action (must be ADD or RESOLVE)' });
  } catch (error) {
    console.error('Error handling comments:', error);
    res.status(500).json({ error: 'Failed to manage annotations comments' });
  }
};

// ── POST /api/files/trash/:fileId (Move to Trash, Restore, and Purge) ──
exports.manageTrash = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;
    const { action } = req.body; // "TRASH", "RESTORE", "HARD_DELETE"

    const file = await prisma.circleFile.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify Admin/Owner/Uploader
    const circle = await prisma.circle.findUnique({
      where: { id: file.circleId }
    });
    const membership = await checkCircleMembership(file.circleId, userId);
    const isOwner = circle && circle.ownerId === userId;
    const isAdmin = membership && membership.role === 'ADMIN';
    const isUploader = file.uploadedBy === userId;

    if (action === 'TRASH') {
      if (!isOwner && !isAdmin && !isUploader) {
        return res.status(403).json({ error: 'Access denied: Only uploader or Admins can trash files' });
      }

      const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
      let logs = [];
      try { logs = JSON.parse(file.activityLog || '[]'); } catch (e) {}
      logs.push({
        id: crypto.randomBytes(8).toString('hex'),
        action: 'TRASHED',
        userId,
        username: user?.username || 'Unknown',
        details: 'File moved to Trash Folder',
        timestamp: new Date().toISOString()
      });

      const updatedFile = await prisma.circleFile.update({
        where: { id: fileId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          activityLog: JSON.stringify(logs)
        }
      });

      return res.json({ message: 'File moved to Trash successfully', file: updatedFile });
    }

    if (action === 'RESTORE') {
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Access denied: Only Admins can restore files from Trash' });
      }

      const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
      let logs = [];
      try { logs = JSON.parse(file.activityLog || '[]'); } catch (e) {}
      logs.push({
        id: crypto.randomBytes(8).toString('hex'),
        action: 'RESTORED',
        userId,
        username: user?.username || 'Unknown',
        details: 'File restored back to active storage',
        timestamp: new Date().toISOString()
      });

      const updatedFile = await prisma.circleFile.update({
        where: { id: fileId },
        data: {
          isDeleted: false,
          deletedAt: null,
          activityLog: JSON.stringify(logs)
        }
      });

      return res.json({ message: 'File restored successfully', file: updatedFile });
    }

    if (action === 'HARD_DELETE') {
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Access denied: Only Circle Owners or Admins can permanently purge files' });
      }

      // Delete physical files from disk for all history version URLs
      let history = [];
      try { history = JSON.parse(file.versionHistory || '[]'); } catch (e) {}
      
      const fileUrlsToPurge = new Set([file.fileUrl, ...history.map(h => h.fileUrl)]);

      for (const url of fileUrlsToPurge) {
        const filename = url.substring(url.lastIndexOf('/') + 1);
        const filePath = path.join(__dirname, '../../uploads', filename);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) { console.error('Unlink error:', e); }
        }
      }

      await prisma.circleFile.delete({
        where: { id: fileId }
      });

      return res.json({ message: 'File and all historical versions purged permanently from database and storage disk', fileId });
    }

    res.status(400).json({ error: 'Invalid trash action (must be TRASH, RESTORE, or HARD_DELETE)' });
  } catch (error) {
    console.error('Error handling trash operations:', error);
    res.status(500).json({ error: 'Failed to execute trash operation' });
  }
};

// ── GET /api/circles/:id/storage (Admin Dashboard Overview) ──
exports.getStorageOverview = async (req, res) => {
  try {
    const { id: circleId } = req.params;
    const userId = req.user.id;

    // Verify Admin/Owner status
    const circle = await prisma.circle.findUnique({
      where: { id: circleId }
    });
    const membership = await checkCircleMembership(circleId, userId);
    const isOwner = circle && circle.ownerId === userId;
    const isAdmin = membership && membership.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied: Storage dashboard is available to Admins/Owners only' });
    }

    // Fetch all files inside circle (active and deleted)
    const files = await prisma.circleFile.findMany({
      where: { circleId }
    });

    const activeFiles = files.filter(f => !f.isDeleted);
    const trashedFiles = files.filter(f => f.isDeleted);

    // Sum Total Storage Size
    let totalStorageBytes = 0;
    const fileTypeStats = { images: 0, audio: 0, video: 0, docs: 0, archives: 0 };
    const uploaderStats = {};
    let activePublicLinksCount = 0;
    let unsharedFilesCount = 0;

    activeFiles.forEach(f => {
      const sizeVal = f.size || 0;
      totalStorageBytes += sizeVal;

      // Type breakdowns
      const ext = path.extname(f.originalName || '').toLowerCase();
      const mime = (f.type || '').toLowerCase();

      if (mime.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) {
        fileTypeStats.images += sizeVal;
      } else if (mime.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) {
        fileTypeStats.audio += sizeVal;
      } else if (mime.startsWith('video/') || ['.mp4', '.mkv', '.avi', '.mov', '.webm'].includes(ext)) {
        fileTypeStats.video += sizeVal;
      } else if (['.zip', '.rar', '.tar', '.gz', '.7z'].includes(ext)) {
        fileTypeStats.archives += sizeVal;
      } else {
        fileTypeStats.docs += sizeVal;
      }

      // Top uploaders
      const up = f.uploadedBy;
      uploaderStats[up] = (uploaderStats[up] || 0) + sizeVal;

      // Active public links check
      let links = [];
      try { links = JSON.parse(f.publicLinks || '[]'); } catch (e) {}
      const activeLink = links.some(l => {
        if (!l.active) return false;
        if (l.expiresAt && new Date(l.expiresAt) < new Date()) return false;
        return true;
      });
      if (activeLink) activePublicLinksCount += 1;

      // Unshared check (private to admins/owner & uploader)
      let perms = [];
      try { perms = JSON.parse(f.accessList || '[]'); } catch (e) {}
      if (perms.length === 0) unsharedFilesCount += 1;
    });

    // Resolve uploader usernames
    const uploaderIds = Object.keys(uploaderStats);
    const users = await prisma.user.findMany({
      where: { id: { in: uploaderIds } },
      select: { id: true, username: true, profileImage: true }
    });

    const userMap = users.reduce((acc, u) => {
      acc[u.id] = u;
      return acc;
    }, {});

    const uploaderBreakdown = Object.entries(uploaderStats).map(([uid, bytes]) => ({
      userId: uid,
      username: userMap[uid]?.username || 'Unknown',
      profileImage: userMap[uid]?.profileImage || null,
      bytesUsed: bytes
    })).sort((a,b) => b.bytesUsed - a.bytesUsed);

    // Get 5 largest active files
    const largestFilesList = [...activeFiles]
      .sort((a, b) => (b.size || 0) - (a.size || 0))
      .slice(0, 5)
      .map(f => ({
        id: f.id,
        name: f.originalName,
        size: f.size,
        type: f.type,
        createdAt: f.createdAt,
        fileUrl: f.fileUrl
      }));

    res.json({
      totalUsed: totalStorageBytes,
      limit: 10 * 1024 * 1024 * 1024, // 10 GB limit mock
      fileTypeStats,
      uploaders: uploaderBreakdown,
      unsharedFilesCount,
      activePublicLinksCount,
      trashedCount: trashedFiles.length,
      largestFiles: largestFilesList
    });
  } catch (error) {
    console.error('Error fetching storage dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch storage breakdown' });
  }
};
