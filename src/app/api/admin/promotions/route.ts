import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, blockIfOwnerWrite } from '@/lib/security';
import { createAuditLog } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const auth = requireRole(req, ['Admin', 'Owner']);
    if ('errorResponse' in auth) return auth.errorResponse;

    const promotions = await prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ promotions });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json({ error: 'Gagal mengambil data promosi' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Owner is strictly Read-Only
    const ownerBlock = blockIfOwnerWrite(req);
    if (ownerBlock) return ownerBlock;

    const auth = requireRole(req, ['Admin']);
    if ('errorResponse' in auth) return auth.errorResponse;

    const body = await req.json();
    const {
      title,
      description,
      discountType, // 'PERCENTAGE' | 'FIXED'
      discountValue,
      minPurchase,
      maxDiscount,
      productId,
      categoryId,
      targetCustomerId,
      startDate,
      endDate,
      usageLimit,
      isActive,
    } = body;

    if (!title || !description || discountValue === undefined || !startDate || !endDate) {
      return NextResponse.json({ error: 'Semua kolom wajib diisi dengan lengkap.' }, { status: 400 });
    }

    const promo = await prisma.promotion.create({
      data: {
        title,
        description,
        discountType: discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
        discountValue: parseFloat(discountValue) || 0,
        discountPercent: discountType === 'PERCENTAGE' ? parseFloat(discountValue) : 0,
        minPurchase: parseFloat(minPurchase) || 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        productId: productId || null,
        categoryId: categoryId || null,
        targetCustomerId: targetCustomerId || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        usageLimit: parseInt(usageLimit, 10) || 100,
        usedCount: 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    await createAuditLog({
      userId: auth.user.userId,
      action: 'CREATE_PROMOTION',
      resource: 'PROMOTION',
      details: `Created promotion: ${promo.title} (${promo.discountType} - ${promo.discountValue})`,
    });

    return NextResponse.json({
      message: 'Promosi berhasil dibuat!',
      promotion: promo,
    });
  } catch (error) {
    console.error('Error creating promotion:', error);
    return NextResponse.json({ error: 'Gagal membuat promosi' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const ownerBlock = blockIfOwnerWrite(req);
    if (ownerBlock) return ownerBlock;

    const auth = requireRole(req, ['Admin']);
    if ('errorResponse' in auth) return auth.errorResponse;

    const body = await req.json();
    const { id, ...dataToUpdate } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID promosi wajib disertakan.' }, { status: 400 });
    }

    if (dataToUpdate.startDate) dataToUpdate.startDate = new Date(dataToUpdate.startDate);
    if (dataToUpdate.endDate) dataToUpdate.endDate = new Date(dataToUpdate.endDate);
    if (dataToUpdate.discountValue !== undefined) {
      dataToUpdate.discountValue = parseFloat(dataToUpdate.discountValue);
      if (dataToUpdate.discountType === 'PERCENTAGE') {
        dataToUpdate.discountPercent = dataToUpdate.discountValue;
      }
    }
    if (dataToUpdate.minPurchase !== undefined) {
      dataToUpdate.minPurchase = parseFloat(dataToUpdate.minPurchase);
    }
    if (dataToUpdate.usageLimit !== undefined) {
      dataToUpdate.usageLimit = parseInt(dataToUpdate.usageLimit, 10);
    }

    const updated = await prisma.promotion.update({
      where: { id },
      data: dataToUpdate,
    });

    await createAuditLog({
      userId: auth.user.userId,
      action: 'UPDATE_PROMOTION',
      resource: 'PROMOTION',
      details: `Updated promotion: ${updated.title}`,
    });

    return NextResponse.json({
      message: 'Promosi berhasil diperbarui!',
      promotion: updated,
    });
  } catch (error) {
    console.error('Error updating promotion:', error);
    return NextResponse.json({ error: 'Gagal memperbarui promosi' }, { status: 500 });
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
      return NextResponse.json({ error: 'ID promosi wajib disertakan.' }, { status: 400 });
    }

    const deleted = await prisma.promotion.delete({
      where: { id },
    });

    await createAuditLog({
      userId: auth.user.userId,
      action: 'DELETE_PROMOTION',
      resource: 'PROMOTION',
      details: `Deleted promotion: ${deleted.title}`,
    });

    return NextResponse.json({ message: 'Promosi berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    return NextResponse.json({ error: 'Gagal menghapus promosi' }, { status: 500 });
  }
}
