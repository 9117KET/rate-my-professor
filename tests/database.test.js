import { reviewsService } from "../app/services/reviewsService";

async function testDatabaseConnection() {
  try {
    // 1. Test adding a review
    const testReview = {
      professor: "Test Professor",
      subject: "Test Subject",
      stars: 5,
      review: "This is a test review",
    };

    console.log("Testing database connection...");
    console.log("1. Adding test review...");

    const addedReview = await reviewsService.addReview(testReview);
    console.log("✓ Successfully added review:", addedReview);

    // 2. Test retrieving all reviews
    console.log("\n2. Retrieving all reviews...");
    const allReviews = await reviewsService.getAllReviews();
    console.log(
      "✓ Successfully retrieved reviews:",
      allReviews.length,
      "reviews found"
    );

    // 3. Verify the test review exists in the retrieved data
    const foundReview = allReviews.find(
      (review) => review.id === addedReview.id
    );
    if (foundReview) {
      console.log("\n✓ Test review successfully verified in database");
    } else {
      throw new Error("Added review not found in retrieved data");
    }

    console.log("\n✅ All database tests passed!");
    return true;
  } catch (error) {
    console.error("\n❌ Database test failed:", error);
    return false;
  }
}

// Run the test
testDatabaseConnection();
