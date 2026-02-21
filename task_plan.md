# task_plan.md — Phases, Goals & Checklists

---

## Protocol 0: Initialization
- [x] Ask 5 Discovery Questions
- [x] Receive & record user answers in `findings.md`
- [x] Research Go SDKs for Paystack, Supabase, Resend, Termii
- [x] Create `gemini.md` with data schema and behavioral rules
- [x] Create `findings.md` with research
- [x] Create `progress.md`
- [x] Create directory structure (`architecture/`, `tools/`, `.tmp/`)
- [x] User confirms Payload shape (data schema)
- [x] Blueprint approved → unblock coding

## Phase 1: B — Blueprint (Vision & Logic)
- [x] Define API routes and endpoints
- [x] Design landlord dashboard wireframe
- [x] Design tenant dashboard wireframe
- [x] Write implementation plan
- [x] Get user approval on plan

## Phase 2: L — Link (Connectivity)
- [ ] Set up `.env` with all API keys
- [ ] Verify Paystack connection (handshake)
- [ ] Verify Supabase connection (handshake)
- [ ] Verify Resend connection (handshake)
- [ ] Verify Termii connection (handshake)

## Phase 3: A — Architect (The 3-Layer Build)
- [ ] Write Architecture SOPs in `architecture/`
- [ ] Build Go backend: models, routes, handlers, middleware
- [ ] Build frontend: landlord views (building sections, payment tracking, exports)
- [ ] Build frontend: tenant views (payment portal, history)
- [ ] Integrate Paystack payment flow
- [ ] Integrate Resend + Termii notifications
- [ ] Implement PDF/Excel export

## Phase 4: S — Stylize (Refinement & UI)
- [ ] Polish landlord dashboard UI
- [ ] Polish tenant payment portal UI
- [ ] Design email / SMS notification templates
- [ ] Present stylized results for user feedback

## Phase 5: T — Trigger (Deployment)
- [ ] Deploy frontend to Vercel
- [ ] Deploy Go backend (Vercel serverless or alternative)
- [ ] Set up cron for late-payment reminders
- [ ] Run end-to-end production test
- [ ] Finalize Maintenance Log in `gemini.md`
