/**
 * Standardized response handler for API responses
 */
export const responseHandler = {
  /**
   * Success response
   */
  success: (res, data = null, message = 'Success', statusCode = 200) => {
    const response = {
      success: true,
      message
    };

    if (data !== null) {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  },

  /**
   * Error response
   */
  error: (res, message = 'Internal server error', statusCode = 500, errors = null) => {
    const response = {
      success: false,
      message
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  },

  /**
   * Validation error response
   */
  validationError: (res, errors) => {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  },

  /**
   * Not found response
   */
  notFound: (res, resource = 'Resource') => {
    return res.status(404).json({
      success: false,
      message: `${resource} not found`
    });
  },

  /**
   * Unauthorized response
   */
  unauthorized: (res, message = 'Unauthorized access') => {
    return res.status(401).json({
      success: false,
      message
    });
  },

  /**
   * Forbidden response
   */
  forbidden: (res, message = 'Access forbidden') => {
    return res.status(403).json({
      success: false,
      message
    });
  }
};

export default responseHandler;