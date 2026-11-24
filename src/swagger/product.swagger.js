/**
 * @swagger
 * /api/v1/seller/add-product:
 *   post:
 *     tags: [Products]
 *     summary: Create a product as a seller
 *     security: [{ accessToken: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *             schema:
 *               type: object
 *               required: [image, category, name, description, price, stock]
 *               properties:
 *                 image: { type: string, format: binary }
 *                 category: { type: string }
 *                 name: { type: string, minLength: 2, maxLength: 200 }
 *                 description: { type: string, minLength: 10, maxLength: 5000 }
 *                 price: { type: integer, minimum: 1, maximum: 1000000 }
 *                 sizes:
 *                   type: array
 *                   uniqueItems: true
 *                   items: { type: string, enum: [S, M, L, XL] }
 *                 stock: { type: integer, minimum: 1, maximum: 100000 }
 *                 status: { type: string, enum: [active, inactive] }
 *     responses:
 *       201: { description: Product created }
 * /api/v1/seller/products:
 *   get:
 *     tags: [Products]
 *     summary: List the seller's products
 *     security: [{ accessToken: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 50 } }
 *       - { in: query, name: category, schema: { type: string } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: sortBy, schema: { type: string, enum: [newest, oldest, price-asc, price-desc] } }
 *     responses:
 *       200: { description: Seller products }
 * /api/v1/seller/products/stats:
 *   get:
 *     tags: [Products]
 *     summary: Get seller product statistics
 *     security: [{ accessToken: [] }]
 *     responses:
 *       200: { description: Product statistics }
 * /api/v1/seller/delete-product/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete a seller product
 *     security: [{ accessToken: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Product deleted }
 * /api/v1/seller/update-stock/{id}:
 *   patch:
 *     tags: [Products]
 *     summary: Update product stock
 *     security: [{ accessToken: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *             schema:
 *               type: object
 *               required: [stock]
 *               properties:
 *                 stock: { type: integer, minimum: 0 }
 *     responses:
 *       200: { description: Stock updated }
 * /api/v1/seller/bulk-delete:
 *   delete:
 *     tags: [Products]
 *     summary: Delete multiple seller products
 *     security: [{ accessToken: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *             schema:
 *               type: object
 *               required: [productIds]
 *               properties:
 *                 productIds:
 *                   type: array
 *                   minItems: 1
 *                   maxItems: 100
 *                   uniqueItems: true
 *                   items: { type: string, pattern: '^[a-fA-F0-9]{24}$' }
 *     responses:
 *       200: { description: Products deleted }
 * /api/v1/seller/update-product/{id}:
 *   patch:
 *     tags: [Products]
 *     summary: Update a seller product
 *     security: [{ accessToken: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: { type: string, format: binary }
 *               category: { type: string }
 *               name: { type: string, minLength: 2, maxLength: 200 }
 *               description: { type: string, minLength: 10, maxLength: 5000 }
 *               price: { type: integer, minimum: 1, maximum: 1000000 }
 *               sizes:
 *                 type: array
 *                 uniqueItems: true
 *                 items: { type: string, enum: [S, M, L, XL] }
 *               stock: { type: integer, minimum: 1, maximum: 100000 }
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200: { description: Product updated }
 * /api/v1:
 *   get:
 *     tags: [Products]
 *     summary: List products
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 15 } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: category, schema: { type: string } }
 *       - { in: query, name: minPrice, schema: { type: number, minimum: 0 } }
 *       - { in: query, name: maxPrice, schema: { type: number, minimum: 0 } }
 *       - { in: query, name: sortBy, schema: { type: string } }
 *       - { in: query, name: inStock, schema: { type: boolean } }
 *     responses:
 *       200: { description: Product list }
 * /api/v1/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get a product by ID
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Product details }
 */
