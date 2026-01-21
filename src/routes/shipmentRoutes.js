const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllShipments,
  getShipmentById,
  createShipment,
  updateShipment,
  deleteShipment,
  updateShipmentStatus,
  trackShipment
} = require('../controllers/shipmentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation rules
const shipmentValidation = [
  body('exportOrderId').isUUID().withMessage('Valid export order ID is required'),
  body('carrier').trim().isLength({ min: 1 }).withMessage('Carrier is required'),
  body('trackingNumber').optional().trim(),
  body('shippedAt').optional().isISO8601()
];

const statusValidation = [
  body('status').isIn(['READY', 'IN_TRANSIT', 'DELIVERED', 'DELAYED']).withMessage('Invalid status')
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid shipment ID')
];

const trackingValidation = [
  param('trackingNumber').trim().isLength({ min: 1 }).withMessage('Valid tracking number is required')
];

// Routes
router.get('/', authenticate, getAllShipments);
router.get('/track/:trackingNumber', trackingValidation, handleValidationErrors, trackShipment);
router.get('/:id', authenticate, idValidation, handleValidationErrors, getShipmentById);
router.post('/', authenticate, authorize(['shipment.create']), shipmentValidation, handleValidationErrors, createShipment);
router.put('/:id', authenticate, authorize(['shipment.update']), idValidation, handleValidationErrors, updateShipment);
router.put('/:id/status', authenticate, authorize(['shipment.update']), [...idValidation, ...statusValidation], handleValidationErrors, updateShipmentStatus);
router.delete('/:id', authenticate, authorize(['shipment.delete']), idValidation, handleValidationErrors, deleteShipment);

module.exports = router;