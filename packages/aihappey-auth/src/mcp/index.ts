import {
  initiateOAuthFlow,
  handleOAuthCallback,
  saveAccessToken,
  getAccessToken,
  clearAccessToken,
  createPkceChallenge,
} from "./oauthClient";
import { IAuthStorage } from "../config/types";

/**
 * Thin re-exports for MCP OAuth helpers.
 * All functions require explicit storage argument for testability.
 */

export {
  initiateOAuthFlow,
  handleOAuthCallback,
  saveAccessToken,
  getAccessToken,
  clearAccessToken,
  createPkceChallenge,
  IAuthStorage,
};
