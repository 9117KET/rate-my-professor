import { bugReportService } from "../../services/bugReportService";
import { NextResponse } from "next/server";
import { rateLimiterService } from "../../services/rateLimiterService";

/**
 * API route for handling bug reports
 * Validates input, applies rate limiting, and saves report to Firestore
 */
export async function POST(request) {
  try {
    // Get client IP for rate limiting
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : "unknown";

    // Check rate limit (allow 5 reports per hour per IP)
    const rateLimitCheck = await rateLimiterService.checkRateLimit(
      clientIp,
      "BUG_REPORT"
    );

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          details: `You can submit ${rateLimitCheck.limit} reports per hour. Please try again later.`,
        },
        { status: 429 }
      );
    }

    // Validate request
    if (!request.body) {
      return NextResponse.json(
        { error: "Missing request body" },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Basic validation
    if (!data.description || !data.description.trim()) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    if (!data.issueType) {
      return NextResponse.json(
        { error: "Issue type is required" },
        { status: 400 }
      );
    }

    // Validate issue type against allowed values
    const validIssueTypes = bugReportService
      .getIssueTypes()
      .map((type) => type.value);
    if (!validIssueTypes.includes(data.issueType)) {
      return NextResponse.json(
        { error: "Invalid issue type" },
        { status: 400 }
      );
    }

    // Optional email validation if provided
    if (data.email && !isValidEmail(data.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate screenshot data if provided
    if (data.screenshot) {
      // Check if it's a valid data URL
      if (!isValidDataUrl(data.screenshot)) {
        return NextResponse.json(
          { error: "Invalid screenshot format" },
          { status: 400 }
        );
      }

      // Size validation - rough check based on string length
      // Base64 encoding increases size by ~33%
      const approximateSize = (data.screenshot.length * 3) / 4;
      if (approximateSize > 5 * 1024 * 1024) {
        // 5MB
        return NextResponse.json(
          { error: "Screenshot too large (max 5MB)" },
          { status: 400 }
        );
      }
    }

    // Add user agent and IP info for troubleshooting
    const userAgent = request.headers.get("user-agent") || "Unknown";
    const reportData = {
      ...data,
      userAgent,
      clientIp:
        process.env.NODE_ENV === "production" ? hashIp(clientIp) : clientIp, // Hash IP in production
      submittedAt: new Date().toISOString(),
    };

    try {
      // Submit report to service
      const result = await bugReportService.submitBugReport(reportData);
      return NextResponse.json({
        success: true,
        reportId: result.reportId,
        message: "Bug report submitted successfully",
      });
    } catch (serviceError) {
      console.error("Error in bugReportService:", serviceError);
      return NextResponse.json(
        {
          error: "Failed to save report to database",
          details: serviceError.message || "Unknown service error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing bug report:", error);
    return NextResponse.json(
      {
        error: "Failed to process report",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether the email is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Helper function to validate a data URL
 * @param {string} dataUrl - The data URL to validate
 * @returns {boolean} Whether the data URL is valid
 */
function isValidDataUrl(dataUrl) {
  const dataUrlRegex = /^data:image\/(jpeg|jpg|png|gif|bmp|webp);base64,/;
  return dataUrlRegex.test(dataUrl);
}

/**
 * Helper function to hash an IP address for anonymization
 * Simple one-way hash to preserve privacy while still allowing rate limiting
 * @param {string} ip - IP address to hash
 * @returns {string} Hashed IP
 */
function hashIp(ip) {
  // This is a simple hash function adequate for basic anonymization
  // For real production use, consider using a proper cryptographic hash
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return "ip_" + Math.abs(hash).toString(16);
}
