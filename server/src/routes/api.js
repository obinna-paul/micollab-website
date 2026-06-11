const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadController = require('../controllers/uploadController');
const messageController = require('../controllers/messageController');
const adminMiddleware = require('../middlewares/adminMiddleware');
const superAdminMiddleware = require('../middlewares/superAdminMiddleware');
const disputeController = require('../controllers/disputeController');

// Upload Route
router.post('/upload', authMiddleware, uploadController.uploadMiddleware, uploadController.uploadMedia);

// Health Check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Micollab API is running' });
});

// Global Search
const searchController = require('../controllers/searchController');
router.get('/search', searchController.globalSearch);

// Auth Routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/google', authController.googleLogin);
router.post('/auth/check-availability', authController.checkAvailability);
router.post('/auth/verify-otp', authController.verifyOTP);
router.post('/auth/resend-otp', authController.resendOTP);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.get('/auth/me', authMiddleware, authController.getMe);

// Post Routes
router.get('/posts', postController.getPosts);
router.post('/posts', authMiddleware, postController.createPost);
router.get('/posts/:id', postController.getPostById);
router.put('/posts/:id', authMiddleware, postController.updatePost);
router.put('/posts/:id/archive', authMiddleware, postController.archivePost);
router.delete('/posts/:id', authMiddleware, postController.deletePost);

// Social Interactions
router.post('/posts/:id/repost', authMiddleware, postController.repost);
router.get('/posts/:id/comments', postController.getComments);
router.post('/posts/:id/comments', authMiddleware, postController.addComment);

// User Routes
router.post('/users/activity-ping', authMiddleware, userController.activityPing);
router.get('/users/analytics', authMiddleware, userController.getAnalytics);
router.get('/users/search', authMiddleware, userController.searchUsers);
router.get('/users/trending', userController.getTrendingCreators);
router.get('/users/profile/:username', userController.getProfile);
router.put('/users/profile', authMiddleware, userController.updateProfile);
router.post('/users/portfolio', authMiddleware, userController.createPortfolioItem);
router.post('/users/testimonial', authMiddleware, userController.createTestimonial);
router.post('/users/experience', authMiddleware, userController.createExperience);
// router.put('/users/settings/password', authMiddleware, userController.changePassword);
// router.put('/users/settings/email', authMiddleware, userController.updateEmail);
router.delete('/users/settings/account', authMiddleware, userController.deleteAccount);

// Message Routes
router.get('/messages/conversations', authMiddleware, messageController.getConversations);
router.get('/messages/history/:conversationId', authMiddleware, messageController.getMessages);
router.post('/messages/send', authMiddleware, messageController.sendMessage);
router.post('/messages/conversation', authMiddleware, messageController.getOrCreateConversation);

// Trust & Safety Routes
const trustController = require('../controllers/trustController');
router.post('/trust/block', authMiddleware, trustController.blockUser);
router.post('/trust/unblock', authMiddleware, trustController.unblockUser);
router.post('/trust/report', authMiddleware, trustController.reportUser);

// Monetization / Wallet Routes
const stripeController = require('../controllers/stripeController');
const walletController = require('../controllers/walletController');
const paystackController = require('../controllers/paystackController');
const adminController = require('../controllers/adminController');

router.post('/monetization/checkout', authMiddleware, stripeController.createCheckoutSession);
router.get('/monetization/earnings', authMiddleware, stripeController.getEarnings);

// Wallet & Withdrawals
router.get('/wallet', authMiddleware, walletController.getWallet);
router.get('/wallet/transactions', authMiddleware, walletController.getTransactions);
router.post('/wallet/withdraw', authMiddleware, walletController.requestWithdrawal);

// Paystack Escrow
router.post('/escrow/deposit/initialize', authMiddleware, paystackController.initializeDeposit);
router.post('/escrow/deposit/verify', paystackController.verifyDeposit); // Could be public webhook or authenticated
router.post('/escrow/release', authMiddleware, paystackController.releaseEscrow);
router.post('/escrow/dispute', authMiddleware, paystackController.openDispute);

// Admin Routes
router.get('/admin/withdrawals', authMiddleware, adminMiddleware, adminController.getPendingWithdrawals);
router.post('/admin/withdrawals/:id/process', authMiddleware, superAdminMiddleware, adminController.processWithdrawal);
router.post('/admin/withdrawals/:id/reject', authMiddleware, superAdminMiddleware, adminController.rejectWithdrawal);
router.get('/admin/metrics', authMiddleware, adminMiddleware, adminController.getMetrics);
router.get('/admin/users', authMiddleware, adminMiddleware, adminController.getUsers);
router.patch('/admin/users/:id/toggle-admin', authMiddleware, superAdminMiddleware, adminController.toggleAdmin);
router.patch('/admin/users/:id/toggle-ban', authMiddleware, adminMiddleware, adminController.toggleBan);
router.get('/admin/disputes', authMiddleware, adminMiddleware, adminController.getDisputes);
router.post('/admin/disputes/resolve', authMiddleware, superAdminMiddleware, adminController.resolveDispute);

