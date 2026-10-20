**Last updated: 20 October 2026**

This policy explains how the public aihappey browser application and its
HeaderAuth services handle personal information. HeaderAuth is the public
“bring your own key” (BYOK) distribution of the AI gateway, agents runtime and
Model Context Protocol (MCP) host. It does not require an aihappey sign-in for
ordinary use. Windows applications, AzureAuth deployments and independently
operated installations are outside this policy's scope.

**Publication note:** the clearly marked operator-completion fields in sections
3, 8 and 10 require deployment or legal information that cannot be established
from the application source. They must be completed before this notice is
published as the final notice for a live service.

## 1. Who is responsible and how to contact us

The controller for this public service is [achappey](https://achappey.nl), a sole proprietorship
registered in the Netherlands, operated by **Arthur Bleij**.

For privacy questions or to exercise your rights, contact
[privacy@achappey.nl](mailto:privacy@achappey.nl).

AI providers and services you connect may act as separate controllers or as
processors, depending on their terms and the applicable arrangements. This
policy does not replace their privacy notices. If you use a separately hosted
copy of aihappey, its operator is responsible for that installation.

## 2. The information involved

The information processed depends on the features you use:

- **Conversation content:** messages, instructions, history included with a
  request, generated answers, tool arguments and results, and agent or skill
  content used in a workflow.
- **Files and media:** attachments, filenames, file types, extracted text,
  images, audio, video, transcripts and generated files. Original files can
  contain personal information or embedded metadata, including location data.
- **Credentials and connections:** provider API keys, authentication headers,
  MCP access tokens, connected-service addresses and configuration you supply.
- **Preferences and local records:** language, appearance, model selections,
  agent/plugin settings, local memory, saved results and job identifiers.
- **Optional permissions:** microphone input when you start a recording or
  real-time feature, and location information when you enable location access
  and grant browser permission. Context such as your preferred language and
  appearance, and location when available, can be included in model instructions.
- **Technical information:** request identifiers, times, destinations, response
  status, errors and performance information. Web hosts and network services
  also receive connection information such as your IP address and browser's
  request headers.

Information can come from you, your browser, generated responses, or a connected
service acting on a requested tool or resource operation.

## 3. Why information is processed

We process information to provide the features you request: route AI requests,
authenticate provider and tool calls, execute agents, process attachments and
media, return results, maintain local preferences and enabled persistent
responses, and diagnose failures and protect service operation. You do not
have to provide an API key for a service that supports keyless access; a
provider that requires a key cannot be used without its required credentials.

We process personal information under the following GDPR legal bases:

- **Legitimate interests (Article 6(1)(f)):** operating the public BYOK service, processing user-initiated requests, maintaining security, preventing misuse and performing necessary operational diagnostics. Our interests must be balanced against the rights and freedoms of affected individuals.
- **Performance of a contract (Article 6(1)(b)):** where an applicable agreement exists and processing is necessary to provide the agreed services.
- **Legal obligations (Article 6(1)(c)):** complying with applicable legal requirements, including responding to data protection requests.

Optional browser permissions, such as microphone or location access, are requested when the relevant functionality is used. Granting browser permission does not automatically constitute GDPR consent for unrelated processing.

If you submit information about other people, you are responsible for having
authority and an appropriate legal basis to do so. Do not submit confidential,
sensitive or special-category personal information unless you have assessed
the selected provider, tools and safeguards and are entitled to disclose it.

## 4. Where processing and storage happen

These are separate layers; deleting information in one does not automatically
delete it from the others.

| Layer | What happens there |
| --- | --- |
| Your browser | Local history, files, results, preferences and connection settings can remain on your device in browser storage. |
| aihappey gateway, agents and MCP services | Requests, credentials, content and results are processed to fulfil your requests. There are also specific persistent records and temporary caches described below. |
| External providers and connected services | Selected AI providers, tool services and resource hosts process the information sent to them under their own terms and retention arrangements. |

### Browser storage and local history

The public browser client stores conversation history and supported file/media
libraries in **IndexedDB**, a browser database. It also uses **local storage**
for preferences and connection configuration, and local/session storage for
parts of MCP authentication. Depending on your usage, locally saved data also
includes agents, skills, plugins, tool definitions, provider settings, local
memory, search data and pending media-operation references.

Closing a tab does not delete persistent browser data. There is no general
automatic expiry for local conversation and file libraries. This public sample
does not configure an account-based remote conversation store. Local chat
history is nevertheless separate from persistent background responses held by
the agents service.

Local storage is not a promise that content will never leave your device.
Sending a message transmits the included context; enabled tools can read local
conversations, files or memory and return their contents into a model or tool
workflow. Exported archives and downloaded files create separate copies under
your control.

### Temporary gateway and runtime processing

For ordinary AI and foreground agent requests, the supplied HeaderAuth hosts
do not create a central conversation-history database. The client supplies the
history needed for a request. The gateway and runtime must still receive and
process messages, files, credentials and responses, including in memory and
network buffers.

“Stateless” does **not** mean no processing, no logging, no caching, or no
external storage. Model catalogues and skill content can be cached; configured
model-listing snapshots can be stored in cloud storage. Credential-derived
hashes can be used for cache identity. If end-user hashing is configured, a
key-derived pseudonymous identifier can be passed to supported AI providers
for their user-related functionality. Such identifiers are not a guarantee
of anonymity.

MCP maintains connection/session context and can cache skills. Particular media
tools can also create temporary files on the server. Cleanup is not a promise
of immediate or secure erasure after a crash. Tools that publish skills or
create files, records or other content in a connected service can produce
persistent data there.

### Persistent background agent responses

When background agent execution is enabled and you request it, a response
record is stored in the configured cloud response store so you can poll for
its status and retrieve its result. The record includes its identifier,
timestamps, lifecycle status, output, model/settings, safe errors and
non-authentication metadata and tool descriptions. These can contain personal
information. Background records remain persistent even when ordinary response
storage is not requested.

The updated HeaderAuth background implementation holds its execution request
and execution credentials **only in the accepting process's memory**. It does
not persist that request or its API keys/authentication headers in a durable
execution queue, request blob or credential sidecar. Before a response is
stored, recognised authentication/header structures are removed and known
credential echoes are redacted; other output and metadata remain persistent.

Execution has a configurable deadline, including waiting time. The source
default is 15 minutes; this is an **execution limit, not a response-retention
period**. A process restart loses the execution credentials, not the durable
response. Another instance can retrieve that response but cannot resume the
lost execution. Unfinished work is marked failed after its deadline when
polling or a running expiry sweep can access storage. Agent/tool execution is
not automatically replayed. Retrying a request yourself may repeat actions
already performed by an external service.

## 5. BYOK, credential storage and security limits

BYOK means that you supply credentials issued by your chosen provider. The
provider authenticates and, where applicable, bills usage on your account. It
does **not** mean that the key stays exclusively on your device: it is sent to
the configured gateway or agent service and used for downstream requests.
The browser can send its configured credential headers together; do not assume
that a gateway receives only the key for the currently selected model. Changing
an endpoint changes the service receiving those headers.

The dedicated saved-provider-key feature encrypts the saved key collection in
your browser with **AES-256-GCM**, using a password-derived key. The unlocking
password and decrypted keys are held in application memory, not included in
that feature's persistent settings. While unlocked, credentials must be
available to the application to make requests. This is not end-to-end
encryption of conversations or protection from a compromised browser session.

That encryption does **not** cover all browser information. Conversation/file
databases, custom provider headers, MCP connection settings, agent/plugin
configuration and MCP OAuth tokens use separate storage paths and are not
automatically protected by the saved-provider-key password. Do not put secrets
in ordinary settings, messages, files, exported configurations or metadata.
Browser extensions, scripts running in the site and other users of the same
browser profile can present risks.

Use trusted endpoints and HTTPS for remote services. A gateway and a provider
can read content that they need to process. Response redaction is not a
universal secret detector: a secret pasted into prose or transformed by a tool
may not be recognised. Memory-only execution also does not guarantee secure
erasure of managed memory, operating-system swap, crash dumps or downstream
copies. Removing a saved key does not revoke it; revoke exposed credentials
with their issuer.

## 6. AI providers, agents, tools, skills and other recipients

Your selected AI provider receives the content and parameters required by the
operation. This may include conversation history, instructions, attachments,
extracted text, tool definitions/results and provider-specific metadata, not
just your latest message. Supported operations include chat, embeddings,
reranking, transcription, speech, images, video and real-time sessions. Some
real-time connections run directly between your browser and a provider.

Examples of supported providers include OpenAI, Anthropic, Google and Mistral;
the recipients actually involved depend on your selections and agent
configuration. A routing provider or external managed-agent service may use
additional providers of its own. Provider-native files, agents, conversations,
memory, generated media and background jobs can persist with that provider.
Requesting non-storage where supported does not establish zero retention for
all provider operations, security logs or abuse prevention. There is no
universal no-training or no-retention guarantee across providers: review the
provider's notice, account settings and contractual terms before sending data.

Agents can make several model and tool calls and share intermediate results
between steps. A skill or plugin can supply instructions, files and additional
connections. An MCP server receives protocol information, relevant tool
arguments, resource requests, credentials configured for that connection and
any information you submit through its forms. Tool results can then be sent
back to an AI provider. MCP sampling can also involve an additional model call.

Tools can search the web, read external resources, upload content or change
data in connected systems. Some actions create lasting records or have other
effects. Only enable services and tools you trust and review the available
permissions; do not assume every action is read-only or requires a separate
confirmation. Disconnecting a service does not undo earlier actions.

Your browser also contacts configured model/MCP registries and resource hosts.
The public sample includes the official MCP registry. Stylesheets, PDF/media
processing components, maps, icons and remote content can cause requests to
external hosts, including jsDelivr and, for supported media fallbacks, unpkg.
Those hosts receive ordinary network request information. Loading a component
from a CDN is distinct from sending a document to an AI provider; it is not
itself a claim that the CDN receives your document contents.

## 7. Logs, diagnostics, cookies and tracking

The supplied public client does not integrate an application analytics SDK or
advertising trackers. It uses browser databases and local/session storage for
application functionality rather than cookies for conversation history.
The HeaderAuth applications do not register Azure Monitor or Application
Insights. These statements do **not** mean that hosting, proxies, CDNs,
connected websites or providers have no logs or cookies.

The services retain ordinary operational logging capabilities, including
errors, correlation identifiers and model-listing events. Hosting/access logs
can include IP addresses, request paths, timing and status information.
Infrastructure configuration determines what is retained; removing Azure
Monitor does not switch off web-server or platform logging.

API debugging is optional and off by default in the client. When enabled,
supported requests ask the gateway to return provider diagnostics, which can
contain request/response content and personal information. Live gateway debug
events are transient: the client does not add them to conversation history or
later chat requests. Other request/response details saved as part of a result,
and diagnostics you copy or export, can persist separately. MCP log
notifications and client errors can also appear in the browser
console. The shared gateway code supports a separately opted-in console debug
sink; the supplied public HeaderAuth hosts do not enable it. Do not share
debug output without reviewing it for sensitive information.

If non-essential analytics, cookies or other tracking are added by a hosting
configuration or a future version, they require an accurate notice and any
consent required by applicable law. Browser permission prompts for microphone
or location are separate from cookie or analytics consent.

## 8. Retention and deletion

| Information | Retention and deletion |
| --- | --- |
| Browser conversations, files, results and settings | Remain until removed using available app controls or the browser's site-data controls, or until the browser clears them. Closing the app is not deletion. |
| Background agent responses | No automatic response-retention expiry is implemented. Records remain until explicitly deleted or removed by an operator storage policy. Execution expiry changes status; it does not delete output or metadata. |
| Temporary execution context and caches | Held for request/connection processing, bounded background execution or the relevant cache lifetime. Releasing application references is not guaranteed secure erasure. |
| Published skills and content created through tools | Remain in the configured storage or connected service until its own deletion/retention mechanisms remove them. |
| Provider files, jobs, conversations, media and logs | Governed by the provider's controls, agreements and retention rules. Deleting local history does not recall these copies. |
| Hosting logs, backups and storage versions | Subject to separate hosting and storage configuration; deleting a live record does not necessarily immediately remove backups, soft-deleted copies, snapshots or older versions. |

You can remove individual conversations and library items using their available
controls. These libraries are separate: deleting a conversation does not
automatically delete independently saved files, media, memory or exports.
Clearing **all site data** for the app removes its browser-stored data, including
saved keys and connection tokens, but not your downloaded copies or remote data.

The agents API supports deleting a stored background response. Successful
deletion removes the current record from normal retrieval; a late completion
does not recreate it. Deletion does not guarantee that an external operation
already running has stopped, and does not undo tool actions. Keep response
identifiers and any result links private. Contact us if you need assistance
identifying or deleting records held by this service; never send an API key
as proof of identity.

The public aihappey infrastructure is hosted on Microsoft Azure in the West Europe region (Netherlands).
No additional application-level retention policy has been configured for background Responses. These records remain stored until explicitly deleted or removed by an applicable storage policy.
Browser conversations and locally stored data remain on the user's device until deleted by the user or cleared by the browser.
Infrastructure logs, backups and storage recovery mechanisms follow the applicable Azure service configuration and default settings. Retention periods may differ between services.
Azure Monitor and Application Insights are not enabled in the public HeaderAuth applications.
Data transmitted to external AI providers and connected services is subject to their respective retention and privacy policies.

The updated background credential protection applies to new runs on the
updated service. It does not retrospectively erase payloads or older records
created by a previous implementation. Any historical cleanup, backup cleanup
or credential revocation must be handled separately.

## 9. Your choices and data-protection rights

You can choose providers and endpoints, limit the history and files you send,
disable unneeded tools, remove saved credentials and connections, delete local
records, export supported conversation data, and revoke browser permissions.
Refusing a permission may prevent the corresponding feature from working.
For connected-service access, use that service's revocation controls as well
as removing the connection locally.

Where the GDPR applies, and subject to its conditions and exceptions, you have
rights to:

- Access your personal data and receive information about its processing.
- Correct inaccurate information and request erasure.
- Restrict processing and object to processing based on legitimate interests.
- Receive portable data where processing is automated and based on consent or
  a contract, and request transmission where technically feasible.
- Withdraw consent at any time where consent is the legal basis, without
  affecting the lawfulness of earlier processing.
- Exercise applicable rights concerning decisions based solely on automated
  processing that produce legal or similarly significant effects.
- Complain to a supervisory authority, including the
  [Dutch Autoriteit Persoonsgegevens](https://www.autoriteitpersoonsgegevens.nl/)
  or the authority where you live, work or believe an infringement occurred.

Send requests to [privacy@achappey.nl](mailto:privacy@achappey.nl). We may need
proportionate information to locate a record and verify authority to access it.
We cannot retrieve browser-only history from our servers, and do not need
your API key or unlocking password to handle a privacy request. GDPR requests
must generally be answered within one month; permitted extensions or legal
exceptions will be explained where applicable. For information controlled
independently by an AI provider or tool service, you may also need to contact
that service. AI output can be inaccurate; review it before relying on it,
especially for decisions about people.

## 10. International processing

The location of processing depends on the hosting infrastructure, selected
provider, routing service and connected tools. A provider's name, a region shown
in the interface, or BYOK usage does not by itself guarantee that all processing
and support access remain in the Netherlands or the European Economic Area.

aihappey's own application infrastructure and configured data storage are hosted on Microsoft Azure in the **West Europe region (Netherlands, European Economic Area)**.
Hosting data within the EEA does not necessarily exclude access or processing from outside the EEA by Microsoft or its subprocessors, including for support and service operations. Applicable international transfers are governed by the relevant Microsoft contractual and data protection arrangements.
Users can connect AI providers, MCP servers and other external services operating in different countries. Information transmitted to these services may be processed outside the EEA, depending on the selected provider, its infrastructure and its applicable terms.
Where achappey is responsible for an international transfer subject to the GDPR, an applicable adequacy decision or appropriate safeguards under Chapter V of the GDPR are required, such as the European Commission's Standard Contractual Clauses.
Users should review the privacy policies and data processing arrangements of their selected external providers and connected services.

Your own provider account and connected services can have separate transfer
arrangements, which you should review before choosing them.

## 11. Changes to this policy

We will update this policy when the service's information-handling practices
change. The date above identifies this revision. Material changes will be
communicated and consent sought where applicable law requires it. This notice
describes the public HeaderAuth distribution; it is not a blanket privacy
guarantee for every installation or third-party service it can connect to.
