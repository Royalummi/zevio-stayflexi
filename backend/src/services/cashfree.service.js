/**
 * Cashfree Payment Gateway Service
 *
 * This service handles all Cashfree payment operations:
 * - Create payment orders
 * - Verify webhook signatures
 * - Fetch order/payment status
 * - Process refunds
 *
 * SESSION 41: Cashfree Integration (replacing Razorpay)
 */

import { Cashfree, CFEnvironment } from "cashfree-pg";

// Initialize Cashfree with constructor
const cashfree = new Cashfree(
  process.env.CASHFREE_ENV === "PROD"
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX,
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY,
);

/**
 * Create a new payment order
 * @param {Object} orderData - Order creation data
 * @returns {Promise<Object>} Cashfree order response
 */
export const createOrder = async (orderData) => {
  try {
    const {
      orderId,
      orderAmount,
      orderCurrency = "INR",
      customerDetails,
      orderMeta,
    } = orderData;

    // Create order request
    const request = {
      order_id: orderId,
      order_amount: parseFloat(orderAmount),
      order_currency: orderCurrency,
      customer_details: {
        customer_id: customerDetails.customerId.toString(),
        customer_email: customerDetails.email,
        customer_phone: customerDetails.phone,
        customer_name: customerDetails.name,
      },
      order_meta: {
        return_url: orderMeta.returnUrl,
        notify_url: orderMeta.notifyUrl,
      },
    };

    // Create order using Cashfree SDK
    const response = await cashfree.PGCreateOrder(request);

    return {
      success: true,
      orderId: response.data.order_id,
      paymentSessionId: response.data.payment_session_id,
      orderStatus: response.data.order_status,
      orderToken: response.data.order_token,
    };
  } catch (error) {
    console.error(
      "Cashfree create order error:",
      error.response?.data || error,
    );
    throw new Error(
      `Failed to create Cashfree order: ${error.response?.data?.message || error.message || "Unknown error"}`,
    );
  }
};

/**
 * Verify webhook signature
 * @param {string} signature - Cashfree signature from header
 * @param {string} timestamp - Timestamp from header
 * @param {Object} body - Webhook payload body
 * @returns {boolean} True if signature is valid
 */
export const verifyWebhookSignature = (signature, timestamp, body) => {
  try {
    const crypto = require("crypto");

    // Construct the signed string
    const signedString = timestamp + JSON.stringify(body);

    // Generate expected signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.CASHFREE_SECRET_KEY)
      .update(signedString)
      .digest("base64");

    // Compare signatures
    return signature === expectedSignature;
  } catch (error) {
    console.error("Webhook signature verification error:", error);
    return false;
  }
};

/**
 * Get order details
 * @param {string} orderId - Cashfree order ID
 * @returns {Promise<Object>} Order details
 */
export const getOrder = async (orderId) => {
  try {
    const response = await cashfree.PGFetchOrder(orderId);
    return {
      success: true,
      order: response.data,
    };
  } catch (error) {
    console.error("Cashfree get order error:", error);
    throw new Error(`Failed to fetch order: ${error.message}`);
  }
};

/**
 * Get payment details for an order
 * @param {string} orderId - Cashfree order ID
 * @returns {Promise<Object>} Payment details
 */
export const getPayments = async (orderId) => {
  try {
    const response = await cashfree.PGOrderFetchPayments(orderId);
    return {
      success: true,
      payments: response.data,
    };
  } catch (error) {
    console.error("Cashfree get payments error:", error);
    throw new Error(`Failed to fetch payments: ${error.message}`);
  }
};

/**
 * Process refund
 * @param {Object} refundData - Refund request data
 * @returns {Promise<Object>} Refund response
 */
export const processRefund = async (refundData) => {
  try {
    const { orderId, refundId, refundAmount, refundNote } = refundData;

    const request = {
      refund_id: refundId,
      refund_amount: parseFloat(refundAmount),
      refund_note: refundNote || "Booking cancellation refund",
    };

    const response = await cashfree.PGOrderCreateRefund(orderId, request);

    return {
      success: true,
      refund: response.data,
    };
  } catch (error) {
    console.error("Cashfree refund error:", error);
    throw new Error(`Failed to process refund: ${error.message}`);
  }
};

/**
 * Get refund status
 * @param {string} orderId - Cashfree order ID
 * @param {string} refundId - Refund ID
 * @returns {Promise<Object>} Refund status
 */
export const getRefundStatus = async (orderId, refundId) => {
  try {
    const response = await cashfree.PGOrderFetchRefund(orderId, refundId);

    return {
      success: true,
      refund: response.data,
    };
  } catch (error) {
    console.error("Cashfree get refund status error:", error);
    throw new Error(`Failed to fetch refund status: ${error.message}`);
  }
};

export default {
  createOrder,
  verifyWebhookSignature,
  getOrder,
  getPayments,
  processRefund,
  getRefundStatus,
};
