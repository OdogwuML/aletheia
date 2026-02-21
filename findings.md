# findings.md — Research, Discoveries & Constraints

---

## Discovery Answers

1. **North Star:** A system where landlords can track rent payments across all their buildings, and tenants can make/view their payments.
2. **Integrations:** Paystack (payments), Resend (email), Termii (SMS). All Nigeria-friendly.
3. **Source of Truth:** Supabase (PostgreSQL).
4. **Delivery Payload:** Web app hosted on Vercel. Landlords can export reports (PDF/Excel). Backend in Golang.
5. **Behavioral Rules:**
   - Tenants cannot see other tenants' payment status
   - Automatic late-payment reminders (email + SMS)
   - Single currency: Naira (₦)
   - Landlords cannot edit past payment records

---

## Research: Go SDK Availability

### Paystack
- Multiple Go SDKs available: `rpip/paystack-go`, `samaasi/paystack-sdk-go`, `theghostmac/paystack-go-sdk`
- Supports: transactions, customers, plans, subscriptions, dedicated virtual accounts
- Amounts must be in **kobo** (subunit) — multiply by 100
- Webhook support for real-time payment status updates

### Supabase
- Official community SDK: `supabase-community/supabase-go`
- Supports: PostgREST, GoTrue (auth), Storage, Realtime, Edge Functions
- Alternative: `nedpals/supabase-go` (unofficial, simpler API)

### Resend
- Official SDK: `resend/resend-go/v3`
- Supports: To, CC, BCC, HTML/text content, attachments
- Free tier: 3,000 emails/month

### Termii
- Community SDK: `Uchencho/go-termii`
- Nigerian company, affordable (~₦4/SMS)
- Supports: SMS sending, OTP verification

---

## Constraints & Gotchas

- Paystack amounts are in **kobo** — always multiply naira by 100 before sending
- Supabase Go SDK docs are limited for complex operations (joins, functions)
- Vercel primarily supports serverless functions — Go backend may need to be deployed separately (e.g., Railway, Render) or as Vercel serverless Go functions
- Termii is pay-as-you-go, no true free tier
