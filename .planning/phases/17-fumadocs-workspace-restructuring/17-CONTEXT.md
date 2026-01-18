# Phase 17: Fumadocs Workspace Restructuring - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<vision>
## How This Should Work

The documentation restructures into two clean workspaces using Fumadocs workspace features:

1. **Main workspace** - Learning content (guides, tutorials, examples, best practices)
2. **API workspace** - Technical reference (tools, resources, prompts)

Think of it like separating a book (learning journey) from an encyclopedia (reference lookup).

**Key principle:** Workspaces work behind the scenes. URLs stay the same (`/docs/guides`, `/docs/api/tools`), navigation remains unified and seamless to users. The split is architectural, not visible - users experience one cohesive documentation site while developers work with cleaner, better-organized code.

This enables independent workspace configurations while maintaining the polished user experience from Phase 16.

</vision>

<essential>
## What Must Be Nailed

All three outcomes are equally critical for this phase:

- **Clean code organization** - Clear boundaries between content types, independent configs per workspace, easier to understand where things live
- **User experience** - Better discoverability through logical content separation, while keeping navigation seamless and unified
- **Future scalability** - Foundation for submodule structure, multi-repo docs, or expansion to other content types

The restructuring succeeds when: code is cleaner, users find things easier, and the architecture supports future growth - all three together.

</essential>

<specifics>
## Specific Ideas

**Workspace structure:**
- Main workspace: `docs/content/docs/` - guides, tutorials, examples, best-practices
- API workspace: `docs/content/api/` or similar - tools, resources, prompts

**Configuration:**
- Each workspace gets its own `source.config.ts`
- Root config integrates both via Fumadocs `multiple()` loader
- Keep current URL structure (`/docs/*` for everything)

**Navigation:**
- Single unified sidebar (user doesn't see workspace boundaries)
- Seamless experience - no visual split, no duplicate navbars
- Logical grouping maintained from Phase 16

**Reference:** Fumadocs workspace documentation at https://www.fumadocs.dev/docs/mdx/workspace shows the pattern for multi-workspace setups with independent configs.

</specifics>

<notes>
## Additional Context

This follows naturally from Phase 16's documentation polish - now that content is high-quality and well-organized, the architecture can be improved to support better maintenance and future growth.

The workspace feature solves a real architectural need: separating learning content (which evolves with use cases) from API reference (which mirrors server implementation). This separation enables cleaner submodule structure if needed later.

Success means developers can work on each workspace independently with clear boundaries, while users experience the same unified, professional documentation site.

</notes>

---

*Phase: 17-fumadocs-workspace-restructuring*
*Context gathered: 2026-01-18*
