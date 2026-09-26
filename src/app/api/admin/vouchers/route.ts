import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, blockIfOwnerWrite } from '@/lib/security';
import { createAuditLog } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const auth = requireRole(req, ['Admin', 'Owner']);
    if ('errorResponse' in auth) return auth.errorResponse;

    const vouchers = await prisma.voucher.findMany({
      include: {
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ vouchers });
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    return NextResponse.json({ error: 'Gagal mengambil data voucher' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ownerBlock = blockIfOwnerWrite(req);
    if (ownerBlock) return ownerBlock;

    const auth = requireRole(req, ['Admin']);
    if ('errorResponse' in auth) return auth.errorResponse;

    const body = await req.json();
    const {
      code,
      discountType,
      discountAmount,
      minSpend,
      maxDiscount,
      quota,
      expiryDate,
      isActive,
    } = body;

    if (!code || discountAmount === undefined || !expiryDate) {
      return NextResponse.json({ error: 'Kode voucher, nominal diskon, dan tanggal kedaluwarsa wajib diisi' }, { status: 400 });
    }

    const cleanCode = String(code).trim().toUpperCase();

    const voucher = await prisma.voucher.create({
      data: {
        code: cleanCode,
        discountType: discountType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED',
        discountAmount: parseFloat(discountAmount) || 0,
        minSpend: parseFloat(minSpend) || 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        quota: parseInt(quota, 10) || 100,
        usedCount: 0,
        expiryDate: new Date(expiryDate),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    await createAuditLog({
      userId: auth.user.userId,
      action: 'CREATE_VOUCHER',
      resource: 'VOUCHER',
      details: `Created voucher: ${voucher.code} (${voucher.discountType} - Rp ${voucher.discountAmount})`,
    });

    return NextResponse.json({ message: 'Voucher berhasil dibuat!', voucher }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating voucher:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Kode voucher tersebut sudah terdaftar' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal membuat voucher' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const ownerBlock = blockIfOwnerWrite(req);
    if (ownerBlock) return ownerBlock;

    const auth = requireRole(req, ['Admin']);
    if ('errorResponse' in auth) return auth.errorResponse;

    const body = await req.json();
    const { id, code, discountType, discountAmount, minSpend, maxDiscount, quota, expiryDate, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID voucher wajib disertakan' }, { status: 400 });
    }

    const updated = await prisma.voucher.update({
      where: { id },
      data: {
        ...(code && { code: String(code).trim().toUpperCase() }),
        ...(discountType && { discountType: discountType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED' }),
        ...(discountAmount !== undefined && { discountAmount: parseFloat(discountAmount) }),
        ...(minSpend !== undefined && { minSpend: parseFloat(minSpend) }),
        ...(maxDiscount !== undefined && { maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null }),
        ...(quota !== undefined && { quota: parseInt(quota, 10) }),
        ...(expiryDate && { expiryDate: new Date(expiryDate) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    await createAuditLog({
      userId: auth.user.userId,
      action: 'UPDATE_VOUCHER',
      resource: 'VOUCHER',
      details: `Updated voucher: ${updated.code}`,
    });

    return NextResponse.json({ message: 'Voucher berhasil diperbarui', voucher: updated });
  } catch (error) {
    console.error('Error updating voucher:', error);
    return NextResponse.json({ error: 'Gagal memperbarui voucher' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const ownerBlock = blockIfOwnerWrite(req);
    if (ownerBlock) return ownerBlock;

    const auth = requireRole(req, ['Admin']);
    if ('errorResponse' in auth) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID voucher wajib disertakan' }, { status: 400 });
    }

    const deleted = await prisma.voucher.delete({
      where: { id },
    });

    await createAuditLog({
      userId: auth.user.userId,
      action: 'DELETE_VOUCHER',
      resource: 'VOUCHER',
      details: `Deleted voucher: ${deleted.code}`,
    });

    return NextResponse.json({ message: 'Voucher berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting voucher:', error);
    return NextResponse.json({ error: 'Gagal menghapus voucher' }, { status: 500 });
  }
}
