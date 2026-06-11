import { Router, type Request, type Response } from 'express';
import { BlacklistService } from '../services/BlacklistService.js';

const router = Router();

router.get('/', (_req: Request, res: Response): void => {
  try {
    const blacklist = BlacklistService.listBlacklist();
    res.json({
      success: true,
      data: blacklist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

router.post('/', (req: Request, res: Response): void => {
  try {
    const { plateNumber, reason } = req.body;

    if (!plateNumber || !reason) {
      res.status(400).json({
        success: false,
        error: '车牌号和原因不能为空',
      });
      return;
    }

    const item = BlacklistService.addBlacklist(plateNumber, reason);
    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const deleted = BlacklistService.removeBlacklist(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: '记录不存在',
      });
      return;
    }

    res.json({
      success: true,
      message: '已从黑名单移除',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

router.get('/check/:plateNumber', (req: Request, res: Response): void => {
  try {
    const { plateNumber } = req.params;
    const item = BlacklistService.checkBlacklist(plateNumber);

    res.json({
      success: true,
      data: {
        isBlacklisted: !!item,
        item: item || null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default router;
