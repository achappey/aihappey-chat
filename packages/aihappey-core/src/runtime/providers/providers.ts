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
import { orqrouter } from "./catalog/orqrouter";
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
import { apiyi } from "./catalog/apiyi";
import { widnai } from "./catalog/widnai";
import { thaura } from "./catalog/thaura";
import { modal } from "./catalog/modal";
import { apifree } from "./catalog/apifree";
import { modelslab } from "./catalog/modelslab";
import { hicap } from "./catalog/hicap";
import { prakasa } from "./catalog/prakasa";
import { megallm } from "./catalog/megallm";
import { infron } from "./catalog/infron";
import { longcat } from "./catalog/longcat";
import { aisa } from "./catalog/aisa";
import { evolinkai } from "./catalog/evolinkai";
import { zenlayer } from "./catalog/zenlayer";
import { aihubmix } from "./catalog/aihubmix";
import { uniapi } from "./catalog/uniapi";
import { openaihk } from "./catalog/openaihk";
import { aiforhire } from "./catalog/aiforhire";
import { apekey } from "./catalog/apekey";
import { apertis } from "./catalog/apertis";
import { wisdomgate } from "./catalog/wisdomgate";
import { smooth } from "./catalog/smooth";
import { speechactors } from "./catalog/speechactors";
import { gptproto } from "./catalog/gptproto";
import { neosantara } from "./catalog/neosantara";
import { redpill } from "./catalog/redpill";
import { blazerail } from "./catalog/blazerail";
import { aether } from "./catalog/aether";
import { regraph } from "./catalog/regraph";
import { electronhub } from "./catalog/electronhub";
import { dandolo } from "./catalog/dandolo";
import { glio } from "./catalog/glio";
import { pixeldojo } from "./catalog/pixeldojo";
import { navyai } from "./catalog/navyai";
import { nearai } from "./catalog/nearai";
import { parallel } from "./catalog/parallel";
import { nanogpt } from "./catalog/nanogpt";
import { aibramha } from "./catalog/aibramha";
import { ghostbot } from "./catalog/ghostbot";
import { routmy } from "./catalog/routmy";
import { poe } from "./catalog/poe";
import { askarc } from "./catalog/askarc";
import { synthetic } from "./catalog/synthetic";
import { renderful } from "./catalog/renderful";
import { tigercity } from "./catalog/tigercity";
import { kittenstack } from "./catalog/kittenstack";
import { packetai } from "./catalog/packetai";
import { edenai } from "./catalog/edenai";
import { websearchapi } from "./catalog/websearchapi";
import { nimbleway } from "./catalog/nimbleway";
import { eachlabs } from "./catalog/eachlabs";
import { laozhang } from "./catalog/laozhang";
import { valyu } from "./catalog/valyu";
import { jiekouai } from "./catalog/jiekouai";
import { syllogy } from "./catalog/syllogy";
import { literouter } from "./catalog/literouter";
import { arwriter } from "./catalog/arwriter";
import { qiniu } from "./catalog/qiniu";
import { lunos } from "./catalog/lunos";
import { maritacaai } from "./catalog/maritacaai";
import { cloudferro } from "./catalog/cloudferro";
import { arliai } from "./catalog/arliai";
import { dataforseo } from "./catalog/dataforseo";
import { jigsawstack } from "./catalog/jigsawstack";
import { ishi } from "./catalog/ishi";
import { payperq } from "./catalog/payperq";
import { swarms } from "./catalog/swarms";
import { docsrouter } from "./catalog/docsrouter";
import { skillboss } from "./catalog/skillboss";
import { ocrskill } from "./catalog/ocrskill";
import { nexusify } from "./catalog/nexusify";
import { jatevo } from "./catalog/jatevo";
import { litai } from "./catalog/litai";
import { pixcode } from "./catalog/pixcode";
import { answira } from "./catalog/answira";
import { anannas } from "./catalog/anannas";
import { apipod } from "./catalog/apipod";
import { tokenflux } from "./catalog/tokenflux";
import { aimo } from "./catalog/aimo";
import { lemondata } from "./catalog/lemondata";
import { fullai } from "./catalog/fullai";
import { assisters } from "./catalog/assisters";
import { llmwise } from "./catalog/llmwise";
import { casedev } from "./catalog/casedev";
import { smartaipi } from "./catalog/smartaipi";
import { apiairforce } from "./catalog/apiairforce";
import { lava } from "./catalog/lava";
import { multiverseai } from "./catalog/multiverseai";
import { modelrouter } from "./catalog/modelrouter";
import { llmpath } from "./catalog/llmpath";
import { maximoai } from "./catalog/maximoai";
import { rime } from "./catalog/rime";
import { noiz } from "./catalog/noiz";
import { gradium } from "./catalog/gradium";
import { voiceai } from "./catalog/voiceai";
import { ionrouter } from "./catalog/ionrouter";
import { freedomgpt } from "./catalog/freedomgpt";
import { pixia } from "./catalog/pixia";
import { aisieure } from "./catalog/aisieure";
import { kirha } from "./catalog/kirha";
import { sufy } from "./catalog/sufy";
import { llmhubifs } from "./catalog/llmhubifs";
import { logicosllmhub } from "./catalog/logicosllmhub";
import { shuttleai } from "./catalog/shuttleai";
import { alphaneural } from "./catalog/alphaneural";
import { routstr } from "./catalog/routstr";
import { writer } from "./catalog/writer";
import { glama } from "./catalog/glama";
import { hanzo } from "./catalog/hanzo";
import { setapp } from "./catalog/setapp";
import { surfercloud } from "./catalog/surfercloud";
import { claudible } from "./catalog/claudible";
import { embraceableai } from "./catalog/embraceableai";
import { brainiall } from "./catalog/brainiall";
import { agabeyogluai } from "./catalog/agabeyogluai";
import { airouter } from "./catalog/airouter";
import { agentics } from "./catalog/agentics";
import { gatewayz } from "./catalog/gatewayz";
import { uplinkapi } from "./catalog/uplinkapi";
import { nrpnautilus } from "./catalog/nrpnautilus";
import { eagm } from "./catalog/eagm";
import { edgee } from "./catalog/edgee";
import { viablelab } from "./catalog/viablelab";
import { dreamgen } from "./catalog/dreamgen";
import { llm7 } from "./catalog/llm7";
import { kimik2 } from "./catalog/kimik2";
import { keyplex } from "./catalog/keyplex";
import { llmkiwi } from "./catalog/llmkiwi";
import { cheapgrok } from "./catalog/cheapgrok";
import { lexi } from "./catalog/lexi";
import { eliza } from "./catalog/eliza";
import { openlimits } from "./catalog/openlimits";
import { arkroute } from "./catalog/arkroute";
import { aibadgr } from "./catalog/aibadgr";
import { ainative } from "./catalog/ainative";
import { unbound } from "./catalog/unbound";
import { shakespeare } from "./catalog/shakespeare";
import { corriente } from "./catalog/corriente";
import { cline } from "./catalog/cline";
import { bazaarlink } from "./catalog/bazaarlink";
import { puter } from "./catalog/puter";
import { routeplex } from "./catalog/routeplex";
import { novai } from "./catalog/novai";
import { lumenfall } from "./catalog/lumenfall";
import { fal } from "./catalog/fal";
import { jkaihub } from "./catalog/jkaihub";
import { mia21 } from "./catalog/mia21";
import { textsynth } from "./catalog/textsynth";
import { modelsync } from "./catalog/modelsync";
import { huggingface } from "./catalog/huggingface";
import { ezai } from "./catalog/ezai";
import { martian } from "./catalog/martian";
import { askcodi } from "./catalog/askcodi";
import { gonkagate } from "./catalog/gonkagate";
import { agentaigateway } from "./catalog/agentaigateway";
import { aicredits } from "./catalog/aicredits";
import { fastrouter } from "./catalog/fastrouter";
import { dubrify } from "./catalog/dubrify";
import { andyapi } from "./catalog/andyapi";
import { aki } from "./catalog/aki";
import { getgoapi } from "./catalog/getgoapi";
import { blockrun } from "./catalog/blockrun";
import { neuralwatt } from "./catalog/neuralwatt";
import { toapis } from "./catalog/toapis";
import { onekey } from "./catalog/onekey";
import { atxp } from "./catalog/atxp";
import { nagaai } from "./catalog/nagaai";
import { sargalay } from "./catalog/sargalay";
import { zeabur } from "./catalog/zeabur";
import { inferlink } from "./catalog/inferlink";
import { chainhub } from "./catalog/chainhub";
import { clawswitch } from "./catalog/clawswitch";
import { ultrasafe } from "./catalog/ultrasafe";
import { llmcloud } from "./catalog/llmcloud";
import { railwail } from "./catalog/railwail";
import { knoxchat } from "./catalog/knoxchat";
import { vlmrun } from "./catalog/vlmrun";
import { vogent } from "./catalog/vogent";
import { preapi } from "./catalog/preapi";
import { yougetai } from "./catalog/yougetai";
import { tikhubai } from "./catalog/tikhubai";
import { elkapi } from "./catalog/elkapi";
import { vultr } from "./catalog/vultr";
import { ofoxai } from "./catalog/ofoxai";
import { dedaluslabs } from "./catalog/dedaluslabs";
import { world3 } from "./catalog/world3";
import { voidai } from "./catalog/voidai";
import { modelmax } from "./catalog/modelmax";
import { yollomi } from "./catalog/yollomi";
import { infercom } from "./catalog/infercom";
import { raxai } from "./catalog/raxai";
import { aiduet } from "./catalog/aiduet";
import { piapi } from "./catalog/piapi";
import { youcom } from "./catalog/youcom";
import { iapp } from "./catalog/iapp";
import { oodaai } from "./catalog/oodaai";
import { stealthgpt } from "./catalog/stealthgpt";
import { jassieai } from "./catalog/jassieai";
import { messari } from "./catalog/messari";
import { memoryrouter } from "./catalog/memoryrouter";
import { imagerouter } from "./catalog/imagerouter";
import { cailos } from "./catalog/cailos";
import { codexforme } from "./catalog/codexforme";
import { runapi } from "./catalog/runapi";
import { gaterouter } from "./catalog/gaterouter";
import { baseapi } from "./catalog/baseapi";
import { yyclaw } from "./catalog/yyclaw";
import { teamday } from "./catalog/teamday";
import { oxoapi } from "./catalog/oxoapi";
import { chutes } from "./catalog/chutes";
import { vivgrid } from "./catalog/vivgrid";
import { ambient } from "./catalog/ambient";
import { xiaomimimo } from "./catalog/xiaomimimo";
import { ollama } from "./catalog/ollama";
import { switchpointai } from "./catalog/switchpointai";
import { relace } from "./catalog/relace";
import { inflection } from "./catalog/inflection";
import { langdb } from "./catalog/langdb";
import { morph } from "./catalog/morph";
import { baidu } from "./catalog/baidu";
import { streamlake } from "./catalog/streamlake";
import { akashml } from "./catalog/akashml";
import { embyai } from "./catalog/embyai";
import { cortex } from "./catalog/cortex";
import { perceptron } from "./catalog/perceptron";
import { mulerun } from "./catalog/mulerun";
import { sudorouter } from "./catalog/sudorouter";
import { clauddy } from "./catalog/clauddy";
import { selinaai } from "./catalog/selinaai";
import { lmrouter } from "./catalog/lmrouter";
import { openpipe } from "./catalog/openpipe";
import { nonkycai } from "./catalog/nonkycai";
import { clawplaza } from "./catalog/clawplaza";
import { tokonlab } from "./catalog/tokonlab";
import { modelbridge } from "./catalog/modelbridge";
import { simplellm } from "./catalog/simplellm";
import { privatemode } from "./catalog/privatemode";
import { tensorix } from "./catalog/tensorix";
import { schatziai } from "./catalog/schatziai";
import { nodebyt } from "./catalog/nodebyt";
import { gptsapi } from "./catalog/gptsapi";
import { orqagentruntime } from "./catalog/orqagentruntime";
import { embercloud } from "./catalog/embercloud";
import { fortytwo } from "./catalog/fortytwo";
import { oraicle } from "./catalog/oraicle";
import { foureverland } from "./catalog/foureverland";
import { distributeai } from "./catalog/distributeai";
import { wesenai } from "./catalog/wesenai";
import { key4u } from "./catalog/key4u";
import { fivedock } from "./catalog/fivedock";
import { magisterium } from "./catalog/magisterium";
import { lacesse } from "./catalog/lacesse";
import { uncensoredchat } from "./catalog/uncensoredchat";
import { orbgpu } from "./catalog/orbgpu";
import { opengateway } from "./catalog/opengateway";
import { applingo } from "./catalog/applingo";
import { omniakey } from "./catalog/omniakey";
import { nebulablock } from "./catalog/nebulablock";
import { mumeai } from "./catalog/mumeai";
import { nouswise } from "./catalog/nouswise";
import { shengsuanyun } from "./catalog/shengsuanyun";
import { opensourceaihub } from "./catalog/opensourceaihub";

