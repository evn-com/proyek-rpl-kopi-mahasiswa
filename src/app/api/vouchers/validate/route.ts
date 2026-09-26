import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { code, subtotal = 0, items = [], customerId } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Kode voucher tidak boleh kosong.' }, { status: 400 });
    }

    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!voucher || !voucher.isActive) {
      return NextResponse.json({ error: 'Kode voucher tidak ditemukan atau tidak aktif.' }, { status: 404 });
    }

    const now = new Date();

    if (voucher.startDate && new Date(voucher.startDate) > now) {
      return NextResponse.json({ error: 'Voucher promosi belum dapat digunakan saat ini.' }, { status: 400 });
    }

    if (new Date(voucher.expiryDate) < now) {
      return NextResponse.json({ error: 'Voucher telah kadaluarsa (expired).' }, { status: 400 });
    }

    if (voucher.usedCount >= voucher.quota) {
      return NextResponse.json({ error: 'Kuota batas penggunaan voucher ini sudah habis.' }, { status: 400 });
    }

    if (subtotal < voucher.minSpend) {
      return NextResponse.json({
        error: `Minimal belanja untuk voucher ini adalah Rp ${voucher.minSpend.toLocaleString('id-ID')}.`,
      }, { status: 400 });
    }

    // Customer-specific validation
    if (voucher.targetCustomerId && voucher.targetCustomerId !== customerId) {
      return NextResponse.json({
        error: 'Voucher ini khusus untuk akun pelanggan tertentu.',
      }, { status: 400 });
    }

    // Product-specific or Category-specific validation if items are provided
    if (voucher.productId && items.length > 0) {
      const hasProduct = items.some((item: any) => (item.product?.id || item.productId) === voucher.productId);
      if (!hasProduct) {
        return NextResponse.json({
          error: 'Voucher ini hanya berlaku untuk produk tertentu yang belum ada di keranjang Anda.',
        }, { status: 400 });
      }
    }

    if (voucher.categoryId && items.length > 0) {
      const productIds = items.map((i: any) => i.product?.id || i.productId);
      const matchedProducts = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          categoryId: voucher.categoryId,
        },
      });

      if (matchedProducts.length === 0) {
        return NextResponse.json({
          error: 'Voucher ini hanya berlaku untuk kategori produk tertentu.',
        }, { status: 400 });
      }
    }

    // Calculate actual discount
    let finalDiscount = voucher.discountAmount;
    if (voucher.discountType === 'PERCENTAGE') {
      finalDiscount = (subtotal * voucher.discountAmount) / 100;
      if (voucher.maxDiscount && finalDiscount > voucher.maxDiscount) {
        finalDiscount = voucher.maxDiscount;
      }
    }

    finalDiscount = Math.min(finalDiscount, subtotal);

    return NextResponse.json({
      message: 'Voucher berhasil dipasang!',
      voucher: {
        id: voucher.id,
        code: voucher.code,
        discountType: voucher.discountType,
        discountAmount: finalDiscount,
      },
    });
  } catch (error) {
    console.error('Error validating voucher:', error);
    return NextResponse.json({ error: 'Gagal memvalidasi voucher.' }, { status: 500 });
  }
}
