import { FeedbackForm } from "@/components/feedback-form";

export const dynamic = "force-dynamic";

export default function FeedbackPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">💬 Feedback</h1>
        <p className="text-sm text-stone-500">
          Help us make Wuf better for you and your puppy
        </p>
      </div>
      <FeedbackForm />
    </div>
  );
}
