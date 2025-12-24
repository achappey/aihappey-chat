import { LibraryHeader } from "./LibraryHeader";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import { ImageGrid } from "aihappey-components";
import { useLibraryImages } from "./useLibraryImages";

export const LibraryPage = () => {
  const images = useLibraryImages();
  const isDesktop = useIsDesktop();

  return (
    <div
      style={{
        background: "transparent",
        width: "100%",
      }}
    >
      <LibraryHeader />
      <div
        style={{
          maxWidth: "100%",
          margin: "0 auto",
          display: "flex",
          padding: "0px 12px",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <ImageGrid
          items={images.map((item) => ({
            data: item.data,
            mimeType: item.mimeType,
            type: "image",
          }))}
          columns={isDesktop ? 5 : 2}
          gap="1rem"
          fit="cover"
          shape="square"
          shadow
          style={{ width: "100%" }}
        />
      </div>
    </div >
  );
};
