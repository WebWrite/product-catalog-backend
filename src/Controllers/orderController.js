
import { HTTP_STATUS } from '../constants/statusCodes.js';
import { cancelMyOrderItem, createCodOrder, getMyOrders, getMySellerOrders, updateMySellerOrderItemStatus } from '../managers/orderManager.js';
import {asyncHandler} from '../utils/wrapasync.js'

export const createOrder = asyncHandler(async (req, res) => {
  const order = await createCodOrder(req.user.id, req.body);

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: "Order created successfully.",
    data: { order },
  });
});

export const getMyOrdersController = asyncHandler(async (req, res) => {
  const orders = await getMyOrders(req.user.id)

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { orders },
  })
})


export const cancelMyOrderItemController = asyncHandler(
  async (req, res) => {

    const { orderId, itemId } = req.body

    const order = await cancelMyOrderItem(req.user.id,orderId,itemId )

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Order item cancelled successfully.",
      data: { order },
    })
  }
)

export const getMySellerOrdersController = asyncHandler(
  async (req, res) => {
    const orders = await getMySellerOrders(req.user.id);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { orders },
    });
  }
);


export const updateSellerOrderItemStatusController = asyncHandler(
  async (req, res) => {
    const { orderId, itemId, status } = req.body;

    const order = await updateMySellerOrderItemStatus(req.user.id,orderId,itemId,status);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Order item status updated successfully.",
      data: { order },
    });
  }
);