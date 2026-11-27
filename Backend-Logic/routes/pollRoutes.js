const express = require('express');
const router = express.Router();
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const { AppError } = require('../utils/appError');
const controller = require('../Controllers/pollController');

router.param('publicId', (req, res, next, publicId) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(publicId)) {
        return next(new AppError('Invalid poll identifier'));
    }
    return next();
});

router.get('/', controller.listActive);
router.get('/mine', protect, controller.listMine);
router.post('/', protect, controller.create);
router.get('/:publicId/results', controller.results);
router.get('/:publicId', optionalProtect, controller.getByPublicId);
router.put('/:publicId', protect, controller.update);
router.post('/:publicId/publish', protect, controller.publish);
router.post('/:publicId/close', protect, controller.close);
router.delete('/:publicId', protect, controller.removeDraft);
router.post('/:publicId/votes', protect, controller.vote);

module.exports = router;
