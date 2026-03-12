# RESTORE_CHECKLIST_v052 (Phase 2)

Status legend: **done / partial / missing**  
Evidence format: `file :: function/component`

| ID | Feature mapping (v0.5.2 restoration) | Status | Evidence |
|---|---|---|---|
| F-01 | 4-step intake wizard (intro → form → generating → result) | done | `src/App.jsx :: LumenWebBuilder()` |
| F-02 | Industry preset auto-apply (description/services/theme/pages) | done | `src/App.jsx :: applyPreset()` |
| F-03 | Business mode driven copy/pattern changes | done | `src/App.jsx :: applyBusinessMode(), inferBusinessMode()` |
| F-04 | Benchmark template recommendation + auto fallback selection | done | `src/App.jsx :: recommendedBenchmarks(useMemo), useEffect(sync selection)` |
| F-05 | Local template generation path (no external model required) | done | `src/api/localGenerator.js :: generateLocalHtml()` |
| F-06 | Generation progress/log UX | done | `src/App.jsx :: runGenerate(), generating screen` |
| F-07 | Result preview with desktop/tablet/mobile switching | done | `src/App.jsx :: result viewport controls` |
| F-08 | Inline edit mode with first free edit and paid subsequent edits | done | `src/App.jsx :: makeEditableHtml(), startEditMode(), confirmEdit(), cancelEdit()` |
| F-09 | AI text edit lane (+credit consumption) | done | `src/App.jsx :: RightPanel.handleTextEdit()` |
| F-10 | Feature add-on lane (map/kakao/popup/sns/form/animation etc.) | done | `src/App.jsx :: FEATURES, RightPanel.handleFeature()` |
| F-11 | Manual image replacement lane (logo/hero/products) | done | `src/App.jsx :: RightPanel.handleImgReplace(), ImageDropZone` |
| F-12 | AI image generation lane (DALL·E slot generation + patch) | done | `src/App.jsx :: AiImagePanel.handle(), generateDalleImage()` |
| F-13 | Credit accounting tied to server usage API | done | `src/App.jsx :: useCredit(), handleGenerate(), handleRegenerate()` |
| F-14 | Auth core (login/signup/code/reset/me) | done | `src/App.jsx :: submitAuth(), sendAuthCode(), fetchMe()` + `api/auth-*.js` |
| F-15 | Auth hardening: email normalization consistency | done | `src/App.jsx :: sendAuthCode(), submitAuth()` |
| F-16 | In-session password change for logged-in users | done | `src/App.jsx :: ChangePasswordBox` + `api/auth-change-password.js` |
| F-17 | Admin mode: credit transfer + user list | done | `src/App.jsx :: AdminTransferBox, AdminUsersPanel` + `api/admin-*.js` |
| F-18 | Admin quick entry in header and result account/admin tabs | done | `src/App.jsx :: openAdminMode(), Hdr(), result accountTab UI` |
| F-19 | Vercel Hobby function cap <= 12 유지 | done | `api/ (12 files)` |
| F-20 | Build verification for deployable bundle | done | `npm run build` |

## Notes
- This Phase 2 pass focuses on restoring v0.5.2 functional parity while preserving current auth/admin stability and function-count constraints.
- No API endpoints were added (function count remains 12).
