# Thread blue wardrobe usage walkthrough

A silent annotated walkthrough of actual React screens with API-exported sample data. This is not continuous live browser-to-API footage. The UI captures show navigation, combined filters and dialogs. Save, sharing, account and reservation mutations are demonstrated as local-app instructions; no successful server write is implied by these captures.

Duration: 3:09. Resolution: 1920 x 1080. No audio track.

[Optional subtitles](Thread_Walkthrough.srt) and [chapter timestamps](Thread_Walkthrough_Chapters.json) accompany the video.

## Chapters

- 00:00 - Your wardrobe, step by step
- 00:12 - Start with the demo
- 00:24 - See what you own
- 00:34 - Find your blue pieces
- 00:42 - Combine your filters
- 00:50 - Keep each piece accurate
- 01:02 - Choose your preferences
- 01:13 - Compare the suggestions
- 01:25 - Keep your good combinations
- 01:34 - Share one look at a time
- 01:45 - Give good pieces another chapter
- 01:57 - Follow the reservation
- 02:09 - Manage your account
- 02:19 - Use it on your phone
- 02:31 - Edit comfortably on mobile
- 02:41 - Plan a look wherever you are
- 02:51 - Run the complete app locally

## Run the full application

Install .NET 10 SDK, Node.js 24 and Git. Your GitHub account needs access to the repository. Use the workbook and [course checkpoint branches](COURSE_BRANCHES.md) for guided development. The full application uses ASP.NET Core MVC controllers, CQRS handlers and EF Core SQLite behind React and Redux. The browser preview shown here does not replace deployment smoke testing.

```sh
git clone https://github.com/DotDimonNet/FromZeroToCodeWardrobe.git
cd FromZeroToCodeWardrobe
git switch --track origin/course/11-blue-design
npm ci --prefix client
npm run dev
```

Open http://localhost:3000 and choose Explore the demo.

## Practice the complete workflow

1. Open the full local app and choose **Explore the demo**. Add a garment, edit its properties and find it using category and color filters.
2. In Outfit studio, choose All seasons, Any style, Any era, Neutral palette and Quiet essentials. Generate an outfit, name it and save it.
3. In Saved looks, create a share link, view it while signed out, then revoke it and confirm the old link stops working.
4. In Sharing circle, reserve a piece and include a suggested pickup time. Open your profile and switch demo role to the seller; accept the request in Reservations.
5. Complete the exchange as the seller, or practise cancellation as the buyer. Observe the different allowed actions and stock changes.
6. Sign out and test registration, activation and password recovery using the development-only test links. Configure provider credentials separately for real OAuth and email delivery.
7. Repeat navigation and garment editing at a narrow viewport. Check that the bottom bar does not cover controls and that Escape restores focus after closing a dialog.

The marketplace coordinates reservations and local handover; it does not process payments, shipping or private chat. The outfit score is a deterministic ranking. The bundled sample photographs have source and license records in `client/public/image-credits.json`.

## Evidence and reproduction

The video presents captured screen states with usage notes. Navigation, combined filters, preference controls and dialogs were operated in the actual React UI. The generated-outfit example replays the exact read-only response exported from the C# test host for All/Any/Any/Neutral/essentials. Account, garment, sharing and reservation writes remain instructions for the complete local app; they were not recorded against a running backend in the preview.

The optional export below obtains real API response data and renders static React screens for visual inspection. It does not record browser interaction or recreate the video automatically.

```sh
npm ci --prefix client
npm --prefix client run build
dotnet build tools/DemoExport -m:1 -p:UseSharedCompilation=false
dotnet run --project tools/DemoExport --no-build -- artifacts/demo-data.json
node scripts/render-walkthrough.mjs
node artifacts/render-walkthrough.cjs artifacts/demo-data.json artifacts/walkthrough
```

The full checkpoint passes 17 backend/domain/HTTP integration cases and two Redux cases. Its GitHub workflow builds the actual C# and React source. Live OAuth, real SMTP, Docker runtime and public production ingress still require environment-specific verification. See [deployment guidance](DEPLOYMENT.md) and the [blue design guide](DESIGN_SYSTEM.md).
