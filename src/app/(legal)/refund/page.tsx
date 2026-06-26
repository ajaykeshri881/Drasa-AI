import { LegalLayout } from "@/components/layout/LegalLayout";

export default function RefundPolicy() {
  return (
    <LegalLayout title="Refund Policy">
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      
      <h2>1. General Policy</h2>
      <p>At Drasa AI, we strive to ensure our users are fully satisfied with our AI services. We offer a transparent and fair refund policy.</p>

      <h2>2. Subscription Cancellations</h2>
      <p>You can cancel your auto-renewing subscription at any time from your account settings. Once canceled, you will not be charged for the subsequent billing cycles. You will continue to have access to your premium features until the end of your current billing period.</p>

      <h2>3. Refund Eligibility</h2>
      <p>Refunds for recent subscription charges may be granted on a case-by-case basis if requested within 7 days of the transaction, provided that there has been minimal usage of the premium resources during that billing period.</p>

      <h2>4. Requesting a Refund</h2>
      <p>To request a refund, please contact our support team at <strong>ajaykeshriofficial@gmail.com</strong> with your account email and the reason for your request. We aim to process all requests within 5-7 business days.</p>
    </LegalLayout>
  );
}
