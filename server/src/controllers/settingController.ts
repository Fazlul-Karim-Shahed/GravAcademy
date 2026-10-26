import { Request, Response } from 'express';
import { Setting } from '../models/Setting';

export const getSiteSettings = async (req: Request, res: Response) => {
  try {
    const settingsDocs = await Setting.find({});
    const settingsMap: Record<string, any> = {};
    settingsDocs.forEach((doc) => {
      settingsMap[doc.key] = doc.value;
    });

    res.status(200).json({
      success: true,
      data: {
        siteName: settingsMap['siteName'] || 'Grav Academy',
        siteTagline: settingsMap['siteTagline'] || 'ক্লাস ৬ – ১২ একাডেমিক কেয়ার',
        logoUrl: settingsMap['logoUrl'] || '',
        ...settingsMap,
      },
    });
  } catch (error: any) {
    console.error('Failed to get settings:', error);
    res.status(500).json({ success: false, message: 'সেটিংস লোড করতে সমস্যা হয়েছে।' });
  }
};

export const updateSiteSettings = async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, message: 'অবৈধ সেটিংস ডেটা।' });
    }

    const promises = Object.entries(updates).map(([key, value]) =>
      Setting.findOneAndUpdate(
        { key },
        { key, value },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    );

    await Promise.all(promises);

    const allSettings = await Setting.find({});
    const settingsMap: Record<string, any> = {};
    allSettings.forEach((doc) => {
      settingsMap[doc.key] = doc.value;
    });

    res.status(200).json({
      success: true,
      message: 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে।',
      data: settingsMap,
    });
  } catch (error: any) {
    console.error('Failed to update settings:', error);
    res.status(500).json({ success: false, message: 'সেটিংস আপডেট করতে ব্যর্থ হয়েছে।' });
  }
};
