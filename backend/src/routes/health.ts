import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    ok: true,
    mockContext: process.env.MOCK_CONTEXT === 'true',
    mockLlm: process.env.MOCK_LLM === 'true'
  });
});

export default router;
