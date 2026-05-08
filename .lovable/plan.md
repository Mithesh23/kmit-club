## Deliverable

Generate 6 Mermaid diagrams for the KMIT Clubs Platform documentation, saved to `/mnt/documents/` as `.mmd` files and surfaced as artifacts the user can preview/download.

### Diagrams to produce

1. **Architecture Diagram** (`Architecture_Diagram.mmd`)
   - React 18 + Vite + Tailwind frontend (Home, Student, Club Admin, Mentor pages)
   - Supabase backend (Postgres + RLS, Edge Functions, Storage)
   - External: Resend (emails), Netlify (hosting/SPA), Browser
   - Token-based auth headers (`x-student-token`, `x-mentor-token`, `club_auth_token`)

2. **Class Diagram** (`Class_Diagram.mmd`)
   - Core entities: Club, ClubMember, ClubAdmin, Mentor, StudentAccount, Event, EventRegistration, EventAttendance, AttendanceEvent, AttendanceRecord, Certificate, CertificateRequest, ClubReport, Announcement, KMITEvent
   - Key fields + relationships (1—N, M—N)

3. **Use-Case Diagram** (`UseCase_Diagram.mmd`)
   - Actors: Public Visitor, Student, Club Admin, Mentor, System (cron)
   - Use cases per actor (browse clubs, register, view certificates, manage events, scan QR, issue certificates, approve clubs, etc.)
   - Rendered as a Mermaid flowchart (Mermaid has no native UML use-case syntax)

4. **Workflow Diagram** (`Workflow_Diagram.mmd`)
   - End-to-end event lifecycle: Mentor creates club → Admin creates event → Student registers → QR email sent → Admin scans/marks attendance → Certificate request → Mentor approves → Certificate emailed → Student verifies via public dialog

5. **Database (ER) Diagram** (`Database_Diagram.mmd`)
   - Mermaid `erDiagram` covering all 22 tables from schema with PKs, key columns, and relationships (clubs↔events↔event_registrations↔event_attendance, clubs↔club_admins↔sessions, certificates, reports, mentors, student_accounts, etc.)

6. **Deployment Diagram** (`Deployment_Diagram.mmd`)
   - User Browser → Netlify CDN (SPA + `_redirects`) → Supabase project `qvsrhfzdkjygjuwmfwmh` (Postgres, Auth/RLS, Edge Functions, Storage) → Resend SMTP API
   - Cron triggers (May 1st promotion, daily session test)

### Output

Each diagram delivered via:
```
<lov-artifact url="/__l5e/documents/<file>.mmd" mime_type="text/vnd.mermaid"></lov-artifact>
```

No code changes to the project. Pure documentation artifacts.
