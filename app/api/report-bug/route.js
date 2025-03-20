import { bugReportService } from "../../services/bugReportService";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
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

    // Optional email validation if provided
    if (data.email && !isValidEmail(data.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Add user agent and IP info for troubleshooting
    const userAgent = request.headers.get("user-agent") || "Unknown";
    const reportData = {
      ...data,
      userAgent,
      submittedAt: new Date().toISOString(),
    };

    try {
      // Submit report to service
      const result = await bugReportService.submitBugReport(reportData);
      return NextResponse.json({ success: true, reportId: result.id });
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

// Helper function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
