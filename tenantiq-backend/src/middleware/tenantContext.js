const { createError } = require('./errorHandler');

function tenantContext(req, res, next) {
  if (!req.user || !req.user.schemaName) {
    return next(createError('Tenant context not found', 401));
  }
  req.schemaName = req.user.schemaName;
  req.tenantId = req.user.tenantId;
  next();
}

module.exports = tenantContext;