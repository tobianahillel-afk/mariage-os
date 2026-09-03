# External Content, Remote Images and Link Security

Status: **Normative V1/public-ready external-content security/privacy contract**

Mariage OS intentionally references public venue/vendor websites and remote marketing images. External content is outside the application's trust boundary.

## 1. Remote images are untrusted network requests

A remote image URL may:

- track IP/user-agent/network timing;
- receive cookies according to browser/site policy;
- redirect/change/disappear;
- point to an unexpected host;
- target localhost/private-network resources;
- serve unexpected content types;
- be extremely large/slow.

Therefore remote images are **nonessential references**, not trusted application assets.

## 2. Automatic remote-image loading policy

For direct browser-loaded remote marketing images:

- require `https:` for automatic loading;
- reject obvious loopback/private/link-local IP literal destinations and `localhost`-style hostnames;
- never put project/user/private data in query parameters;
- use `referrerpolicy="no-referrer"` or equivalent privacy behavior;
- lazy load/offscreen defer;
- reserve layout size to prevent content instability;
- treat failure as a broken reference, not an application failure;
- remote image cannot carry application authorization or become executable HTML/SVG.

DNS/private-network behavior cannot be proven safely from simple client string validation alone. Therefore direct remote images remain a bounded privacy/network risk and are never treated as a secure delivery channel.

## 3. Shared-project risk

In a future public/shared project, one member could submit a malicious remote image URL that another member's browser later requests.

Mitigations:

- automatic remote load restricted to validated HTTPS image URLs;
- block obvious local/private IP literal/hostname targets;
- do not automatically navigate/execute content;
- allow user to remove/disable broken/suspicious remote references;
- future public launch may choose an image-proxy/archive strategy if threat/privacy review justifies it.

If a server-side image proxy is introduced, it becomes an SSRF boundary and must implement the full `SEC-SRV-*` SSRF controls before activation.

## 4. Archived/private copies

For important final venues/vendors, user may choose to archive a copy in private Storage.

Archived copy:

- uses file validation/size limits;
- is project-authorized through Storage RLS;
- preserves original source URL/provenance separately;
- thumbnails/previews follow derivative/privacy policy;
- does not imply copyright ownership or public redistribution rights.

## 5. External navigation links

External source/map/vendor links:

- parsed/validated with standards-aware URL API;
- executable schemes rejected;
- no secret/private project payload appended;
- safe new-tab/opener behavior;
- referrer policy follows privacy contract;
- source domain shown to user when useful for trust/context.

## 6. No remote script execution

A source/image URL can never become:

- dynamic `<script src>`;
- stylesheet/plugin URL;
- dynamic JS import;
- iframe containing privileged application context;
- HTML injected into the app.

## 7. Content-type/format behavior

An URL entered as an image that responds with another type is treated as failed/untrusted media. Browser/application does not execute returned active content in the app origin.

Uploaded/private copy goes through `FILE-SECURITY.md` rather than trusting the remote extension.

## 8. Public launch decision

Before public SaaS activation, revisit direct remote-image strategy against:

- browser Private Network Access behavior at that time;
- tracking/privacy expectations;
- Storage/free-tier economics;
- image proxy SSRF cost/risk;
- content moderation/abuse needs.

No public launch may add a privileged image proxy as a “simple performance improvement” without SSRF/security design.

## 9. Tests

- `javascript:`/`data:`/non-HTTPS automatic image URLs rejected;
- `localhost`, `127.0.0.1`, `[::1]`, obvious private/link-local IP literals rejected for automatic remote media;
- private query/project token not leaked;
- no referrer sent where required;
- oversized/slow/broken image does not block page workflow;
- source image cannot execute script/HTML in app context;
- project switch/logout removes private archived copy visibility according to local/Storage policy.
