/**
 * @swagger
 * /api/v1/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get the current user's cart
 *     security: [{ accessToken: [] }]
 *     responses:
 *       200: { description: Cart details }
 *   post:
 *     tags: [Cart]
 *     summary: Add an item to the cart
 *     security: [{ accessToken: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId: { type: string, pattern: '^[a-fA-F0-9]{24}$' }
 *               quantity: { type: number, minimum: 1, maximum: 25 }
 *               size: { type: string, minLength: 1 }
 *     responses:
 *       200: { description: Item added }
 *   delete:
 *     tags: [Cart]
 *     summary: Delete the current user's cart
 *     security: [{ accessToken: [] }]
 *     responses:
 *       200: { description: Cart deleted }
 *
 * /api/v1/cart/merge:
 *   post:
 *     tags: [Cart]
 *     summary: Merge a guest cart
 *     security: [{ accessToken: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productId, quantity]
 *                   properties:
 *                     productId: { type: string, pattern: '^[a-fA-F0-9]{24}$' }
 *                     quantity: { type: number, minimum: 1, maximum: 25 }
 *                     size: { type: string, minLength: 1 }
 *     responses:
 *       200: { description: Cart merged }
 *
 * /api/v1/cart/items/{itemId}:
 *   patch:
 *     tags: [Cart]
 *     summary: Edit a cart item
 *     security: [{ accessToken: [] }]
 *     parameters:
 *       - { in: path, name: itemId, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: number, minimum: -25, maximum: 25 }
 *     responses:
 *       200: { description: Cart item updated }
 *   delete:
 *     tags: [Cart]
 *     summary: Delete a cart item
 *     security: [{ accessToken: [] }]
 *     parameters:
 *       - { in: path, name: itemId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Cart item deleted }
 */