/**
 * UI-facing provider catalog.
 *
 * Keys are stable identifiers (used in settings and metadata buckets).
 */
export const PROVIDERS: Record<string, Provider> = {
  openai,
  runway,
  mumeai,
  nebulablock,
  clawplaza,
  shengsuanyun,
  opensourceaihub,
  omniakey,
  nouswise,
  distributeai,
  orbgpu,
  embercloud,
  key4u,
  opengateway,
  applingo,
  tokonlab,
  foureverland,
  fivedock,
  schatziai,
  privatemode,
  fortytwo,
  simplellm,
  wesenai,
  oraicle,
  gptsapi,
  modelbridge,
  openpipe,
  magisterium,
  agabeyogluai,
  nonkycai,
  tensorix,
  embyai,
  lmrouter,
  lacesse,
  uncensoredchat,
  selinaai,
  clauddy,
  sudorouter,
  mulerun,
  baidu,
  perceptron,
  cortex,
  akashml,
  morph,
  streamlake,
  runapi,
  langdb,
  inflection,
  relace,
  switchpointai,
  ollama,
  xiaomimimo,
  vivgrid,
  chutes,
  ambient,
  codexforme,
  baseapi,
  oxoapi,
  preapi,
  teamday,
  jassieai,
  voidai,
  cailos,
  imagerouter,
  gaterouter,
  ultrasafe,
  yyclaw,
  memoryrouter,
  messari,
  oodaai,
  dedaluslabs,
  stealthgpt,
  ofoxai,
  world3,
  yougetai,
  yollomi,
  elkapi,
  vultr,
  tikhubai,
  inferlink,
  knoxchat,
  vlmrun,
  raxai,
  vogent,
  aicredits,
  llmcloud,
  cheapgrok,
  railwail,
  chainhub,
  clawswitch,
  zeabur,
  neuralwatt,
  youcom,
  aiduet,
  infercom,
  atxp,
  sargalay,
  piapi,
  nagaai,
  fastrouter,
  novai,
  andyapi,
  onekey,
  toapis,
  iapp,
  blockrun,
  getgoapi,
  gonkagate,
  aki,
  kimik2,
  agentaigateway,
  ezai,
  dubrify,
  askcodi,
  martian,
  huggingface,
  textsynth,
  keyplex,
  modelsync,
  jkaihub,
  fal,
  agentics,
  lumenfall,
  puter,
  routeplex,
  nrpnautilus,
  bazaarlink,
  llmkiwi,
  viablelab,
  llm7,
  dreamgen,
  unbound,
  uplinkapi,
  airouter,
  edgee,
  corriente,
  cline,
  shakespeare,
  ainative,
  gatewayz,
  lexi,
  eagm,
  setapp,
  verbatik,
  aibadgr,
  brainiall,
  surfercloud,
  openlimits,
  arkroute,
  eliza,
  embraceableai,
  ionrouter,
  claudible,
  llmwise,
  hanzo,
  glama,
  aisieure,
  ocrskill,
  writer,
  routstr,
  alphaneural,
  voiceai,
  freedomgpt,
  shuttleai,
  pixia,
  llmpath,
  logicosllmhub,
  llmhubifs,
  noiz,
  sufy,
  mia21,
  gradium,
  apiairforce,
  arliai,
  rime,
  kirha,
  maximoai,
  modelrouter,
  lava,
  casedev,
  multiverseai,
  smartaipi,
  assisters,
  apipod,
  fullai,
  aimo,
  litai,
  lemondata,
  nexusify,
  docsrouter,
  tokenflux,
  anannas,
  answira,
  jatevo,
  skillboss,
  ishi,
  pixcode,
  payperq,
  swarms,
  infron,
  edenai,
  maritacaai,
  dataforseo,
  kittenstack,
  cloudferro,
  jigsawstack,
  eachlabs,
  aiforhire,
  nimbleway,
  packetai,
  synthetic,
  longcat,
  renderful,
  apekey,
  askarc,
  poe,
  ghostbot,
  openaihk,
  aisa,
  everypixellabs,
  routmy,
  evolinkai,
  prakasa,
  aibramha,
  websearchapi,
  nanogpt,
  pixeldojo,
  uniapi,
  parallel,
  aihubmix,
  megallm,
  apifree,
  unrealspeech,
  tigercity,
  astica,
  hicap,
  modelslab,
  zenlayer,
  thaura,
  arwriter,
  quiverai,
  navyai,
  apertis,
  modal,
  nearai,
  aiml,
  smooth,
  wisdomgate,
  supertone,
  anthropic,
  heygen,
  ionet,
  euqai,
  glio,
  orqrouter,
  dandolo,
  forefront,
  literouter,
  widnai,
  orqagentruntime,
  syllogy,
  typecast,
  jiekouai,
  qiniu,
  uvoiceai,
  vapi,
  lovo,
  laozhang,
  valyu,
  lunos,
  fishaudio,
  netmind,
  apiyi,
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
  regraph,
  nousresearch,
  bytez,
  morpheus,
  matterai,
  electronhub,
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
  aether,
  blackbox,
  primeintellect,
  inceptionlabs,
  aionlabs,
  blazerail,
  databricks,
  straico,
  blackforestlabs,
  resembleai,
  abliteration,
  truefoundry,
  inferencesh,
  redpill,
  browseruse,
  monica,
  lumaai,
  neosantara,
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
  modelmax,
  gptproto,
  runpod,
  kernelmemory,
  portkey,
  routeway,
  minimax,
  tetrate,
  sarvam,
  deepgram,
  speechactors,
  zyphra,
  nodebyt,
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

