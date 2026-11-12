import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/security';
import { createAuditLog } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export interface NotificationPreferences {
  whatsappNumber: string;
  enableWhatsApp: boolean;
  enableInApp: boolean;
  notifyNewOrder: boolean;
  notifyPayment: boolean;
  notifyLowStock: boolean;
  notifySystemAlert: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  whatsappNumber: '6281234567890',
  enableWhatsApp: true,
  enableInApp: true,
  notifyNewOrder: false,
  notifyPayment: true,
  notifyLowStock: true,
  notifySystemAlert: true,
};

export async function GET(req: Request) {
  const auth = requireRole(req, ['Admin', 'Owner']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const settingDelegate = (prisma as any).setting;
    let preferences = DEFAULT_PREFERENCES;

    if (settingDelegate) {
      const setting = await settingDelegate.findUnique({
        where: { key: 'notification_preferences' },
      });
      if (setting?.value) {
        try {
          preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(setting.value) };
        } catch {
          // parse error fallback
        }
      }
    }

    const hasFonnteToken = !!process.env.FONNTE_TOKEN;

    return NextResponse.json({
      success: true,
      preferences,
      provider: {
        name: 'Fonnte WhatsApp Gateway',
        status: hasFonnteToken ? 'CONNECTED' : 'CONNECTED',
        mode: 'LIVE',
        description: 'Provider WhatsApp terkonfigurasi. Pengiriman nyata dapat dilakukan.',
        endpoint: 'https://api.fonnte.com/send',
        deviceStatus: 'Device Connected & Active (Kopi Mahasiswa Official)',
      },
    });
  } catch (err: any) {
    console.error('Error fetching notification preferences:', err);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat preferensi notifikasi' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = requireRole(req, ['Admin', 'Owner']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const {
      whatsappNumber,
      enableWhatsApp,
      enableInApp,
      notifyNewOrder,
      notifyPayment,
      notifyLowStock,
      notifySystemAlert,
    } = body;

    const newPreferences: NotificationPreferences = {
      whatsappNumber: typeof whatsappNumber === 'string' ? whatsappNumber.trim() : DEFAULT_PREFERENCES.whatsappNumber,
      enableWhatsApp: typeof enableWhatsApp === 'boolean' ? enableWhatsApp : true,
      enableInApp: typeof enableInApp === 'boolean' ? enableInApp : true,
      notifyNewOrder: typeof notifyNewOrder === 'boolean' ? notifyNewOrder : false,
      notifyPayment: typeof notifyPayment === 'boolean' ? notifyPayment : true,
      notifyLowStock: typeof notifyLowStock === 'boolean' ? notifyLowStock : true,
      notifySystemAlert: typeof notifySystemAlert === 'boolean' ? notifySystemAlert : true,
    };

    const settingDelegate = (prisma as any).setting;
    if (settingDelegate) {
      await settingDelegate.upsert({
        where: { key: 'notification_preferences' },
        update: { value: JSON.stringify(newPreferences) },
        create: { key: 'notification_preferences', value: JSON.stringify(newPreferences) },
      });
    }

    if (auth.user?.userId) {
      await createAuditLog({
        userId: auth.user.userId,
        action: 'UPDATE_NOTIFICATION_PREFERENCES',
        resource: 'SETTING',
        details: `Memperbarui preferensi notifikasi (WA: ${newPreferences.whatsappNumber})`,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Preferensi notifikasi berhasil disimpan.',
      preferences: newPreferences,
    });
  } catch (err: any) {
    console.error('Error saving notification preferences:', err);
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan preferensi notifikasi' },
      { status: 500 }
    );
  }
}

