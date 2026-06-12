import { Router, type Request, type Response } from 'express';
import { ExtensionService } from '../services/ExtensionService.js';
import { AppointmentService } from '../services/AppointmentService.js';

const router = Router();

router.get('/', (req: Request, res: Response): void => {
  try {
    const { status } = req.query;
    const options: { status?: string } = {};
    if (status) options.status = status as string;

    const extensions = ExtensionService.listExtensions(options);
    res.json({
      success: true,
      data: extensions,
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
    const extension = ExtensionService.getExtension(id);

    if (!extension) {
      res.status(404).json({
        success: false,
        error: '延期申请不存在',
      });
      return;
    }

    res.json({
      success: true,
      data: extension,
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
    const { operator, operatorRole, ...body } = req.body;
    const extension = ExtensionService.createExtensionRequest(
      body,
      operator || 'employee',
      operatorRole || 'employee'
    );
    res.status(201).json({
      success: true,
      data: extension,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

router.post('/:id/approve', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { approver, approverRole } = req.body;

    const result = ExtensionService.approveExtension(
      id,
      approver || 'security_supervisor',
      approverRole || 'security_supervisor'
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

router.post('/:id/reject', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { approver, rejectReason, approverRole } = req.body;

    if (!rejectReason) {
      res.status(400).json({
        success: false,
        error: '请填写拒绝原因',
      });
      return;
    }

    const result = ExtensionService.rejectExtension(
      id,
      approver || 'security_supervisor',
      rejectReason,
      approverRole || 'security_supervisor'
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

router.get('/appointment/:appointmentId', (req: Request, res: Response): void => {
  try {
    const { appointmentId } = req.params;
    const extensions = ExtensionService.getExtensionsByAppointment(appointmentId);
    res.json({
      success: true,
      data: extensions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

router.get('/timeline/:appointmentId', (req: Request, res: Response): void => {
  try {
    const { appointmentId } = req.params;
    const timeline = ExtensionService.getTimeline(appointmentId);
    res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

router.get('/park-closing-time', (_req: Request, res: Response): void => {
  try {
    const closingTime = ExtensionService.getParkClosingTime();
    res.json({
      success: true,
      data: closingTime,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

router.post('/detect-detained', (_req: Request, res: Response): void => {
  try {
    const detained = AppointmentService.detectAndMarkDetained();
    res.json({
      success: true,
      data: {
        count: detained.length,
        appointments: detained,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

router.get('/detained/list', (_req: Request, res: Response): void => {
  try {
    const detained = AppointmentService.listDetainedAppointments();
    res.json({
      success: true,
      data: detained,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

router.get('/appointment/:id/details', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const details = AppointmentService.getAppointmentWithDetails(id);

    if (!details.appointment) {
      res.status(404).json({
        success: false,
        error: '预约不存在',
      });
      return;
    }

    res.json({
      success: true,
      data: details,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default router;
