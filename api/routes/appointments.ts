import { Router, type Request, type Response } from 'express';
import { AppointmentService } from '../services/AppointmentService.js';

const router = Router();

router.get('/', (req: Request, res: Response): void => {
  try {
    const { status, employeePhone } = req.query;
    const options: { status?: string; employeePhone?: string } = {};
    if (status) options.status = status as string;
    if (employeePhone) options.employeePhone = employeePhone as string;

    const appointments = AppointmentService.listAppointments(options);
    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const appointment = AppointmentService.getAppointment(id);

    if (!appointment) {
      res.status(404).json({
        success: false,
        error: '预约不存在',
      });
      return;
    }

    res.json({
      success: true,
      data: appointment,
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
    const appointment = AppointmentService.createAppointment(req.body);
    res.status(201).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

const updateVisitorHandler = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const appointment = AppointmentService.updateVisitorInfo(id, req.body);

    if (!appointment) {
      res.status(404).json({
        success: false,
        error: '预约不存在',
      });
      return;
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

router.put('/:id', updateVisitorHandler);
router.put('/:id/visitor', updateVisitorHandler);

router.put('/:id/cancel', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const appointment = AppointmentService.cancelAppointment(id);

    if (!appointment) {
      res.status(404).json({
        success: false,
        error: '预约不存在',
      });
      return;
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default router;
