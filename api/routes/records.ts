import { Router, type Request, type Response } from 'express';
import { RecordService } from '../services/RecordService.js';

const router = Router();

router.get('/records', (req: Request, res: Response): void => {
  try {
    const { date, status } = req.query;
    const options: { date?: string; status?: 'entered' | 'exited' } = {};
    if (date) options.date = date as string;
    if (status) options.status = status as 'entered' | 'exited';

    const records = RecordService.listRecords(options);
    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

router.get('/records/today', (_req: Request, res: Response): void => {
  try {
    const records = RecordService.listTodayRecords();
    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

router.get('/stats/today', (_req: Request, res: Response): void => {
  try {
    const stats = RecordService.getTodayStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

router.get('/audit/plate-changes', (req: Request, res: Response): void => {
  try {
    const { appointmentId } = req.query;
    const audits = RecordService.getPlateChangeAudits(
      appointmentId as string | undefined
    );
    res.json({
      success: true,
      data: audits,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

router.get('/reject-records', (req: Request, res: Response): void => {
  try {
    const { plateNumber, type } = req.query;
    const options: { plateNumber?: string; type?: string } = {};
    if (plateNumber) options.plateNumber = plateNumber as string;
    if (type) options.type = type as string;

    const records = RecordService.getRejectRecords(options);
    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default router;
