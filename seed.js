const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://taifur:taifur@cluster0.va9lo55.mongodb.net/product-management?appName=Cluster0";

async function run() {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MONGODB");

    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    const stockMovementsCollection = db.collection('stockmovements');

    const existingProduct = await productsCollection.findOne({});
    if (!existingProduct) {
        console.log("No existing product found to get userId.");
        process.exit(1);
    }

    const userId = existingProduct.userId;

    const newProducts = [];
    for (let i = 1; i <= 35; i++) {
        const stock = Math.floor(Math.random() * 50) + 5;
        const price = Math.floor(Math.random() * 100) + 10;

        newProducts.push({
            name: `Test Product ${i} ${Math.random().toString(36).substring(7).toUpperCase()}`,
            description: `Dummy product for testing pagination and search`,
            sku: `TST-${1000 + i}`,
            price: price,
            purchasePrice: price - 5,
            stockQuantity: stock,
            lowStockThreshold: 5,
            userId: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
            __v: 0
        });
    }

    const result = await productsCollection.insertMany(newProducts);
    console.log(`Inserted ${result.insertedCount} products`);

    const stockMovements = Object.values(result.insertedIds).map((id, index) => ({
        productId: id,
        userId: userId,
        type: "IN",
        quantity: newProducts[index].stockQuantity,
        previousStock: 0,
        newStock: newProducts[index].stockQuantity,
        reason: "Initial stock on product creation",
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
    }));

    await stockMovementsCollection.insertMany(stockMovements);
    console.log(`Inserted ${stockMovements.length} stock movements`);

    await mongoose.disconnect();
}

run().catch(console.dir);
