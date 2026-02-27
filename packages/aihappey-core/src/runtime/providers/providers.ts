import type { Provider } from "aihappey-types";
import { openai } from "./catalog/openai";
import { runway } from "./catalog/runway";
import { aiml } from "./catalog/aiml";
import { anthropic } from "./catalog/anthropic";
import { google } from "./catalog/google";
import { mistral } from "./catalog/mistral";
import { cohere } from "./catalog/cohere";
import { groq } from "./catalog/groq";
import { xai } from "./catalog/xai";
import { together } from "./catalog/together";
import { pollinations } from "./catalog/pollinations";
import { perplexity } from "./catalog/perplexity";
import { jina } from "./catalog/jina";
import { nscale } from "./catalog/nscale";
import { resembleai } from "./catalog/resembleai";
import { assemblyai } from "./catalog/assemblyai";
import { kernelmemory } from "./catalog/kernelmemory";
import { minimax } from "./catalog/minimax";
import { sarvam } from "./catalog/sarvam";
import { deepgram } from "./catalog/deepgram";
import { speechmatics } from "./catalog/speechmatics";
import { voyageai } from "./catalog/voyageai";
import { contextualai } from "./catalog/contextualai";
import { replicate } from "./catalog/replicate";
import { async } from "./catalog/async";
import { azure } from "./catalog/azure";
import { deepseek } from "./catalog/deepseek";
import { cloudrift } from "./catalog/cloudrift";
import { baseten } from "./catalog/baseten";
import { speechify } from "./catalog/speechify";
import { echo } from "./catalog/echo";
import { tinfoil } from "./catalog/tinfoil";
import { nebius } from "./catalog/nebius";
import { deepinfra } from "./catalog/deepinfra";
import { nvidia } from "./catalog/nvidia";
import { runware } from "./catalog/runware";
import { canopywave } from "./catalog/canopywave";
import { alibaba } from "./catalog/alibaba";
import { inferencenet } from "./catalog/inferencenet";
import { telnyx } from "./catalog/telnyx";
import { stabilityai } from "./catalog/stabilityai";
import { novita } from "./catalog/novita";
import { scaleway } from "./catalog/scaleway";
import { sambanova } from "./catalog/sambanova";
import { fireworks } from "./catalog/fireworks";
import { cerebras } from "./catalog/cerebras";
import { zai } from "./catalog/zai";
import { hyperbolic } from "./catalog/hyperbolic";
import { ttsreader } from "./catalog/ttsreader";
import { elevenlabs } from "./catalog/elevenlabs";
import { hyperstack } from "./catalog/hyperstack";
import { gladia } from "./catalog/gladia";
import { verda } from "./catalog/verda";
import { audixa } from "./catalog/audixa";
import { freepik } from "./catalog/freepik";
import { ai21 } from "./catalog/ai21";
import { murfai } from "./catalog/murfai";
import { lingvanex } from "./catalog/lingvanex";
import { googletranslate } from "./catalog/googletranslate";
import { modernmt } from "./catalog/modernmt";
import { lectoai } from "./catalog/lectoai";
import { bria } from "./catalog/bria";
import { friendli } from "./catalog/friendli";
import { publicai } from "./catalog/publicai";
import { primeintellect } from "./catalog/primeintellect";
import { ovhcloud } from "./catalog/ovhcloud";
import { gtranslate } from "./catalog/gtranslate";
import { gmicloud } from "./catalog/gmicloud";
import { byteplus } from "./catalog/byteplus";
import { nlpcloud } from "./catalog/nlpcloud";
import { moonshot } from "./catalog/moonshot";
import { upstage } from "./catalog/upstage";
import { siliconflow } from "./catalog/siliconflow";
import { cirrascale } from "./catalog/cirrascale";
import { klingai } from "./catalog/klingai";
import { euqai } from "./catalog/euqai";
import { vidu } from "./catalog/vidu";
import { reve } from "./catalog/reve";
import { decart } from "./catalog/decart";
import { json2video } from "./catalog/json2video";
import { greenpt } from "./catalog/greenpt";
import { relaxai } from "./catalog/relaxai";
import { regoloai } from "./catalog/regoloai";
import { arklabs } from "./catalog/arklabs";
import { ionos } from "./catalog/ionos";
import { bergetai } from "./catalog/bergetai";
import { opperai } from "./catalog/opperai";
import { cortecs } from "./catalog/cortecs";
import { inworld } from "./catalog/inworld";
import { eurouter } from "./catalog/eurouter";
import { requesty } from "./catalog/requesty";
import { sudo } from "./catalog/sudo";
import { portkey } from "./catalog/portkey";
import { deepl } from "./catalog/deepl";
import { cometapi } from "./catalog/cometapi";
import { nextbit } from "./catalog/nextbit";
import { deepbricks } from "./catalog/deepbricks";
import { segmind } from "./catalog/segmind";
import { rekaai } from "./catalog/rekaai";
import { openrouter } from "./catalog/openrouter";
import { ai302 } from "./catalog/302ai";
import { matterai } from "./catalog/matterai";
import { bytez } from "./catalog/bytez";
import { sunoapi } from "./catalog/sunoapi";
import { horayai } from "./catalog/horayai";
import { synexa } from "./catalog/synexa";
import { recraft } from "./catalog/recraft";
import { atlascloud } from "./catalog/atlascloud";
import { bineric } from "./catalog/bineric";
import { digitalocean } from "./catalog/digitalocean";
import { gooseai } from "./catalog/gooseai";
import { supa } from "./catalog/supa";
import { runpod } from "./catalog/runpod";
import { meganova } from "./catalog/meganova";
import { llmgateway } from "./catalog/llmgateway";
import { abliteration } from "./catalog/abliteration";
import { amazonbedrock } from "./catalog/amazonbedrock";
import { parasail } from "./catalog/parasail";
import { mancerai } from "./catalog/mancerai";
import { kilo } from "./catalog/kilo";
import { helicone } from "./catalog/helicone";
import { nousresearch } from "./catalog/nousresearch";
import { paraloncloud } from "./catalog/paraloncloud";
import { asione } from "./catalog/asione";
import { apipie } from "./catalog/apipie";
import { stepfun } from "./catalog/stepfun";
import { sealion } from "./catalog/sealion";
import { tencenthunyuan } from "./catalog/tencenthunyuan";
import { deapi } from "./catalog/deapi";
import { infomaniak } from "./catalog/infomaniak";
import { tavily } from "./catalog/tavily";
import { opencode } from "./catalog/opencode";
import { haimaker } from "./catalog/haimaker";
import { straico } from "./catalog/straico";
import { monica } from "./catalog/monica";
import { cambai } from "./catalog/cambai";
import { morpheus } from "./catalog/morpheus";
import { arceeai } from "./catalog/arceeai";
import { exa } from "./catalog/exa";
import { featherless } from "./catalog/featherless";
import { blackbox } from "./catalog/blackbox";
import { ohmygpt } from "./catalog/ohmygpt";
import { ideogram } from "./catalog/ideogram";
import { pinecone } from "./catalog/pinecone";
import { zyphra } from "./catalog/zyphra";
import { picsart } from "./catalog/picsart";
import { azerion } from "./catalog/azerion";
import { blackforestlabs } from "./catalog/blackforestlabs";
import { aionlabs } from "./catalog/aionlabs";
import { lumaai } from "./catalog/lumaai";
import { truefoundry } from "./catalog/truefoundry";
import { databricks } from "./catalog/databricks";
import { browseruse } from "./catalog/browseruse";
import { inferencesh } from "./catalog/inferencesh";
import { crazyrouter } from "./catalog/crazyrouter";
import { infraxa } from "./catalog/infraxa";
import { inceptionlabs } from "./catalog/inceptionlabs";
import { daglo } from "./catalog/daglo";
import { opeai } from "./catalog/opeai";
import { forefront } from "./catalog/forefront";
import { aicc } from "./catalog/aicc";
import { yourvoic } from "./catalog/yourvoic";
import { fishaudio } from "./catalog/fishaudio";
import { lovo } from "./catalog/lovo";
import { verbatik } from "./catalog/verbatik";
import { cartesia } from "./catalog/cartesia";
import { vapi } from "./catalog/vapi";
import { smallestai } from "./catalog/smallestai";
import { orq } from "./catalog/orq";
import { typecast } from "./catalog/typecast";
import { unrealspeech } from "./catalog/unrealspeech";
import { kugu } from "./catalog/kugu";
import { everypixellabs } from "./catalog/everypixellabs";
import { supertone } from "./catalog/supertone";
import { uvoiceai } from "./catalog/uvoiceai";
import { astica } from "./catalog/astica";
import { heygen } from "./catalog/heygen";
import { ionet } from "./catalog/ionet";
import { avian } from "./catalog/avian";
import { llmapi } from "./catalog/llmapi";
import { llmlayer } from "./catalog/llmlayer";
import { simplismart } from "./catalog/simplismart";
import { chaingpt } from "./catalog/chaingpt";
import { routeway } from "./catalog/routeway";
import { cheapestinference } from "./catalog/cheapestinference";
import { tetrate } from "./catalog/tetrate";
import { clod } from "./catalog/clod";
import { github } from "./catalog/github";
import { wai } from "./catalog/wai";
import { venice } from "./catalog/venice";
import { quiverai } from "./catalog/quiverai";
import { kissapi } from "./catalog/kissapi";
import { zenmux } from "./catalog/zenmux";
import { netmind } from "./catalog/netmind";

