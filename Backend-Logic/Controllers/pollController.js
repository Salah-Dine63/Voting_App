const pollService = require('../services/pollService');
const { asyncHandler } = require('../utils/asyncHandler');

const listActive = asyncHandler(async (req, res) => {
    res.json({ polls: await pollService.listActive() });
});

const listMine = asyncHandler(async (req, res) => {
    res.json({ polls: await pollService.listMine(req.user.id) });
});

const create = asyncHandler(async (req, res) => {
    const poll = await pollService.create(req.user.id, req.body);
    res.status(201).json({ poll });
});

const getByPublicId = asyncHandler(async (req, res) => {
    res.json({ poll: await pollService.getByPublicId(req.params.publicId, req.user && req.user.id) });
});

const update = asyncHandler(async (req, res) => {
    res.json({ poll: await pollService.update(req.params.publicId, req.user.id, req.body) });
});

const publish = asyncHandler(async (req, res) => {
    res.json({ poll: await pollService.changeStatus(req.params.publicId, req.user.id, 'active') });
});

const close = asyncHandler(async (req, res) => {
    res.json({ poll: await pollService.changeStatus(req.params.publicId, req.user.id, 'closed') });
});

const removeDraft = asyncHandler(async (req, res) => {
    await pollService.removeDraft(req.params.publicId, req.user.id);
    res.status(204).end();
});

const results = asyncHandler(async (req, res) => {
    res.json(await pollService.getResults(req.params.publicId));
});

const vote = asyncHandler(async (req, res) => {
    res.status(201).json(await pollService.submitVote(
        req.params.publicId,
        req.user.id,
        req.body.option_id
    ));
});

module.exports = {
    listActive,
    listMine,
    create,
    getByPublicId,
    update,
    publish,
    close,
    removeDraft,
    results,
    vote
};
