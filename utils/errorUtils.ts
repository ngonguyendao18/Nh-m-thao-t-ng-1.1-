/**
 * Provides a user-friendly error message from a caught API error.
 * Checks for common issues like rate limiting/quota errors.
 * @param error The error object caught.
 * @param defaultMessage A default message if no specific pattern is found.
 * @returns A user-friendly error string.
 */
export const getApiErrorMessage = (error: any, defaultMessage: string = "Đã xảy ra lỗi không xác định."): string => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("429") || message.includes("quota") || message.includes("rate limit")) {
      return "Lỗi: Đã vượt quá giới hạn yêu cầu API. Vui lòng thử lại sau giây lát.";
    }
     if (message.includes("failed to fetch")) {
      return "Lỗi mạng: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối internet.";
    }
    // Return a cleaned up message if it's not a generic one.
    return error.message.length > 150 ? defaultMessage : error.message;
  }
  
  if (typeof error === 'string') {
    const lowerError = error.toLowerCase();
    if (lowerError.includes("429") || lowerError.includes("quota") || lowerError.includes("rate limit")) {
       return "Lỗi: Đã vượt quá giới hạn yêu cầu API. Vui lòng thử lại sau giây lát.";
    }
  }

  // Log the unknown error structure for debugging
  console.error("An unexpected error structure was caught:", error);
  
  return defaultMessage;
};
