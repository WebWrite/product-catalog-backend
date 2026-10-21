import { HTTP_STATUS } from "../constants/statusCodes.js";
import OrderManager from "../managers/orderManager.js";

class OrderController {
  static async createOrder(req, res) {
    const order = await OrderManager.createCodOrder(req.user.id, req.body);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Order created successfully.",
      data: { order },
    });
  }

  static async getMyOrdersController(req, res) {
    const orders = await OrderManager.getMyOrders(req.user.id);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { orders },
    });
  }

  static async cancelMyOrderItemController(req, res) {
    const { orderId, itemId } = req.body;

    const order = await OrderManager.cancelMyOrderItem(
      req.user.id,
      orderId,
      itemId
    );

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Order item cancelled successfully.",
      data: { order },
    });
  }

  static async getMySellerOrdersController(req, res) {
    const orders = await OrderManager.getMySellerOrders(req.user.id);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { orders },
    });
  }

  static async updateSellerOrderItemStatusController(req, res) {
    const { orderId, itemId, status } = req.body;

    const order = await OrderManager.updateMySellerOrderItemStatus(
      req.user.id,
      orderId,
      itemId,
      status
    );

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Order item status updated successfully.",
      data: { order },
    });
  }
}

export default OrderController;