import { contactSchema } from "@/lib/validations";
import { handleSubmission } from "@/lib/handle-submission";

export async function POST(req: Request) {
  return handleSubmission(req, contactSchema, "Contact Us");
}
