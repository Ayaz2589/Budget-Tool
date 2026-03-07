## Plan: Dashboard sheets to modals on desktop

**What:** Convert DsWidgetCatalog and DashboardFilters from right-sliding sheets to centered modals on desktop.
**Why:** Consistency with the rest of the app — all other sheet-based dialogs already use `desktopVariant="modal"`.

**Acceptance criteria:**
- [x] DsWidgetCatalog renders as a centered modal on desktop (still slides up on mobile)
- [x] DashboardFilters renders as a centered modal on desktop (still slides up on mobile)
- [x] Existing tests pass
- [x] Visual behavior: mobile unchanged (slide-up sheet), desktop shows centered modal

**Implementation steps:**
1. Add `desktopVariant="modal"` to SheetContent in DsWidgetCatalog
2. Add `desktopVariant="modal"` to SheetContent in DashboardFilters
3. Adjust any width/layout classes that assume right-side sheet positioning
4. Run tests

**Gotchas:**
- SheetContent already supports `desktopVariant="modal"` with `desktopModalSize` prop
- DashboardFilters has `side="right"` specific classes (rounded-l-2xl, border-l, w-[85vw]) that should be cleaned up for modal mode
- DsWidgetCatalog has `w-80 sm:w-96` which may need adjustment for modal
