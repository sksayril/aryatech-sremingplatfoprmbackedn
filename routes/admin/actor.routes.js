const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../../middleware/auth.middleware');
const { imageUpload } = require('../../middleware/upload.middleware');
const validateObjectId = require('../../middleware/validateObjectId.middleware');
const actorController = require('../../controllers/admin/actor.controller');

// All routes require admin authentication
router.use(authenticate, isAdmin);

// Create actor
router.post('/', imageUpload.single('image'), actorController.createActor);

// Get all actors
router.get('/', actorController.getAllActors);

// Get actor by ID
router.get('/:id', validateObjectId('id'), actorController.getActorById);

// Update actor
router.put('/:id', validateObjectId('id'), imageUpload.single('image'), actorController.updateActor);

// Delete actor
router.delete('/:id', validateObjectId('id'), actorController.deleteActor);

module.exports = router;

