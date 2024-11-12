import { Router } from 'express';
import infraRouter from './infra';
import filesRouter from './files'

const router = Router();

// Mounts
router.use('/infra', infraRouter);
router.use('/files', filesRouter)

export default router;