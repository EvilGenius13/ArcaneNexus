import { Router } from 'express';
import infraRouter from './infra';
import filesRouter from './files'
import manifestRouter from './manifest';

const router = Router();

// Mounts
router.use('/infra', infraRouter);
router.use('/files', filesRouter)
router.use('/manifest', manifestRouter);

export default router;