// Collabs Hub Routes
const collabController = require('../controllers/collabController');
router.get('/collabs', collabController.getCollabs);
router.get('/collabs/recommended', authMiddleware, collabController.getRecommendedCollabs);
router.get('/collabs/my-collabs', authMiddleware, collabController.getMyCollabs);
router.get('/collabs/my-proposals', authMiddleware, collabController.getMyProposals);
router.get('/collabs/:id', collabController.getCollabById);
router.post('/collabs', authMiddleware, collabController.createCollab);
router.post('/collabs/apply', authMiddleware, collabController.submitProposal);
router.patch('/collabs/proposals/:proposalId/status', authMiddleware, collabController.updateProposalStatus);

// Network Routes
const networkController = require('../controllers/networkController');
router.get('/network/discover', authMiddleware, networkController.discoverUsers);
router.get('/network/connections', authMiddleware, networkController.getConnections);
router.get('/network/requests', authMiddleware, networkController.getRequests);
router.get('/network/status/:targetId', authMiddleware, networkController.getConnectionStatus);
router.delete('/network/connections/:targetId', authMiddleware, networkController.removeConnection);
router.post('/network/connect', authMiddleware, networkController.sendConnectionRequest);
router.patch('/network/requests/:requestId', authMiddleware, networkController.handleConnectionRequest);
router.get('/network/feed', authMiddleware, networkController.getNetworkFeed);

// Circle Routes
const circleController = require('../controllers/circleController');
router.get('/circles', authMiddleware, circleController.getMyCircles);
router.post('/circles', authMiddleware, circleController.createCircle);
router.get('/circles/:id', authMiddleware, circleController.getCircleDetails);
router.post('/circles/:id/messages', authMiddleware, circleController.sendCircleMessage);
router.post('/circles/:id/invite', authMiddleware, circleController.inviteMember);
router.patch('/circles/invites/:inviteId', authMiddleware, circleController.respondToInvite);

// Circle Folder & File Routes
const fileController = require('../controllers/fileController');
const folderController = require('../controllers/folderController');
const publicShareController = require('../controllers/publicShareController');

// Folders REST APIs
router.get('/circles/:id/folders', authMiddleware, folderController.getCircleFolders);
router.post('/circles/:id/folders', authMiddleware, folderController.createFolder);
router.put('/folders/:folderId', authMiddleware, folderController.updateFolder);
router.delete('/folders/:folderId', authMiddleware, folderController.deleteFolder);

// Files REST APIs
router.get('/circles/:id/files', authMiddleware, fileController.getCircleFiles);
router.post('/circles/:id/files', authMiddleware, fileController.uploadMultipleMiddleware, fileController.uploadCircleFile);
router.post('/files/version/:fileId', authMiddleware, fileController.uploadMiddleware, fileController.uploadNewVersion);
router.post('/files/restore-version/:fileId', authMiddleware, fileController.restoreVersion);
router.put('/files/details/:fileId', authMiddleware, fileController.updateFileDetails);
router.post('/files/access/:fileId', authMiddleware, fileController.manageAccess);
router.post('/files/public-links/:fileId', authMiddleware, fileController.managePublicLinks);
router.post('/files/comments/:fileId', authMiddleware, fileController.handleFileComment);
router.post('/files/trash/:fileId', authMiddleware, fileController.manageTrash);
router.get('/circles/:id/storage', authMiddleware, fileController.getStorageOverview);

// Unauthenticated Public Share API Route (no authMiddleware!)
router.post('/public/share/:linkId', publicShareController.getPublicFileDetails);
router.get('/public/share/:linkId', publicShareController.getPublicFileDetails);

// Circle Task Routes
const taskController = require('../controllers/taskController');
router.get('/circles/:id/tasks', authMiddleware, taskController.getCircleTasks);
router.post('/circles/:id/tasks', authMiddleware, taskController.createTask);
router.patch('/tasks/:id', authMiddleware, taskController.updateTask);
router.post('/tasks/:id/comments', authMiddleware, taskController.addTaskComment);

// Notification Routes
const notificationController = require('../controllers/notificationController');
router.get('/notifications', authMiddleware, notificationController.getNotifications);
router.patch('/notifications/mark-all', authMiddleware, notificationController.markAllAsRead);
router.patch('/notifications/:id/read', authMiddleware, notificationController.markAsRead);
router.delete('/notifications/:id', authMiddleware, notificationController.deleteNotification);

// Dispute Routes
router.get('/disputes/my-disputes', authMiddleware, disputeController.getMyDisputes);
router.get('/disputes/:id', authMiddleware, disputeController.getDisputeDetails);
router.post('/disputes/:id/message', authMiddleware, disputeController.addDisputeMessage);

module.exports = router;
