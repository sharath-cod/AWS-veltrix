const { Router } = require('express');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const controller = require('../controllers/hurdle3.controller');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

const langEnum = z.enum(['en', 'hi', 'kn']);

const deltaSchema = z.object({
  body: z.object({
    // { slug: hash } exactly as returned by /pack/manifest
    known: z.record(z.string()).default({}),
    // optional: the phone's own old copies, so the server can say "what changed"
    previous: z.record(z.unknown()).nullish(),
    language: langEnum.default('en'),
  }),
});

const diffSchema = z.object({
  body: z.object({
    before: z.record(z.unknown()).nullish(),
    after: z.record(z.unknown()).nullish(),
    language: langEnum.default('en'),
  }),
});

const readbackSchema = z.object({
  body: z.object({
    text: z.string().trim().min(1).max(2000),
    language: langEnum.default('en'),
    fromSpeech: z.boolean().default(true),
    profile: z.record(z.unknown()).default({}),
  }),
});

const confirmSchema = z.object({
  body: z.object({
    id: z.string().trim().min(3).max(64),
    action: z.enum(['confirm', 'correct', 'cancel']).default('confirm'),
    corrected: z.record(z.unknown()).default({}),
  }),
});

const probeSchema = z.object({
  query: z.object({
    text: z.string().trim().min(1).max(500),
    language: langEnum.default('en'),
  }),
});

router.get('/pack/manifest', asyncHandler(controller.manifest));
router.post('/pack/delta', validate(deltaSchema), asyncHandler(controller.delta));
router.post('/pack/diff', validate(diffSchema), asyncHandler(controller.diff));
router.post('/readback', validate(readbackSchema), asyncHandler(controller.readback));
router.post('/confirm', validate(confirmSchema), asyncHandler(controller.confirm));
router.get('/freshness/policy', asyncHandler(controller.policy));
router.get('/language/probe', validate(probeSchema), asyncHandler(controller.probe));

module.exports = router;
