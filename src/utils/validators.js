import mongoose from 'mongoose';

/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid ObjectId, false otherwise
 */
export const isValidObjectId = (id) => {
  try {
    return mongoose.Types.ObjectId.isValid(id);
  } catch (error) {
    return false;
  }
};

/**
 * Creates a standardized ObjectId validation response for API routes
 * @param {string} id - The ID to validate
 * @param {string} resourceName - The name of the resource being validated (e.g., 'patient', 'inventory')
 * @returns {Object} - NextResponse with error if invalid, null if valid
 */
export const validateObjectIdResponse = (id, resourceName = 'ID') => {
  if (!isValidObjectId(id)) {
    return {
      json: { 
        error: `Invalid ${resourceName} ID format`,
        code: 'INVALID_OBJECT_ID'
      }, 
      status: 400 
    };
  }
  return null;
};
