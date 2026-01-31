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
import { asyncai } from "./catalog/asyncai";
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

/**
 * UI-facing provider catalog.
 *
 * Keys are stable identifiers (used in settings and metadata buckets).
 */
export const PROVIDERS: Record<string, Provider> = {
  openai,
  runway,
  aiml,
  anthropic,
  euqai,
  google,
  mistral,
  lectoai,
  gmicloud,
  byteplus,
  cohere,
  modernmt,
  groq,
  xai,
  together,
  googletranslate,
  siliconflow,
  ovhcloud,
  lingvanex,
  upstage,
  pollinations,
  nlpcloud,
  hyperstack,
  perplexity,
  speechmatics,
  gtranslate,
  moonshot,
  jina,
  publicai,
  nscale,
  primeintellect,
  resembleai,
  assemblyai,
  gladia,
  kernelmemory,
  minimax,
  sarvam,
  deepgram,
  voyageai,
  friendli,
  bria,
  contextualai,
  murfai,
  replicate,
  asyncai,
  azure,
  deepseek,
  freepik,
  ai21,
  cloudrift,
  baseten,
  echo,
  tinfoil,
  nebius,
  audixa,
  klingai,
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