/**
 * UI-facing provider catalog.
 *
 * Keys are stable identifiers (used in settings and metadata buckets).
 */
export const PROVIDERS: Record<string, Provider> = {
  openai,
  runway,
  verbatik,
  everypixellabs,
  unrealspeech,
  astica,
  quiverai,
  aiml,
  supertone,
  anthropic,
  heygen,
  ionet,
  euqai,
  orq,
  forefront,
  typecast,
  uvoiceai,
  vapi,
  lovo,
  fishaudio,
  netmind,
  kugu,
  zenmux,
  smallestai,
  rekaai,
  aicc,
  cartesia,
  yourvoic,
  google,
  segmind,
  mistral,
  lectoai,
  gmicloud,
  byteplus,
  cohere,
  modernmt,
  kissapi,
  groq,
  xai,
  together,
  googletranslate,
  infomaniak,
  siliconflow,
  deepbricks,
  ovhcloud,
  inworld,
  cometapi,
  arklabs,
  lingvanex,
  nextbit,
  cortecs,
  opperai,
  eurouter,
  upstage,
  deapi,
  ionos,
  bergetai,
  regoloai,
  pollinations,
  nlpcloud,
  hyperstack,
  requesty,
  recraft,
  perplexity,
  json2video,
  deepl,
  speechmatics,
  gtranslate,
  gooseai,
  synexa,
  moonshot,
  greenpt,
  decart,
  venice,
  relaxai,
  horayai,
  tencenthunyuan,
  digitalocean,
  atlascloud,
  bineric,
  parasail,
  asione,
  sealion,
  apipie,
  ideogram,
  mancerai,
  stepfun,
  helicone,
  jina,
  amazonbedrock,
  sunoapi,
  nousresearch,
  bytez,
  morpheus,
  matterai,
  ohmygpt,
  tavily,
  opeai,
  arceeai,
  daglo,
  paraloncloud,
  publicai,
  exa,
  nscale,
  kilo,
  featherless,
  openrouter,
  cambai,
  infraxa,
  ai302,
  crazyrouter,
  blackbox,
  primeintellect,
  inceptionlabs,
  aionlabs,
  databricks,
  straico,
  blackforestlabs,
  resembleai,
  abliteration,
  truefoundry,
  inferencesh,
  browseruse,
  monica,
  lumaai,
  meganova,
  haimaker,
  supa,
  llmgateway,
  github,
  assemblyai,
  gladia,
  clod,
  cheapestinference,
  wai,
  opencode,
  chaingpt,
  azerion,
  runpod,
  kernelmemory,
  portkey,
  routeway,
  minimax,
  tetrate,
  sarvam,
  sudo,
  deepgram,
  zyphra,
  pinecone,
  voyageai,
  friendli,
  picsart,
  bria,
  contextualai,
  murfai,
  replicate,
  simplismart,
  async,
  azure,
  deepseek,
  llmlayer,
  reve,
  freepik,
  ai21,
  avian,
  cloudrift,
  baseten,
  echo,
  tinfoil,
  llmapi,
  nebius,
  audixa,
  klingai,
  vidu,
  deepinfra,
  nvidia,
  runware,
  canopywave,
  alibaba,
  cirrascale,
  inferencenet,
  telnyx,
  stabilityai,
  novita,
  speechify,
  scaleway,
  sambanova,
  ttsreader,
  verda,
  fireworks,
  cerebras,
  zai,
  hyperbolic,
  elevenlabs,
} as const;

