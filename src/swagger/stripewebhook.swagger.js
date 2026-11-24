/**
 * @swagger
 * /api/v1/orders/stripe/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Receive a Stripe webhook
 *     description: Stripe sends signed payment events to this endpoint.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Stripe event payload
 *             additionalProperties: true
 *     responses:
 *       200: { description: Webhook processed }
 */
