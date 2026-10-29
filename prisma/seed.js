// @ts-nocheck
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    // 1. Clear existing data
    await prisma.auditLog.deleteMany();
    await prisma.orderStatusHistory.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.orderItemTopping.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.voucher.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.recipe.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.topping.deleteMany();
    await prisma.ingredient.deleteMany();
    await prisma.table.deleteMany();
    await prisma.customerProfile.deleteMany();
    await prisma.user.deleteMany();
    await prisma.branch.deleteMany();
    await prisma.role.deleteMany();
    // 2. Create Roles
    const roles = [
        { name: 'Customer', description: 'Pelanggan umum atau guest' },
        { name: 'Cashier', description: 'Kasir yang menerima dan mengonfirmasi pesanan' },
        { name: 'Barista', description: 'Barista/Dapur yang membuat pesanan' },
        { name: 'Admin', description: 'Administrator sistem' },
        { name: 'Owner', description: 'Pemilik bisnis dengan akses analytics' },
    ];
    const createdRoles = {};
    for (const r of roles) {
        const created = await prisma.role.create({ data: r });
        createdRoles[r.name] = created.id;
    }
    console.log('✅ Created roles:', Object.keys(createdRoles));
    // 3. Create Main Branch
    const branch = await prisma.branch.create({
        data: {
            code: 'KM-01',
            name: 'Kopi Mahasiswa Kampus Utama',
            address: 'Jl. Ganesha No. 10, Bandung (Dekat Gerbang Utama)',
            phone: '0812-3456-7890',
            isActive: true,
        },
    });
    console.log('✅ Created branch:', branch.name);
    // 4. Create Tables (Meja 01 - 20)
    const tablesData = Array.from({ length: 20 }, (_, i) => {
        const num = (i + 1).toString().padStart(2, '0');
        return {
            branchId: branch.id,
            number: `Meja ${num}`,
            capacity: i % 4 === 0 ? 6 : 4,
            status: 'AVAILABLE',
        };
    });
    await prisma.table.createMany({ data: tablesData });
    console.log('✅ Created 20 tables');
    // 5. Create Staff Accounts
    const defaultPassword = await bcryptjs_1.default.hash('password123', 10);
    const staffUsers = [
        {
            email: 'admin@kopimahasiswa.id',
            name: 'Admin Mahasiswa',
            passwordHash: defaultPassword,
            roleId: createdRoles['Admin'],
            branchId: branch.id,
            phone: '08111111111',
        },
        {
            email: 'cashier@kopimahasiswa.id',
            name: 'Kasir Siti',
            passwordHash: defaultPassword,
            roleId: createdRoles['Cashier'],
            branchId: branch.id,
            phone: '08222222222',
        },
        {
            email: 'barista@kopimahasiswa.id',
            name: 'Barista Budi',
            passwordHash: defaultPassword,
            roleId: createdRoles['Barista'],
            branchId: branch.id,
            phone: '08333333333',
        },
        {
            email: 'owner@kopimahasiswa.id',
            name: 'Pak Owner',
            passwordHash: defaultPassword,
            roleId: createdRoles['Owner'],
            branchId: branch.id,
            phone: '08444444444',
        },
        {
            email: 'customer@kopimahasiswa.id',
            name: 'Pelanggan Setia',
            passwordHash: defaultPassword,
            roleId: createdRoles['Customer'],
            branchId: branch.id,
            phone: '08555555555',
        },
    ];
    for (const u of staffUsers) {
        const createdUser = await prisma.user.create({ data: u });
        if (u.roleId === createdRoles['Customer']) {
            await prisma.customerProfile.create({
                data: {
                    userId: createdUser.id,
                    points: 150,
                    favoriteBranchId: branch.id,
                },
            });
        }
    }
    console.log('✅ Created staff and customer accounts (password: password123)');
    // 6. Create Toppings
    const toppingsData = [
        { name: 'Extra Shot Espresso', price: 5000 },
        { name: 'Oat Milk (Sub Milk)', price: 7000 },
        { name: 'Brown Sugar Boba', price: 4000 },
        { name: 'Salted Caramel Syrup', price: 4000 },
        { name: 'Whipped Cream', price: 4000 },
        { name: 'Grass Jelly', price: 3000 },
    ];
    for (const t of toppingsData) {
        await prisma.topping.create({ data: t });
    }
    console.log('✅ Created toppings');
    // 7. Create Categories & Products
    const categories = [
        { name: 'Promo Mahasiswa', slug: 'promo-mahasiswa', icon: 'zap', displayOrder: 1 },
        { name: 'Milk Coffee', slug: 'milk-coffee', icon: 'cup-soda', displayOrder: 2 },
        { name: 'Espresso Series', slug: 'espresso-series', icon: 'coffee', displayOrder: 3 },
        { name: 'Non-Coffee & Tea', slug: 'non-coffee', icon: 'sparkles', displayOrder: 4 },
        { name: 'Snack & Pastry', slug: 'snack-pastry', icon: 'cookie', displayOrder: 5 },
    ];
    const categoryMap = {};
    for (const c of categories) {
        const created = await prisma.category.create({ data: c });
        categoryMap[c.slug] = created.id;
    }
    const productsData = [
        // Promo Mahasiswa
        {
            categoryId: categoryMap['promo-mahasiswa'],
            name: 'Paket Skripsi Begadang',
            slug: 'paket-skripsi-begadang',
            description: 'Combo Kopi Susu Gula Aren Double Shot + Croissant Mentega Panas. Hemat & Ampuh Tahan Kantuk!',
            basePrice: 28000,
            image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
            isBestSeller: true,
            variants: [
                { name: 'Iced Regular', priceAdjustment: 0 },
                { name: 'Iced Large', priceAdjustment: 4000 },
            ],
        },
        {
            categoryId: categoryMap['promo-mahasiswa'],
            name: 'Kopi Susu Mahasiswa (KSM)',
            slug: 'kopi-susu-mahasiswa',
            description: 'Kopi susu khas racikan mahasiswa dengan espresso bold dan manis gurih gula aren murni.',
            basePrice: 15000,
            image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80',
            isBestSeller: true,
            variants: [
                { name: 'Iced Regular', priceAdjustment: 0 },
                { name: 'Iced Large', priceAdjustment: 3000 },
                { name: 'Hot Regular', priceAdjustment: 0 },
            ],
        },
        // Milk Coffee
        {
            categoryId: categoryMap['milk-coffee'],
            name: 'Caramel Macchiato Mahasiswa',
            slug: 'caramel-macchiato-mahasiswa',
            description: 'Espresso racikan segar dengan susu hangat, syrup vanilla, dan siraman saus karamel mewah.',
            basePrice: 22000,
            image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=600&auto=format&fit=crop&q=80',
            isBestSeller: true,
            variants: [
                { name: 'Iced Regular', priceAdjustment: 0 },
                { name: 'Iced Large', priceAdjustment: 4000 },
                { name: 'Hot Regular', priceAdjustment: 0 },
            ],
        },
        {
            categoryId: categoryMap['milk-coffee'],
            name: 'Hazelnut Cream Latte',
            slug: 'hazelnut-cream-latte',
            description: 'Perpaduan lembut espresso, aroma hazelnut manis, dan foam susu gurih melimpah.',
            basePrice: 21000,
            image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=600&auto=format&fit=crop&q=80',
            isBestSeller: false,
            variants: [
                { name: 'Iced Regular', priceAdjustment: 0 },
                { name: 'Iced Large', priceAdjustment: 4000 },
            ],
        },
        {
            categoryId: categoryMap['milk-coffee'],
            name: 'Pandan Aren Latte',
            slug: 'pandan-aren-latte',
            description: 'Cita rasa lokal harum ekstrak pandan suji berpadu manisnya gula aren & kopi pilihan.',
            basePrice: 20000,
            image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
            isBestSeller: false,
            variants: [
                { name: 'Iced Regular', priceAdjustment: 0 },
                { name: 'Iced Large', priceAdjustment: 3000 },
            ],
        },
        // Espresso Series
        {
            categoryId: categoryMap['espresso-series'],
            name: 'Americano Double Shot',
            slug: 'americano-double-shot',
            description: 'Espresso murni 100% Arabika pilihan dengan air mineral segar. Bersih, asam seimbang, dan menyegarkan.',
            basePrice: 16000,
            image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
            isBestSeller: false,
            variants: [
                { name: 'Iced Regular', priceAdjustment: 0 },
                { name: 'Iced Large', priceAdjustment: 3000 },
                { name: 'Hot Regular', priceAdjustment: 0 },
            ],
        },
        {
            categoryId: categoryMap['espresso-series'],
            name: 'Classic Caffe Latte',
            slug: 'classic-caffe-latte',
            description: 'Kombinasi klasik 1 shot espresso halus dan steamed milk creamy khas barista.',
            basePrice: 19000,
            image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&auto=format&fit=crop&q=80',
            isBestSeller: false,
            variants: [
                { name: 'Hot Regular', priceAdjustment: 0 },
                { name: 'Iced Regular', priceAdjustment: 2000 },
            ],
        },
        // Non-Coffee & Tea
        {
            categoryId: categoryMap['non-coffee'],
            name: 'Matcha Green Tea Latte',
            slug: 'matcha-green-tea-latte',
            description: 'Matcha khas Uji Jepang kualitas premium dikocok halus dengan susu segar creamy.',
            basePrice: 22000,
            image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80',
            isBestSeller: true,
            variants: [
                { name: 'Iced Regular', priceAdjustment: 0 },
                { name: 'Iced Large', priceAdjustment: 4000 },
                { name: 'Hot Regular', priceAdjustment: 0 },
            ],
        },
        {
            categoryId: categoryMap['non-coffee'],
            name: 'Artisan Chocolate Signature',
            slug: 'artisan-chocolate-signature',
            description: 'Cokelat hitam Belgia rich & bitter-sweet dengan susu segar hangat atau dingin.',
            basePrice: 20000,
            image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600&auto=format&fit=crop&q=80',
            isBestSeller: false,
            variants: [
                { name: 'Iced Regular', priceAdjustment: 0 },
                { name: 'Iced Large', priceAdjustment: 3000 },
                { name: 'Hot Regular', priceAdjustment: 0 },
            ],
        },
        // Snack & Pastry
        {
            categoryId: categoryMap['snack-pastry'],
            name: 'Butter Croissant Crispy',
            slug: 'butter-croissant-crispy',
            description: 'Pastry renyah berlapis dengan aroma butter Prancis melimpah. Dipanggang hangat.',
            basePrice: 16000,
            image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
            isBestSeller: true,
            variants: [
                { name: 'Original Warm', priceAdjustment: 0 },
            ],
        },
        {
            categoryId: categoryMap['snack-pastry'],
            name: 'Kentang Goreng Keju Bumbu',
            slug: 'kentang-goreng-keju',
            description: 'French fries garing ditaburi bumbu keju spesial & saus mayo gurih.',
            basePrice: 15000,
            image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80',
            isBestSeller: false,
            variants: [
                { name: 'Regular Size', priceAdjustment: 0 },
            ],
        },
    ];
    for (const p of productsData) {
        const { variants, ...productInfo } = p;
        const createdProduct = await prisma.product.create({
            data: productInfo,
        });
        if (variants && variants.length > 0) {
            for (const v of variants) {
                await prisma.productVariant.create({
                    data: {
                        productId: createdProduct.id,
                        name: v.name,
                        priceAdjustment: v.priceAdjustment,
                    },
                });
            }
        }
    }
    console.log('✅ Created products & variants');
    // 8. Create Vouchers
    const vouchers = [
        {
            code: 'MAHASISWAHEMAT',
            discountAmount: 5000,
            minSpend: 20000,
            quota: 500,
            expiryDate: new Date('2027-12-31'),
        },
        {
            code: 'DISKON10K',
            discountAmount: 10000,
            minSpend: 35000,
            quota: 200,
            expiryDate: new Date('2027-12-31'),
        },
        {
            code: 'KOPIPERTAMA',
            discountAmount: 7000,
            minSpend: 25000,
            quota: 300,
            expiryDate: new Date('2027-12-31'),
        },
    ];
    for (const v of vouchers) {
        await prisma.voucher.create({ data: v });
    }
    console.log('✅ Created promo vouchers');
    console.log('🚀 Seed completed successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
