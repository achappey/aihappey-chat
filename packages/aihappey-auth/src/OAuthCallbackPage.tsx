import { useEffect, useState } from "react";
import { handleOAuthCallback } from "./mcp/oauthClient";
import { setMcpAccessToken } from "./mcp/helpers";
import { localStorageAuth } from "./storage/defaultStorage";
import { useNavigate } from "react-router";
import { useAppStore } from "aihappey-state";

const OAUTH_TARGET_URL_KEY = "mcp_oauth_target_url";

const OAuthCallbackPage = () => {
  const [status, setStatus] = useState<"pending" | "success" | "error">(
    "pending"
  );
  const [message, setMessage] = useState(
    "Processing authentication callback..."
  );
  const navigate = useNavigate();
  const setToken = useAppStore((a) => a.setToken);

  useEffect(() => {
    const processCallback = async () => {
      const result = await handleOAuthCallback(localStorageAuth);
      if ("error" in result) {
        setStatus("error");
        setMessage(
          `OAuth Error: ${result.error} - ${
            result.errorDescription || "Please try again."
          }`
        );
        localStorage.removeItem(OAUTH_TARGET_URL_KEY);
        sessionStorage.removeItem(OAUTH_TARGET_URL_KEY);
        return;
      }
      if (result.accessToken && result.targetUrl) {
        setMcpAccessToken(
          result.targetUrl,
          result.accessToken,
          localStorageAuth
        );
        setToken(result.targetUrl, result.accessToken);
        setStatus("success");
        setMessage("Authentication successful! Redirecting...");
        sessionStorage.removeItem(OAUTH_TARGET_URL_KEY);
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        setStatus("error");
        setMessage(
          "OAuth Error: Could not retrieve access token or target URL after callback."
        );
        if (
          localStorage.getItem(OAUTH_TARGET_URL_KEY) ||
          sessionStorage.getItem(OAUTH_TARGET_URL_KEY)
        ) {
          localStorage.removeItem(OAUTH_TARGET_URL_KEY);
          sessionStorage.removeItem(OAUTH_TARGET_URL_KEY);
        }
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    };
    processCallback();
  }, [navigate, setToken]);

  return (
    <div style={{ padding: 20, textAlign: "center", fontFamily: "sans-serif" }}>
      <h2>OAuth Authentication Callback</h2>
      <p>{message}</p>
      {status === "pending" && <p>Please wait...</p>}
      {status === "success" && (
        <p>
          If you are not redirected automatically, please{" "}
          <a href="/">click here to return to the application</a>.
        </p>
      )}
      {status === "error" && (
        <p>
          Please <a href="/">return to the application</a> and try again.
        </p>
      )}
    </div>
  );
};

export default OAuthCallbackPage;