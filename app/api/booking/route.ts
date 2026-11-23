import { bookingSchema } from "@/lib/validations";
import { handleSubmission } from "@/lib/handle-submission";

export async function POST(req: Request) {
  return handleSubmission(req, bookingSchema, "Consultation Booking");
}
