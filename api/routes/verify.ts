import { Router, type Request, type Response } from 'express';
import { AppointmentService } from '../services/AppointmentService.js';
import { VisitRecordDAO } from '../dao/VisitRecordDAO.js';

const router = Router();

router.post('/entry', (req: Request, res: Response): void => {
  try {
    const { plateNumber, confirm, gate } = req.body;

    if (!plateNumber) {
      res.status(400).json({
        success: false,
        error: '请输入车牌号',
      });
      return;
    }

    const result = AppointmentService.verifyEntry(plateNumber, gate);

    if (confirm && result.success && result.appointment) {
      const updated = AppointmentService.confirmEntry(plateNumber, gate);
      if (updated) {
        result.appointment = updated;
      }
    }

    res.json({
      success: true,
      data: {
        success: result.success,
        appointment: result.appointment,
        rejectType: result.rejectType,
        rejectReason: result.rejectReason,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

router.post('/exit', (req: Request, res: Response): void => {
  try {
    const { plateNumber, confirm, gate } = req.body;

    if (!plateNumber) {
      res.status(400).json({
        success: false,
        error: '请输入车牌号',
      });
      return;
    }

    const result = AppointmentService.verifyExit(plateNumber, gate);

    if (confirm && result.success && result.appointment) {
      const updated = AppointmentService.confirmExit(plateNumber, gate);
      if (updated) {
        result.appointment = updated;
      }
    }

    res.json({
      success: true,
      data: {
        success: result.success,
        appointment: result.appointment,
        rejectType: result.rejectType,
        rejectReason: result.rejectReason,
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
