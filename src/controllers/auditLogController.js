const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');

const auditLogController = {
  // Get all audit logs with pagination and filtering
  async getAllAuditLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        user_id,
        action,
        entity_type,
        start_date,
        end_date
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Add search filter
      if (search) {
        whereClause[Op.or] = [
          { action: { [Op.like]: `%${search}%` } },
          { entity_type: { [Op.like]: `%${search}%` } },
          { '$User.full_name$': { [Op.like]: `%${search}%` } },
          { '$User.email$': { [Op.like]: `%${search}%` } }
        ];
      }

      // Add filters
      if (user_id && user_id !== 'all') whereClause.user_id = user_id;
      if (action && action !== 'all') whereClause.action = action;
      if (entity_type && entity_type !== 'all') whereClause.entity_type = entity_type;

      // Add date range filter
      if (start_date && end_date) {
        whereClause.created_at = {
          [Op.between]: [new Date(start_date), new Date(end_date)]
        };
      }

      const { count, rows } = await AuditLog.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            attributes: ['id', 'full_name', 'email'],
            required: false
          }
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [['created_at', 'DESC']],
        distinct: true
      });

      res.json({
        success: true,
        data: {
          data: rows,
          total: count,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit logs',
        error: error.message
      });
    }
  },

  // Get audit log by ID
  async getAuditLogById(req, res) {
    try {
      const { id } = req.params;

      const auditLog = await AuditLog.findByPk(id, {
        include: [
          {
            model: User,
            attributes: ['id', 'full_name', 'email'],
            required: false
          }
        ]
      });

      if (!auditLog) {
        return res.status(404).json({
          success: false,
          message: 'Audit log not found'
        });
      }

      res.json({
        success: true,
        data: auditLog
      });
    } catch (error) {
      console.error('Get audit log error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit log',
        error: error.message
      });
    }
  },

  // Create new audit log (manual creation)
  async createAuditLog(req, res) {
    try {
      const {
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values,
        additional_info
      } = req.body;

      if (!action || !entity_type) {
        return res.status(400).json({
          success: false,
          message: 'Action and entity type are required'
        });
      }

      const auditLog = await AuditLog.create({
        user_id: user_id || req.user?.id,
        action,
        entity_type,
        entity_id,
        old_values: old_values ? JSON.stringify(old_values) : null,
        new_values: new_values ? JSON.stringify(new_values) : null,
        ip_address: req.ip || req.connection?.remoteAddress || 'unknown',
        user_agent: req.get('User-Agent') || 'unknown',
        additional_info: additional_info ? JSON.stringify(additional_info) : null
      });

      res.status(201).json({
        success: true,
        message: 'Audit log created successfully',
        data: auditLog
      });
    } catch (error) {
      console.error('Create audit log error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create audit log',
        error: error.message
      });
    }
  },

  // Get audit logs for a specific entity
  async getAuditLogsByEntity(req, res) {
    try {
      const { entityType, entityId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows } = await AuditLog.findAndCountAll({
        where: { 
          entity_type: entityType, 
          entity_id: entityId 
        },
        include: [
          {
            model: User,
            attributes: ['id', 'full_name', 'email'],
            required: false
          }
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          data: rows,
          total: count,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get audit logs by entity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit logs',
        error: error.message
      });
    }
  },

  // Get audit logs by user
  async getAuditLogsByUser(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows } = await AuditLog.findAndCountAll({
        where: { user_id: userId },
        include: [
          {
            model: User,
            attributes: ['id', 'full_name', 'email'],
            required: false
          }
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          data: rows,
          total: count,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get audit logs by user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit logs',
        error: error.message
      });
    }
  },

  // Get audit log statistics
  async getAuditLogStats(req, res) {
    try {
      const totalLogs = await AuditLog.count();

      // Get action breakdown
      const actionBreakdown = await AuditLog.findAll({
        attributes: [
          'action',
          [AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('action')), 'count']
        ],
        group: ['action'],
        order: [[AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('action')), 'DESC']],
        limit: 10
      });

      // Get entity type breakdown
      const entityBreakdown = await AuditLog.findAll({
        attributes: [
          'entity_type',
          [AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('entity_type')), 'count']
        ],
        group: ['entity_type'],
        order: [[AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('entity_type')), 'DESC']],
        limit: 10
      });

      // Get top users
      const topUsers = await AuditLog.findAll({
        attributes: [
          'user_id',
          [AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('user_id')), 'count']
        ],
        include: [
          {
            model: User,
            attributes: ['full_name', 'email'],
            required: true
          }
        ],
        group: ['user_id', 'User.id'],
        order: [[AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('user_id')), 'DESC']],
        limit: 10
      });

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentActivity = await AuditLog.count({
        where: {
          created_at: {
            [Op.gte]: sevenDaysAgo
          }
        }
      });

      res.json({
        success: true,
        data: {
          totalLogs,
          recentActivity,
          actionBreakdown: actionBreakdown.map(item => ({
            action: item.action,
            count: parseInt(item.dataValues.count)
          })),
          entityBreakdown: entityBreakdown.map(item => ({
            entity_type: item.entity_type,
            count: parseInt(item.dataValues.count)
          })),
          topUsers: topUsers.map(item => ({
            user_id: item.user_id,
            user_name: item.User?.full_name || 'Unknown',
            user_email: item.User?.email || 'Unknown',
            count: parseInt(item.dataValues.count)
          }))
        }
      });
    } catch (error) {
      console.error('Get audit log stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit log statistics',
        error: error.message
      });
    }
  },

  // Delete old audit logs
  async deleteOldAuditLogs(req, res) {
    try {
      const { daysOld = 90 } = req.body;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));

      const deletedCount = await AuditLog.destroy({
        where: {
          created_at: {
            [Op.lt]: cutoffDate
          }
        }
      });

      res.json({
        success: true,
        message: `Deleted ${deletedCount} audit logs older than ${daysOld} days`,
        data: { deletedCount }
      });
    } catch (error) {
      console.error('Delete old audit logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete old audit logs',
        error: error.message
      });
    }
  }
};

// Helper function to create audit log (updated with correct fields)
const createAuditLog = async (userId, action, entityType, entityId, oldValues = null, newValues = null, additionalInfo = null) => {
  try {
    await AuditLog.create({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues ? JSON.stringify(oldValues) : null,
      new_values: newValues ? JSON.stringify(newValues) : null,
      ip_address: 'system',
      user_agent: 'system',
      additional_info: additionalInfo ? JSON.stringify(additionalInfo) : null
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

module.exports = { auditLogController, createAuditLog };