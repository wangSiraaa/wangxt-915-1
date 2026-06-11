import { BlacklistDAO } from '../dao/BlacklistDAO.js';
import type { BlacklistItem } from '../../shared/types.js';

export const BlacklistService = {
  addBlacklist(plateNumber: string, reason: string): BlacklistItem {
    const plate = plateNumber.trim().toUpperCase();
    const existing = BlacklistDAO.findByPlateNumber(plate);
    if (existing) {
      throw new Error('该车牌已在黑名单中');
    }
    return BlacklistDAO.add(plate, reason);
  },

  removeBlacklist(id: string): boolean {
    return BlacklistDAO.remove(id);
  },

  listBlacklist(): BlacklistItem[] {
    return BlacklistDAO.list();
  },

  checkBlacklist(plateNumber: string): BlacklistItem | null {
    return BlacklistDAO.findByPlateNumber(plateNumber.trim().toUpperCase());
  },

  isBlacklisted(plateNumber: string): boolean {
    return BlacklistDAO.isBlacklisted(plateNumber.trim().toUpperCase());
  },
};
