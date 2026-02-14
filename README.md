# aihappey-chat

[![aihappey-chat](https://achappey.github.io/aihappey-chat/images/screenshot_chat.png)](https://chat.aihappey.com)

**Open-source AI chat client with streaming, tools, MCP, and rich message rendering.**

[Open the live app](https://chat.aihappey.com) · [Watch Streaming UI demo](https://github.com/achappey/aihappey-chat/raw/main/videos/StreamingUI.mp4) · [Storybook Chat](https://achappey.github.io/aihappey-chat/storybook-chat) · [Storybook Themes](https://achappey.github.io/aihappey-chat/storybook-themes)

---

## What this app is

`aihappey-chat` is an end-user AI chat client.  
It helps you chat with models, switch providers, use tools/MCP, and work with rich outputs in one interface.

## What you can do in this chat client

- Run normal chat conversations and see streamed replies in real time.
- Switch models and providers without leaving the same chat experience.
- Explore available models and compare options in the model explorer.
- Use the AI mesh view to understand provider/model relationships.
- Connect MCP servers and use MCP tools/resources during conversations.
- Use tool calling flows and inspect tool output directly in chat.
- Use Streaming UI apps/cards that appear during generation for dashboards, forms, and other structured outputs.
- Attach files and view rich message content (markdown, code, charts, PDFs, images, 3D).
- Use speech and transcription-related capabilities when enabled by your backend setup.
- Use reranking flows when you need document relevance scoring.
- Work with user settings and theme options (Fluent / Bootstrap).

## Screenshots

<p align="center">
  <img src="docs/images/screenshot_ai_models.png" alt="AI model explorer" width="32%" />
  <img src="docs/images/screenshot_mesh.png" alt="AI mesh view" width="32%" />
  <img src="docs/images/screenshot_streaming_ui.png" alt="Streaming UI in chat" width="32%" />
</p>

1. **AI model explorer**: browse/filter models by modality and capabilities.
2. **AI mesh**: inspect how providers and models are connected.
3. **Streaming UI**: see response parts and updates as they arrive.

## Provider logo wall

The provider list is sourced from [`PROVIDERS`](packages/aihappey-core/src/runtime/providers/providers.ts) and catalog definitions in [`packages/aihappey-core/src/runtime/providers/catalog`](packages/aihappey-core/src/runtime/providers/catalog).

<!-- PROVIDER_LOGO_GRID_START -->
<p>
<a href="https://openai.com" title="OpenAI" target="_blank" rel="noopener noreferrer"><img src="https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/openai.png" alt="OpenAI" width="28" height="28" /></a>
<a href="https://runwayml.com" title="Runway" target="_blank" rel="noopener noreferrer"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQE01cLcJx7cJONWLVmk5tRBhGB0LIJ8SqSQ&s" alt="Runway" width="28" height="28" /></a>
<a href="https://aimlapi.com" title="AIML" target="_blank" rel="noopener noreferrer"><img src="https://media.licdn.com/dms/image/v2/D560BAQFF5cVF9c_cOw/company-logo_200_200/company-logo_200_200/0/1709201452469/aimlapi_logo?e=2147483647&v=beta&t=l2fmaW9qdhOZ9wR3sukZpFYETyNGEA5jatU66ECxdFQ" alt="AIML" width="28" height="28" /></a>
<a href="https://www.anthropic.com" title="Anthropic" target="_blank" rel="noopener noreferrer"><img src="https://upload.wikimedia.org/wikipedia/commons/1/14/Anthropic.png" alt="Anthropic" width="28" height="28" /></a>
<a href="https://euqai.eu" title="Euqai" target="_blank" rel="noopener noreferrer"><img src="https://euqai.eu/home/images/euqai-q-logo.png" alt="Euqai" width="28" height="28" /></a>
<a href="https://reka.ai" title="RekaAI" target="_blank" rel="noopener noreferrer"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8CsOEbRgvL2rm3WdVU2bSTfZp2Vpli4tKTg&s" alt="RekaAI" width="28" height="28" /></a>
<a href="https://ai.google" title="Google" target="_blank" rel="noopener noreferrer"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Google-gemini-icon.svg/2048px-Google-gemini-icon.svg.png" alt="Google" width="28" height="28" /></a>
<a href="https://www.segmind.com" title="Segmind" target="_blank" rel="noopener noreferrer"><img src="https://www.segmind.com/favicon-192x192.png" alt="Segmind" width="28" height="28" /></a>
<a href="https://mistral.ai" title="Mistral" target="_blank" rel="noopener noreferrer"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Mistral_AI_logo_%282025%E2%80%93%29.svg/1200px-Mistral_AI_logo_%282025%E2%80%93%29.svg.png" alt="Mistral" width="28" height="28" /></a>
<a href="https://lecto.ai" title="LectoAI" target="_blank" rel="noopener noreferrer"><img src="https://lecto.ai/assets/images/image02.jpg?v=7b019a46" alt="LectoAI" width="28" height="28" /></a>
<a href="https://www.gmicloud.ai" title="GMICloud" target="_blank" rel="noopener noreferrer"><img src="https://media.licdn.com/dms/image/v2/D560BAQEsBULlhfGPqQ/company-logo_200_200/B56Zne.6XHJkAI-/0/1760382658219/gmi_cloud_ai_logo?e=2147483647&v=beta&t=twsM32b1vBNGyFxF8f3WkA_6wSfTJ79BcEaSYe_oRvo" alt="GMICloud" width="28" height="28" /></a>
<a href="https://byteplus.com" title="BytePlus" target="_blank" rel="noopener noreferrer"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJpF-GaGgjh9vGom4cCE4O3c83d7YSogg-uQ&s" alt="BytePlus" width="28" height="28" /></a>
<a href="https://cohere.com" title="Cohere" target="_blank" rel="noopener noreferrer"><img src="https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/cohere-color.png" alt="Cohere" width="28" height="28" /></a>
<a href="https://www.modernmt.com" title="ModernMT" target="_blank" rel="noopener noreferrer"><img src="https://rws-prod-appstore-resources-eu-central-1.s3.amazonaws.com/ada56836-b958-4588-aab3-567b2ad727d0/Resources/ModernMT.png?dl=1" alt="ModernMT" width="28" height="28" /></a>
<a href="https://groq.com" title="Groq" target="_blank" rel="noopener noreferrer"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnze6t-thGVKlIKNKF9zeiTfaoxLdYdVzX0g&s" alt="Groq" width="28" height="28" /></a>
<a href="https://x.ai" title="xAI" target="_blank" rel="noopener noreferrer"><img src="https://registry.npmmirror.com/@lobehub/icons-static-png/1.74.0/files/dark/xai.png" alt="xAI" width="28" height="28" /></a>
<a href="https://www.together.ai" title="Together" target="_blank" rel="noopener noreferrer"><img src="https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/light/together-color.png" alt="Together" width="28" height="28" /></a>
<a href="https://translate.google.com" title="GoogleTranslate" target="_blank" rel="noopener noreferrer"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Google_Translate_logo.svg/960px-Google_Translate_logo.svg.png" alt="GoogleTranslate" width="28" height="28" /></a>
<a href="https://www.siliconflow.com" title="SiliconFlow" target="_blank" rel="noopener noreferrer"><img src="https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/siliconcloud-color.png" alt="SiliconFlow" width="28" height="28" /></a>
<a href="https://deepbricks.ai" title="Deepbricks" target="_blank" rel="noopener noreferrer"><img src="https://pbs.twimg.com/profile_images/1793491402493771776/7wCjgiQZ_400x400.jpg" alt="Deepbricks" width="28" height="28" /></a>
<a href="https://www.ovhcloud.com" title="OVHcloud" target="_blank" rel="noopener noreferrer"><img src="https://pbs.twimg.com/profile_images/1178940876078407680/p0SH0xKH_400x400.jpg" alt="OVHcloud" width="28" height="28" /></a>
<a href="https://inworld.ai" title="Inworld" target="_blank" rel="noopener noreferrer"><img src="https://inworld.ai/favicon.ico" alt="Inworld" width="28" height="28" /></a>
<a href="https://www.cometapi.com" title="CometAPI" target="_blank" rel="noopener noreferrer"><img src="https://avatars.githubusercontent.com/u/225111184?s=200&v=4" alt="CometAPI" width="28" height="28" /></a>
<a href="https://ark-labs.cloud" title="ARKLabs" target="_blank" rel="noopener noreferrer"><img src="https://pbs.twimg.com/profile_images/1953784719708934144/GJ-a2b5O_400x400.jpg" alt="ARKLabs" width="28" height="28" /></a>
<a href="https://lingvanex.com" title="Lingvanex" target="_blank" rel="noopener noreferrer"><img src="https://media.licdn.com/dms/image/v2/C4D0BAQHIYe-AlXNXcw/company-logo_200_200/company-logo_200_200/0/1630569764634/lingvanex_logo?e=2147483647&v=beta&t=NHkF-KaIYGhU4wkrQi2hr1H1dnyZhV_tRr0HjuWMcBg" alt="Lingvanex" width="28" height="28" /></a>
<a href="https://www.nextbit256.com" title="Nextbit" target="_blank" rel="noopener noreferrer"><img src="https://www.nextbit256.com/Nextbit_mark_Main@2x.png" alt="Nextbit" width="28" height="28" /></a>
<a href="https://cortecs.ai" title="Cortecs" target="_blank" rel="noopener noreferrer"><img src="https://media2.dev.to/dynamic/image/width=320,height=320,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Forganization%2Fprofile_image%2F10180%2F1e7ba1da-bc26-4910-95a9-2d5a30e47b55.png" alt="Cortecs" width="28" height="28" /></a>
<a href="https://opper.ai" title="OpperAI" target="_blank" rel="noopener noreferrer"><img src="https://avatars.githubusercontent.com/u/145928785?s=280&v=4" alt="OpperAI" width="28" height="28" /></a>
<a href="https://www.eurouter.ai" title="EUrouter" target="_blank" rel="noopener noreferrer"><img src="https://www.eurouter.ai/favicon.ico" alt="EUrouter" width="28" height="28" /></a>
<a href="https://www.upstage.ai" title="Upstage" target="_blank" rel="noopener noreferrer"><img src="https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/upstage-color.png" alt="Upstage" width="28" height="28" /></a>
<a href="https://cloud.ionos.com" title="IONOS" target="_blank" rel="noopener noreferrer"><img src="https://avatars.githubusercontent.com/u/67323449?s=200&v=4" alt="IONOS" width="28" height="28" /></a>
<a href="https://berget.ai" title="BergetAI" target="_blank" rel="noopener noreferrer"><img src="https://media.licdn.com/dms/image/v2/D4D0BAQHQGuTgU7ix9w/company-logo_200_200/B4DZWbcxfDGkAI-/0/1742069766482/bergetai_logo?e=2147483647&v=beta&t=EkSpekwlwpXxB9L4u92NEy8s1jqTJaxMnEaSTr1tfZA" alt="BergetAI" width="28" height="28" /></a>
<a href="https://regolo.ai" title="RegoloAI" target="_blank" rel="noopener noreferrer"><img src="https://regolo.ai/wp-content/themes/regolo/img/hero-image.png" alt="RegoloAI" width="28" height="28" /></a>
<a href="https://pollinations.ai" title="Pollinations" target="_blank" rel="noopener noreferrer"><img src="https://avatars.githubusercontent.com/u/86964862?v=4" alt="Pollinations" width="28" height="28" /></a>
<a href="https://nlpcloud.com" title="NLPCloud" target="_blank" rel="noopener noreferrer"><img src="https://nlpcloud.com/assets/images/logo.png" alt="NLPCloud" width="28" height="28" /></a>
<a href="https://www.hyperstack.cloud" title="Hyperstack" target="_blank" rel="noopener noreferrer"><img src="https://www.hyperstack.cloud/hubfs/hyperstack_2023/blog/plain.jpg" alt="Hyperstack" width="28" height="28" /></a>
<a href="https://www.requesty.ai" title="Requesty" target="_blank" rel="noopener noreferrer"><img src="https://requesty.ai/favicon.ico" alt="Requesty" width="28" height="28" /></a>
<a href="https://www.recraft.ai" title="Recraft" target="_blank" rel="noopener noreferrer"><img src="https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/recraft.png" alt="Recraft" width="28" height="28" /></a>
<a href="https://www.perplexity.ai" title="Perplexity" target="_blank" rel="noopener noreferrer"><img src="https://brandlogos.net/wp-content/uploads/2025/05/perplexity_icon-logo_brandlogos.net_a9d3e-512x591.png" alt="Perplexity" width="28" height="28" /></a>
<a href="https://json2video.com" title="JSON2Video" target="_blank" rel="noopener noreferrer"><img src="https://gdm-catalog-fmapi-prod.imgix.net/ProductLogo/11e2323a-3eee-468f-a99c-e059e95777b0.png?w=80&h=80&fit=max&dpr=3&auto=format&q=50" alt="JSON2Video" width="28" height="28" /></a>
<a href="https://www.deepl.com" title="DeepL" target="_blank" rel="noopener noreferrer"><img src="https://hel1.your-objectstorage.com/ztudium-cms/deepl_7baa54aa02.jpeg" alt="DeepL" width="28" height="28" /></a>
<a href="https://www.speechmatics.com" title="Speechmatics" target="_blank" rel="noopener noreferrer"><img src="https://upload.wikimedia.org/wikipedia/commons/1/1a/SM-Icon-Dark_Cyan1000.png" alt="Speechmatics" width="28" height="28" /></a>
<a href="https://github.com/d4n3436/GTranslate" title="GTranslate" target="_blank" rel="noopener noreferrer"><img src="https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png" alt="GTranslate" width="28" height="28" /></a>
<a href="https://synexa.ai" title="Synexa" target="_blank" rel="noopener noreferrer"><img src="https://pbs.twimg.com/ext_tw_video_thumb/1892346379894222848/pu/img/jUFHl2xNmS5crh-a.jpg" alt="Synexa" width="28" height="28" /></a>
<a href="https://www.moonshot.ai" title="Moonshot" target="_blank" rel="noopener noreferrer"><img src="https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/moonshot.png" alt="Moonshot" width="28" height="28" /></a>
<a href="https://greenpt.ai" title="GreenPT" target="_blank" rel="noopener noreferrer"><img src="https://greenpt.ai/content/uploads/2026/01/2993679_brand_brands_logo_logos_opera_icon@2x-800x800.webp" alt="GreenPT" width="28" height="28" /></a>
<a href="https://decart.ai" title="Decart" target="_blank" rel="noopener noreferrer"><img src="https://storage.googleapis.com/clean-finder-353810/$bQq0ks0xSdvRsJY1WjayY9ck9qGR1V9MtFzr7KUmp7YNU9GAqBd7fG.jpeg" alt="Decart" width="28" height="28" /></a>
<a href="https://relax.ai" title="RelaxAI" target="_blank" rel="noopener noreferrer"><img src="https://relax.ai/images/home/pricing/relaxai-logomark.svg" alt="RelaxAI" width="28" height="28" /></a>
<a href="https://www.horay.ai" title="HorayAI" target="_blank" rel="noopener noreferrer"><img src="https://www.google.com/s2/favicons?sz=128&domain=horay.ai" alt="HorayAI" width="28" height="28" /></a>
<a href="https://jina.ai" title="Jina" target="_blank" rel="noopener noreferrer"><img src="https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/jina.png" alt="Jina" width="28" height="28" /></a>
<a href="https://sunoapi.org" title="SunoAPI" target="_blank" rel="noopener noreferrer"><img src="https://sunoapi.org/logo.png" alt="SunoAPI" width="28" height="28" /></a>
<a href="https://bytez.com" title="Bytez" target="_blank" rel="noopener noreferrer"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTq-FM1H-8h8v2kJOjVa7gYIXq45Wl2c4fXEw&s" alt="Bytez" width="28" height="28" /></a>
<a href="https://www.matterai.so" title="MatterAI" target="_blank" rel="noopener noreferrer"><img src="https://www.matterai.so/favicon.png" alt="MatterAI" width="28" height="28" /></a>
<a href="https://publicai.co" title="PublicAI" target="_blank" rel="noopener noreferrer"><img src="https://substackcdn.com/image/fetch/$s_!c8nI!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F741518ed-a7e5-4054-a0b5-c1faeceb2f09_551x551.png" alt="PublicAI" width="28" height="28" /></a>
<a href="https://www.nscale.com" title="Nscale" target="_blank" rel="noopener noreferrer"><img src="https://startuprise.co.uk/wp-content/uploads/2025/04/nscale_cloud_logo.jpg" alt="Nscale" width="28" height="28" /></a>
<a href="https://openrouter.ai" title="OpenRouter" target="_blank" rel="noopener noreferrer"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtUJ7sIo-IoQEx5qCcqYFmJE47fYgbnKe80A&s" alt="OpenRouter" width="28" height="28" /></a>
<a href="https://302.ai" title="302AI" target="_blank" rel="noopener noreferrer"><img src="https://302.ai/img/logo.png" alt="302AI" width="28" height="28" /></a>
<a href="https://www.primeintellect.ai" title="PrimeIntellect" target="_blank" rel="noopener noreferrer"><img src="https://app.primeintellect.ai/favicon-256x256.png" alt="PrimeIntellect" width="28" height="28" /></a>
<a href="https://www.resemble.ai" title="ResembleAI" target="_blank" rel="noopener noreferrer"><img src="https://pbs.twimg.com/profile_images/1496504056436727818/Flpn3gIT_400x400.jpg" alt="ResembleAI" width="28" height="28" /></a>
<a href="https://www.assemblyai.com" title="AssemblyAI" target="_blank" rel="noopener noreferrer"><img src="https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/light/assemblyai-color.png" alt="AssemblyAI" width="28" height="28" /></a>
<a href="https://www.gladia.io" title="Gladia" target="_blank" rel="noopener noreferrer"><img src="https://pbs.twimg.com/profile_images/1671129329302896640/bX2pGpi0_400x400.jpg" alt="Gladia" width="28" height="28" /></a>
<a href="https://github.com/microsoft/kernel-memory" title="KernelMemory" target="_blank" rel="noopener noreferrer"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/960px-Microsoft_logo.svg.png" alt="KernelMemory" width="28" height="28" /></a>
<a href="https://portkey.ai" title="Portkey" target="_blank" rel="noopener noreferrer"><img src="https://media.licdn.com/dms/image/v2/D4D0BAQF6D3Bf64c7_Q/company-logo_200_200/company-logo_200_200/0/1706756517195/portkey_ai_logo?e=2147483647&v=beta&t=m4yu6L4zWSJ_N1EPpuWrqN3BN7sDZzprqPqQqnpllCE" alt="Portkey" width="28" height="28" /></a>
<a href="https://www.minimax.io" title="MiniMax" target="_blank" rel="noopener noreferrer"><img src="https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/minimax-color.png" alt="MiniMax" width="28" height="28" /></a>
<a href="https://www.sarvam.ai" title="Sarvam" target="_blank" rel="noopener noreferrer"><img src="https://www.peakxv.com/wp-content/uploads/sites/2/2024/02/sarvam.ai-idJ9Sr0Dj7.jpeg" alt="Sarvam" width="28" height="28" /></a>
<a href="https://sudoapp.dev" title="Sudo" target="_blank" rel="noopener noreferrer"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHpkT8SvBa8pZvJeKuxvxVuSpcFAXnwHz-Hg&s" alt="Sudo" width="28" height="28" /></a>
<a href="https://deepgram.com" title="Deepgram" target="_blank" rel="noopener noreferrer"><img src="https://avatars.githubusercontent.com/u/17422641?s=280&v=4" alt="Deepgram" width="28" height="28" /></a>
<a href="https://www.voyageai.com" title="VoyageAI" target="_blank" rel="noopener noreferrer"><img src="https://blog.voyageai.com/wp-content/uploads/2023/10/logo.png" alt="VoyageAI" width="28" height="28" /></a>
<a href="https://friendli.ai" title="Friendli" target="_blank" rel="noopener noreferrer"><img src="https://friendli.ai/favicon/apple-touch-icon.png" alt="Friendli" width="28" height="28" /></a>
<a href="https://bria.ai" title="Bria" target="_blank" rel="noopener noreferrer"><img src="https://media.licdn.com/dms/image/v2/D560BAQE49KK-YdA1Sw/company-logo_200_200/B56ZgemHKHHMAM-/0/1752859967087/briaai_logo?e=2147483647&v=beta&t=RCAM92DfkmxueBQG_92cZNWumsoBu5BHrCSBBX1vQak" alt="Bria" width="28" height="28" /></a>
<a href="https://contextual.ai" title="ContextualAI" target="_blank" rel="noopener noreferrer"><img src="https://media.licdn.com/dms/image/v2/D560BAQEUQLTc-jpQAQ/company-logo_200_200/B56ZnCdNsrIYAI-/0/1759904062535/contextualai_logo?e=2147483647&v=beta&t=Nfk2U-IagqdIr1crFoT4nS9MkEeA2_BYNGsGiFl6rJM" alt="ContextualAI" width="28" height="28" /></a>
<a href="https://murf.ai" title="MurfAI" target="_blank" rel="noopener noreferrer"><img src="https://website.cdn.speechify.com/murf-ai-app-logo.png?quality=95&width=2800" alt="MurfAI" width="28" height="28" /></a>
<a href="https://replicate.com" title="Replicate" target="_blank" rel="noopener noreferrer"><img src="https://media.licdn.com/dms/image/v2/D560BAQGbWdPmxf-NMA/company-logo_200_200/company-logo_200_200/0/1701798584156/replicate_logo?e=2147483647&v=beta&t=_xwx0D-qYlw-CzeBbHT7DDFoaxHp9WPen28-FTvoZak" alt="Replicate" width="28" height="28" /></a>
<a href="https://www.asyncapi.com" title="AsyncAI" target="_blank" rel="noopener noreferrer"><img src="https://media.licdn.com/dms/image/v2/D4E0BAQH8IAPHkrLBIA/company-logo_200_200/company-logo_200_200/0/1738686836840/async_ai_logo?e=2147483647&v=beta&t=xzU-nIDFl9Fvyye-7Ki46HPuZyq1ZKxbnFjexRjFbK4" alt="AsyncAI" width="28" height="28" /></a>
<a href="https://azure.microsoft.com" title="Azure" target="_blank" rel="noopener noreferrer"><img src="https://brandlogos.net/wp-content/uploads/2022/07/microsoft_azure-logo_brandlogos.net_mlyt6-512x512.png" alt="Azure" width="28" height="28" /></a>
<a href="https://www.deepseek.com" title="DeepSeek" target="_blank" rel="noopener noreferrer"><img src="https://images.seeklogo.com/logo-png/61/1/deepseek-ai-icon-logo-png_seeklogo-611473.png" alt="DeepSeek" width="28" height="28" /></a>
<a href="https://app.reve.com" title="Reve" target="_blank" rel="noopener noreferrer"><img src="https://media.licdn.com/dms/image/v2/D4E0BAQHJ0FZruc6k0Q/company-logo_200_200/B4EZkwq5SrKcAI-/0/1757458175427/reve_art_logo?e=2147483647&v=beta&t=Zj5RyWx5VbQUwj0QZ3Nd3PC686YJrs-6O7FzK1hB2jQ" alt="Reve" width="28" height="28" /></a>
<a href="https://www.freepik.com" title="Freepik" target="_blank" rel="noopener noreferrer"><img src="https://cdn.freebiesupply.com/logos/large/2x/freepik-logo-png-transparent.png" alt="Freepik" width="28" height="28" /></a>
<a href="https://www.ai21.com" title="AI21" target="_blank" rel="noopener noreferrer"><img src="https://media.licdn.com/dms/image/v2/D4D0BAQGi7Q43f9KESg/company-logo_200_200/B4DZu2qBPvJgAI-/0/1768296027620/ai21_logo?e=2147483647&v=beta&t=wR4j-IVlUaQA18d3_P0uJo4dXht0PvhowIC_vAuqXFo" alt="AI21" width="28" height="28" /></a>
<a href="https://www.cloudrift.ai" title="CloudRift" target="_blank" rel="noopener noreferrer"><img src="https://pbs.twimg.com/profile_images/1956487392204111872/IJ0Xu1b3_400x400.jpg" alt="CloudRift" width="28" height="28" /></a>
<a href="https://www.baseten.co" title="Baseten" target="_blank" rel="noopener noreferrer"><img src="https://media.licdn.com/dms/image/v2/D4E0BAQErc_txZeY4KQ/company-logo_200_200/B4EZbpF.n_HAAI-/0/1747667381016/baseten_logo?e=2147483647&v=beta&t=0GAeyVAJ8A3jjAnI7JBzLCYiFHQrq3EicZwidL9AALo" alt="Baseten" width="28" height="28" /></a>
<a href="https://en.wikipedia.org/wiki/Echo_Protocol" title="Echo" target="_blank" rel="noopener noreferrer"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=" alt="Echo" width="28" height="28" /></a>
<a href="https://tinfoil.sh" title="Tinfoil" target="_blank" rel="noopener noreferrer"><img src="https://mintcdn.com/tinfoil/0ViQTbwRCR_TUpT7/logo/dark.png?fit=max&auto=format&n=0ViQTbwRCR_TUpT7&q=85&s=4286f60f42762cf23a4354c8e52f888b" alt="Tinfoil" width="28" height="28" /></a>
<a href="https://nebius.com" title="Nebius" target="_blank" rel="noopener noreferrer"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKRoO9XCNhc_7_DVpQm8BsTL_oVF6q57IZPA&s" alt="Nebius" width="28" height="28" /></a>
<a href="https://audixa.ai" title="Audixa" target="_blank" rel="noopener noreferrer"><img src="https://cdn.audixa.ai/brand.png" alt="Audixa" width="28" height="28" /></a>
<a href="https://klingai.com" title="KlingAI" target="_blank" rel="noopener noreferrer"><img src="https://cdn.prod.website-files.com/65b8f370a600366bc7cf9b20/6718d0e02f90eca5abe33eed_ddd.png" alt="KlingAI" width="28" height="28" /></a>
<a href="https://www.vidu.com" title="Vidu" target="_blank" rel="noopener noreferrer"><img src="https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/vidu-color.png" alt="Vidu" width="28" height="28" /></a>
<a href="https://deepinfra.com" title="DeepInfra" target="_blank" rel="noopener noreferrer"><img src="https://avatars.githubusercontent.com/u/116928265?s=280&v=4" alt="DeepInfra" width="28" height="28" /></a>
<a href="https://www.nvidia.com" title="NVIDIA" target="_blank" rel="noopener noreferrer"><img src="https://www.citypng.com/public/uploads/preview/hd-nvidia-eye-logo-icon-png-701751694965655t2lbe7yugk.png" alt="NVIDIA" width="28" height="28" /></a>
<a href="https://runware.ai" title="Runware" target="_blank" rel="noopener noreferrer"><img src="https://media.licdn.com/dms/image/v2/D4E0BAQFzsJTSfpkCbQ/company-logo_200_200/B4EZfR3QUwGcAQ-/0/1751572612962/runware_logo?e=2147483647&v=beta&t=HvfRm7Kk85KGMPVDzoiTBWuFN9v5bnyFSRvPuie2BBQ" alt="Runware" width="28" height="28" /></a>
<a href="https://canopywave.com" title="CanopyWave" target="_blank" rel="noopener noreferrer"><img src="https://canopywave.com/canopy.png" alt="CanopyWave" width="28" height="28" /></a>
<a href="https://www.alibaba.com" title="Alibaba" target="_blank" rel="noopener noreferrer"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcREXxWppPgNoDOukU_2RHGUnoU-_i664iBN5w&s" alt="Alibaba" width="28" height="28" /></a>
<a href="https://www.cirrascale.com" title="Cirrascale" target="_blank" rel="noopener noreferrer"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsw2BACdjpHicnOtmnwkxEAJj6lyVMrNUcHw&s" alt="Cirrascale" width="28" height="28" /></a>
<a href="https://inference.net" title="Inferencenet" target="_blank" rel="noopener noreferrer"><img src="https://media.licdn.com/dms/image/v2/D560BAQGxl6yWZL2F7w/company-logo_200_200/B56ZT34NF3GQAM-/0/1739325493857/kuzco_xyz_logo?e=2147483647&v=beta&t=80Ojsf4X0HWDwKBt9Hfz4q0mRkD7BaNP34GaazC3nQQ" alt="Inferencenet" width="28" height="28" /></a>
<a href="https://telnyx.com" title="Telnyx" target="_blank" rel="noopener noreferrer"><img src="https://avatars.githubusercontent.com/u/10522416?s=200&v=4" alt="Telnyx" width="28" height="28" /></a>
<a href="https://stability.ai" title="StabilityAI" target="_blank" rel="noopener noreferrer"><img src="https://media.licdn.com/dms/image/v2/D560BAQGCth_DU2z1Fg/company-logo_200_200/B56Zh18sPOHMAU-/0/1754325501246/stability_ai_logo?e=2147483647&v=beta&t=K2vnKQAZRmg2Nqe0fJY7sYHDbLA752NOG1E45JbZC5s" alt="StabilityAI" width="28" height="28" /></a>
<a href="https://novita.ai" title="Novita" target="_blank" rel="noopener noreferrer"><img src="https://media.licdn.com/dms/image/v2/D560BAQG04_X3qbYWrg/company-logo_200_200/company-logo_200_200/0/1737460982063/novita_ai_labs_logo?e=2147483647&v=beta&t=PP0ulFsya1NvYiEtpQDIdmmnEfbrQ03kl6XA7TT1pJ0" alt="Novita" width="28" height="28" /></a>
<a href="https://speechify.com" title="Speechify" target="_blank" rel="noopener noreferrer"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Speechify-logo.svg/250px-Speechify-logo.svg.png" alt="Speechify" width="28" height="28" /></a>
<a href="https://www.scaleway.com" title="Scaleway" target="_blank" rel="noopener noreferrer"><img src="https://pcr.cloud-mercato.com/static/img/logo/scaleway.png" alt="Scaleway" width="28" height="28" /></a>
<a href="https://sambanova.ai" title="SambaNova" target="_blank" rel="noopener noreferrer"><img src="https://sambanova.ai/hubfs/logotype_sambanova_orange.png" alt="SambaNova" width="28" height="28" /></a>
<a href="https://ttsreader.com" title="TTSReader" target="_blank" rel="noopener noreferrer"><img src="https://ttsreader.com/android-chrome-512x512.png" alt="TTSReader" width="28" height="28" /></a>
<a href="https://verda.com" title="Verda" target="_blank" rel="noopener noreferrer"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSLDvVEuW0laXWa1GuUxB6U9Of-yhQiXJ3bLw&s" alt="Verda" width="28" height="28" /></a>
<a href="https://fireworks.ai" title="Fireworks" target="_blank" rel="noopener noreferrer"><img src="https://images.crunchbase.com/image/upload/c_pad,f_auto,q_auto:eco,dpr_1/xgb8cpbz7pcvovoowrmk?ik-sanitizeSvg=true" alt="Fireworks" width="28" height="28" /></a>
<a href="https://www.cerebras.ai" title="Cerebras" target="_blank" rel="noopener noreferrer"><img src="https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/cerebras-color.png" alt="Cerebras" width="28" height="28" /></a>
<a href="https://z.ai" title="Zai" target="_blank" rel="noopener noreferrer"><img src="https://avatars.githubusercontent.com/u/223098841?s=200&v=4" alt="Zai" width="28" height="28" /></a>
<a href="https://www.hyperbolic.ai" title="Hyperbolic" target="_blank" rel="noopener noreferrer"><img src="https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/hyperbolic-color.png" alt="Hyperbolic" width="28" height="28" /></a>
<a href="https://elevenlabs.io" title="ElevenLabs" target="_blank" rel="noopener noreferrer"><img src="https://help.elevenlabs.io/hc/theming_assets/01HZQ08B6SDY5X53YN9ABG4B99" alt="ElevenLabs" width="28" height="28" /></a>
</p>

<details>
<summary><strong>Accessibility fallback (alphabetical provider links)</strong></summary>

[302AI](https://302.ai) · [AI21](https://www.ai21.com) · [AIML](https://aimlapi.com) · [Alibaba](https://www.alibaba.com) · [Anthropic](https://www.anthropic.com) · [ARKLabs](https://ark-labs.cloud) · [AssemblyAI](https://www.assemblyai.com) · [AsyncAI](https://www.asyncapi.com) · [Audixa](https://audixa.ai) · [Azure](https://azure.microsoft.com)
[Baseten](https://www.baseten.co) · [BergetAI](https://berget.ai) · [Bria](https://bria.ai) · [BytePlus](https://byteplus.com) · [Bytez](https://bytez.com) · [CanopyWave](https://canopywave.com) · [Cerebras](https://www.cerebras.ai) · [Cirrascale](https://www.cirrascale.com) · [CloudRift](https://www.cloudrift.ai) · [Cohere](https://cohere.com)
[CometAPI](https://www.cometapi.com) · [ContextualAI](https://contextual.ai) · [Cortecs](https://cortecs.ai) · [Decart](https://decart.ai) · [Deepbricks](https://deepbricks.ai) · [Deepgram](https://deepgram.com) · [DeepInfra](https://deepinfra.com) · [DeepL](https://www.deepl.com) · [DeepSeek](https://www.deepseek.com) · [Echo](https://en.wikipedia.org/wiki/Echo_Protocol)
[ElevenLabs](https://elevenlabs.io) · [Euqai](https://euqai.eu) · [EUrouter](https://www.eurouter.ai) · [Fireworks](https://fireworks.ai) · [Freepik](https://www.freepik.com) · [Friendli](https://friendli.ai) · [Gladia](https://www.gladia.io) · [GMICloud](https://www.gmicloud.ai) · [Google](https://ai.google) · [GoogleTranslate](https://translate.google.com)
[GreenPT](https://greenpt.ai) · [Groq](https://groq.com) · [GTranslate](https://github.com/d4n3436/GTranslate) · [HorayAI](https://www.horay.ai) · [Hyperbolic](https://www.hyperbolic.ai) · [Hyperstack](https://www.hyperstack.cloud) · [Inferencenet](https://inference.net) · [Inworld](https://inworld.ai) · [IONOS](https://cloud.ionos.com) · [Jina](https://jina.ai)
[JSON2Video](https://json2video.com) · [KernelMemory](https://github.com/microsoft/kernel-memory) · [KlingAI](https://klingai.com) · [LectoAI](https://lecto.ai) · [Lingvanex](https://lingvanex.com) · [MatterAI](https://www.matterai.so) · [MiniMax](https://www.minimax.io) · [Mistral](https://mistral.ai) · [ModernMT](https://www.modernmt.com) · [Moonshot](https://www.moonshot.ai)
[MurfAI](https://murf.ai) · [Nebius](https://nebius.com) · [Nextbit](https://www.nextbit256.com) · [NLPCloud](https://nlpcloud.com) · [Novita](https://novita.ai) · [Nscale](https://www.nscale.com) · [NVIDIA](https://www.nvidia.com) · [OpenAI](https://openai.com) · [OpenRouter](https://openrouter.ai) · [OpperAI](https://opper.ai)
[OVHcloud](https://www.ovhcloud.com) · [Perplexity](https://www.perplexity.ai) · [Pollinations](https://pollinations.ai) · [Portkey](https://portkey.ai) · [PrimeIntellect](https://www.primeintellect.ai) · [PublicAI](https://publicai.co) · [Recraft](https://www.recraft.ai) · [RegoloAI](https://regolo.ai) · [RekaAI](https://reka.ai) · [RelaxAI](https://relax.ai)
[Replicate](https://replicate.com) · [Requesty](https://www.requesty.ai) · [ResembleAI](https://www.resemble.ai) · [Reve](https://app.reve.com) · [Runware](https://runware.ai) · [Runway](https://runwayml.com) · [SambaNova](https://sambanova.ai) · [Sarvam](https://www.sarvam.ai) · [Scaleway](https://www.scaleway.com) · [Segmind](https://www.segmind.com)
[SiliconFlow](https://www.siliconflow.com) · [Speechify](https://speechify.com) · [Speechmatics](https://www.speechmatics.com) · [StabilityAI](https://stability.ai) · [Sudo](https://sudoapp.dev) · [SunoAPI](https://sunoapi.org) · [Synexa](https://synexa.ai) · [Telnyx](https://telnyx.com) · [Tinfoil](https://tinfoil.sh) · [Together](https://www.together.ai)
[TTSReader](https://ttsreader.com) · [Upstage](https://www.upstage.ai) · [Verda](https://verda.com) · [Vidu](https://www.vidu.com) · [VoyageAI](https://www.voyageai.com) · [xAI](https://x.ai) · [Zai](https://z.ai)

</details>
<!-- PROVIDER_LOGO_GRID_END -->

## Getting started (optional, for local/self-hosted use)

1. Clone and install:

   ```bash
   git clone https://github.com/achappey/aihappey-chat.git
   cd aihappey-chat
   npm install
   ```

2. Configure environment:

   ```bash
   cd samples/chathappey
   copy .env.example .env
   ```

3. Run the sample app:

   ```bash
   npm run dev
   ```

4. In a second terminal:

   ```bash
   cd samples/chathappey
   npm run serve
   ```

See [`samples/chathappey/.env.example`](samples/chathappey/.env.example) for all available variables.

## Backend compatibility

This repository is **client-side only** and expects compatible backends:

- Vercel AI SDK compatible streaming chat backend (`POST /api/chat`)
- Vercel AI SDK compatible streaming agent backend (optional)
- Backend for MCP sampling calls
- MCP server for chat functionality

Optional backends:

- Remote conversation storage backend
- Transcription backend
- Entra ID authentication backend

## Configuration

Key `.env` variables:

- `CHAT_API_URL`: chat backend endpoint (Vercel AI SDK compatible)
- `AGENT_ENDPOINT`: agent backend base URL (UI calls `${AGENT_ENDPOINT}/api/chat` in agent mode)
- `CHAT_APP_MCP`: MCP server URL
- `MODELS_API_URL`: model catalog endpoint
- `SAMPLING_API_URL`: backend for MCP sampling calls (optional)
- `CONVERSATIONS_API_URL`: remote conversation storage backend (optional)
- `TRANSCRIPTION_API`: transcription backend (optional)

See [`samples/chathappey/.env.example`](samples/chathappey/.env.example) for the complete list.

## Developer notes

- Core chat integration is built around Vercel AI SDK primitives.
- `useChat` is re-exported via [`packages/aihappey-ai/src/index.ts`](packages/aihappey-ai/src/index.ts).
- Main wiring happens in [`packages/aihappey-core/src/features/chat/engine/VercelChatInner.tsx`](packages/aihappey-core/src/features/chat/engine/VercelChatInner.tsx).

Monorepo highlights:

- [`packages/aihappey-core`](packages/aihappey-core): runtime logic and rich content
- [`packages/aihappey-components`](packages/aihappey-components): reusable UI components
- [`packages/aihappey-mcp`](packages/aihappey-mcp): MCP client
- [`samples/chathappey`](samples/chathappey): reference app
- [`samples/bootstrap-sample`](samples/bootstrap-sample): Bootstrap-flavored sample

