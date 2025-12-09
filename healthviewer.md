Directory Structure:
-------------------
/ 
├── .git/
│   ├── branches/
│   ├── hooks/
│   │   ├── applypatch-msg.sample
│   │   ├── commit-msg.sample
│   │   ├── fsmonitor-watchman.sample
│   │   ├── post-update.sample
│   │   ├── pre-applypatch.sample
│   │   ├── pre-commit.sample
│   │   ├── pre-merge-commit.sample
│   │   ├── pre-push.sample
│   │   ├── pre-rebase.sample
│   │   ├── pre-receive.sample
│   │   ├── prepare-commit-msg.sample
│   │   ├── push-to-checkout.sample
│   │   ├── sendemail-validate.sample
│   │   └── update.sample
│   ├── info/
│   │   └── exclude
│   ├── logs/
│   │   ├── refs/
│   │   │   ├── heads/
│   │   │   │   └── main
│   │   │   └── remotes/
│   │   │       └── origin/
│   │   │           └── HEAD
│   │   └── HEAD
│   ├── objects/
│   │   ├── info/
│   │   └── pack/
│   │       ├── pack-6bd03457d9463fd99a1cd12e3eac99d520af1bb9.idx
│   │       ├── pack-6bd03457d9463fd99a1cd12e3eac99d520af1bb9.pack
│   │       └── pack-6bd03457d9463fd99a1cd12e3eac99d520af1bb9.rev
│   ├── refs/
│   │   ├── heads/
│   │   │   └── main
│   │   ├── remotes/
│   │   │   └── origin/
│   │   │       └── HEAD
│   │   └── tags/
│   ├── config
│   ├── description
│   ├── HEAD
│   ├── index
│   └── packed-refs
├── app/
│   ├── aep-functions/
│   │   ├── loading.tsx
│   │   └── page.tsx
│   ├── api/
│   │   ├── batch-segmentation/
│   │   │   ├── datasets/
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── jobs/
│   │   │   │   └── route.ts
│   │   │   ├── merge-policies/
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   └── schedules/
│   │   │       └── route.ts
│   │   ├── configuration/
│   │   │   └── route.ts
│   │   ├── destinations/
│   │   │   ├── [id]/
│   │   │   │   └── route.ts
│   │   │   ├── flows/
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   └── route.ts
│   │   ├── events/
│   │   │   ├── [id]/
│   │   │   │   ├── enrich/
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── health-check/
│   │   │   └── route.ts
│   │   ├── ingestion/
│   │   │   ├── datasets/
│   │   │   │   └── route.ts
│   │   │   ├── flow-runs/
│   │   │   │   └── route.ts
│   │   │   └── flows/
│   │   │       └── route.ts
│   │   ├── lineage/
│   │   │   ├── [id]/
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── oauth/
│   │   │   └── aep-token/
│   │   │       └── route.ts
│   │   ├── query-service/
│   │   │   ├── [id]/
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── segment-details/
│   │   │   ├── [id]/
│   │   │   │   └── jobs/
│   │   │   │       └── route.ts
│   │   │   ├── definitions/
│   │   │   │   └── route.ts
│   │   │   ├── export-schedules/
│   │   │   │   └── route.ts
│   │   │   └── profile-export-jobs/
│   │   │       └── route.ts
│   │   ├── segment-jobs/
│   │   │   ├── [id]/
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── segmentation/
│   │   │   ├── schedules/
│   │   │   │   └── route.ts
│   │   │   ├── segment-definitions/
│   │   │   │   └── route.ts
│   │   │   └── segment-jobs/
│   │   │       └── route.ts
│   │   ├── sources/
│   │   │   ├── [id]/
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── test-connection/
│   │   │   └── route.ts
│   │   ├── use-cases/
│   │   │   └── route.ts
│   │   └── webhooks/
│   │       └── aep/
│   │           └── route.ts
│   ├── batch-segmentation/
│   │   └── page.tsx
│   ├── destinations/
│   │   └── page.tsx
│   ├── ingestion/
│   │   └── page.tsx
│   ├── lineage/
│   │   └── page.tsx
│   ├── query-service/
│   │   └── page.tsx
│   ├── segment-details/
│   │   ├── loading.tsx
│   │   └── page.tsx
│   ├── segmentation/
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   │   ├── alert.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── collapsible.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── skeleton.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   └── textarea.tsx
│   ├── configuration-panel.tsx
│   ├── event-dashboard.tsx
│   ├── event-details.tsx
│   ├── event-enrichment.tsx
│   ├── event-filters.tsx
│   ├── event-list.tsx
│   ├── header.tsx
│   ├── lineage-assignment-form.tsx
│   ├── lineage-management.tsx
│   ├── lineage-overview.tsx
│   ├── lineage-visualization.tsx
│   ├── oauth-token-input.tsx
│   ├── stats-cards.tsx
│   └── theme-provider.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── aep-client.ts
│   ├── types.ts
│   └── utils.ts
├── public/
│   ├── placeholder-logo.png
│   ├── placeholder-logo.svg
│   ├── placeholder-user.jpg
│   ├── placeholder.jpg
│   └── placeholder.svg
├── scripts/
│   ├── 001_create_aep_events_table.sql
│   ├── 002_create_lineage_assignments_table.sql
│   └── 003_create_use_cases_table.sql
├── styles/
│   └── globals.css
├── .gitignore
├── components.json
├── healthviewer.md
├── next.config.mjs
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── README.md
└── tsconfig.json

File Contents:
--------------
File: ./.gitignore
--------------------------------------------------
Content of ./.gitignore:
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules

# next.js
/.next/
/out/

# production
/build

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files
.env*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts


