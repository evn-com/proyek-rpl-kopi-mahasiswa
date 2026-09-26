import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 Starting 6-Step Verification Test...\n');

  // STEP 1: Create Product
  console.log('--- Step 1: Create Product ---');
  const category = await prisma.category.findFirst({ where: { slug: 'milk-coffee' } });
  if (!category) throw new Error('Category milk-coffee not found');

  const testProduct = await prisma.product.create({
    data: {
      name: 'Kopi Susu Tester BOM',
      slug: 'kopi-susu-tester-bom-' + Date.now(),
      description: 'Produk pengujian kalkulasi resep BOM',
      basePrice: 18000,
      categoryId: category.id,
      image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
    },
  });
  console.log(`✅ Product created: ${testProduct.name} (ID: ${testProduct.id})`);

  // STEP 2: Create Ingredients
  console.log('\n--- Step 2: Create Ingredients ---');
  const kopiIng = await prisma.ingredient.create({
    data: {
      name: 'Biji Kopi Tester ' + Date.now(),
      unit: 'gram',
      minimumStock: 100,
      purchasePrice: 150,
      supplier: 'PT Supplier Kopi',
    },
  });

  const susuIng = await prisma.ingredient.create({
    data: {
      name: 'Susu UHT Tester ' + Date.now(),
      unit: 'ml',
      minimumStock: 500,
      purchasePrice: 20,
      supplier: 'PT Milk Corp',
    },
  });

  const gulaIng = await prisma.ingredient.create({
    data: {
      name: 'Sirup Gula Aren Tester ' + Date.now(),
      unit: 'ml',
      minimumStock: 200,
      purchasePrice: 30,
      supplier: 'PT Gula Aren',
    },
  });
  console.log(`✅ Ingredients created: ${kopiIng.name}, ${susuIng.name}, ${gulaIng.name}`);

  // STEP 3: Create Recipe (BOM)
  console.log('\n--- Step 3: Create Recipe (BOM) ---');
  // Kopi Susu: 20 gram Kopi, 150 ml Susu, 10 ml Gula
  const recipe1 = await prisma.recipe.create({
    data: { productId: testProduct.id, ingredientId: kopiIng.id, quantityRequired: 20 },
  });
  const recipe2 = await prisma.recipe.create({
    data: { productId: testProduct.id, ingredientId: susuIng.id, quantityRequired: 150 },
  });
  const recipe3 = await prisma.recipe.create({
    data: { productId: testProduct.id, ingredientId: gulaIng.id, quantityRequired: 10 },
  });
  console.log(`✅ Recipe BOM attached to product: 20g Kopi, 150ml Susu, 10ml Gula`);

  // STEP 4: Update Stock (Stock In)
  console.log('\n--- Step 4: Update Stock (Stock In) ---');
  const branch = await prisma.branch.findFirst({ where: { isActive: true } });
  if (!branch) throw new Error('No active branch found');

  const adminUser = await prisma.user.findFirst({ where: { role: { name: 'Admin' } } });
  if (!adminUser) throw new Error('No admin user found');

  // Stock In: 1000g Kopi, 5000ml Susu, 1000ml Gula
  const invKopi = await prisma.inventory.create({
    data: { branchId: branch.id, ingredientId: kopiIng.id, stockQuantity: 1000 },
  });
  await prisma.inventoryTransaction.create({
    data: { inventoryId: invKopi.id, type: 'IN', amount: 1000, notes: 'Stok awal test', createdById: adminUser.id },
  });

  const invSusu = await prisma.inventory.create({
    data: { branchId: branch.id, ingredientId: susuIng.id, stockQuantity: 5000 },
  });
  await prisma.inventoryTransaction.create({
    data: { inventoryId: invSusu.id, type: 'IN', amount: 5000, notes: 'Stok awal test', createdById: adminUser.id },
  });

  const invGula = await prisma.inventory.create({
    data: { branchId: branch.id, ingredientId: gulaIng.id, stockQuantity: 1000 },
  });
  await prisma.inventoryTransaction.create({
    data: { inventoryId: invGula.id, type: 'IN', amount: 1000, notes: 'Stok awal test', createdById: adminUser.id },
  });
  console.log(`✅ Stock updated: Kopi=1000g, Susu=5000ml, Gula=1000ml`);

  // STEP 5: Simulate Order (Qty = 2x Kopi Susu Tester)
  console.log('\n--- Step 5: Simulate Order ---');
  const orderNumber = `KM-TEST-${Date.now()}`;
  const testOrder = await prisma.order.create({
    data: {
      orderNumber,
      branchId: branch.id,
      tableNumber: 'Meja Test 99',
      customerName: 'Customer Tester',
      totalAmount: 36000,
      discountAmount: 0,
      finalAmount: 36000,
      status: 'WAITING',
      paymentStatus: 'UNPAID',
      paymentMethod: 'PAY_AT_CASHIER',
      items: {
        create: [
          {
            productId: testProduct.id,
            productName: testProduct.name,
            unitPrice: 18000,
            quantity: 2, // 2 portions -> needs 40g Kopi, 300ml Susu, 20ml Gula
            subtotal: 36000,
          },
        ],
      },
      history: {
        create: { status: 'WAITING', notes: 'Simulated Order' },
      },
    },
  });
  console.log(`✅ Order created: ${testOrder.orderNumber} (Qty: 2x Kopi Susu Tester)`);

  // STEP 6: Confirm Order & Verify Stock Calculation
  console.log('\n--- Step 6: Verify Stock Calculation ---');
  // Call deductStockForOrder logic directly
  const { deductStockForOrder } = await import('../src/lib/inventory');
  const deductionResult = await deductStockForOrder(testOrder.id, adminUser.id);
  console.log('Deduction Result:', deductionResult);

  // Update order status to ACCEPTED
  await prisma.order.update({
    where: { id: testOrder.id },
    data: { status: 'ACCEPTED' },
  });

  // Verify resulting inventory stocks
  const updatedInvKopi = await prisma.inventory.findUnique({ where: { id: invKopi.id } });
  const updatedInvSusu = await prisma.inventory.findUnique({ where: { id: invSusu.id } });
  const updatedInvGula = await prisma.inventory.findUnique({ where: { id: invGula.id } });

  console.log('\n📊 Stock Deduction Verification Results:');
  console.log(`- Kopi:  Expected = 960g,  Actual = ${updatedInvKopi?.stockQuantity}g`);
  console.log(`- Susu:  Expected = 4700ml, Actual = ${updatedInvSusu?.stockQuantity}ml`);
  console.log(`- Gula:  Expected = 980ml,  Actual = ${updatedInvGula?.stockQuantity}ml`);

  const isKopiCorrect = updatedInvKopi?.stockQuantity === 960;
  const isSusuCorrect = updatedInvSusu?.stockQuantity === 4700;
  const isGulaCorrect = updatedInvGula?.stockQuantity === 980;

  if (isKopiCorrect && isSusuCorrect && isGulaCorrect) {
    console.log('\n🎉 SUCCESS! All 6 test steps completed and stock calculations are 100% CORRECT!');
  } else {
    console.error('\n❌ ERROR: Stock calculation discrepancy detected!');
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error('Test execution failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
