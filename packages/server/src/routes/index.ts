import { Router } from 'express';
import infraRouter from './infra';
import filesRouter from './files'
import manifestRouter from './manifest';
import gamesRouter from './games';
import mediaRouter from './media';

const router = Router();

// Mounts
router.use('/infra', infraRouter);
router.use('/files', filesRouter)
router.use('/manifest', manifestRouter);
router.use('/games', gamesRouter);
router.use('/media', mediaRouter);

export default router;