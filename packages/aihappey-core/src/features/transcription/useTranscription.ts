import { createHttpClient } from "aihappey-http"; // Your custom client

export const useTranscription = (
  transcribeApi: string,
  getAccessToken?: () => Promise<string>
) => {
  // Function to upload file and get transcript
  const transcribe = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("audio", file);

      const client = createHttpClient({ getAccessToken });
      const response = await client.post<{ text: string }>(transcribeApi + "/transcribe", formData);

      return response.text || "";
    } catch (e: any) {
      return null;
    } finally {
    }
  };

  return { transcribe };
};
