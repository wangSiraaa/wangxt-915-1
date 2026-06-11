import { Router, type Request, type Response } from 'express';
import { AppointmentService } from '../services/AppointmentService.js';
import { VisitRecordDAO } from '../dao/VisitRecordDAO.js';

const router = Router();

router.post('/entry', (req: Request, res: Response): void => {
  try {
    const { plateNumber, confirm } = req.body;

    if (!plateNumber) {
      res.status(400).json({
        success: false,
        error: '请输入车牌号',
      });
      return;
    }

    const result = AppointmentService.verifyEntry(plateNumber);

    if (confirm && result.success && result.appointment) {
      const updated = AppointmentService.confirmEntry(plateNumber);
      if (updated) {
        VisitRecordDAO.createEntry(
          updated.id,
          updated.plateNumber!,
          updated.visitorName,
          updated.entryTime!
        );
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
    const { plateNumber, confirm } = req.body;

    if (!plateNumber) {
      res.status(400).json({
        success: false,
        error: '请输入车牌号',
      });
      return;
    }

    const result = AppointmentService.verifyExit(plateNumber);

    if (confirm && result.success && result.appointment) {
      const updated = AppointmentService.confirmExit(plateNumber);
      if (updated) {
        const activeRecord = VisitRecordDAO.findActiveByPlate(plateNumber.trim().toUpperCase());
        if (activeRecord) {
          VisitRecordDAO.setExitTime(activeRecord.id, updated.exitTime!);
        }
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
