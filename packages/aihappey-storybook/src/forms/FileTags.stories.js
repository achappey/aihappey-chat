import React, { useState } from "react";
import { FileTags } from "aihappey-components";

export default {
  title: "Forms/FileTags",
  component: FileTags,
};

export const Default = () => {
  const [files, setFiles] = useState([
    new File(["hello"], "example.txt"),
    new File(["world"], "notes.md"),
  ]);

  const removeFile = (name) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  return React.createElement(FileTags, {
    files,
    removeFile,
  });
};


export const Static = () =>
  React.createElement(FileTags, {
    files: [
      new File(["hello"], "example.txt"),
      new File(["world"], "notes.md"),
    ],
  });
export const ExtraSmall = () =>
  React.createElement(FileTags, {
    size: "extra-small",
    files: [
      new File(["hello"], "example.txt"),
      new File(["world"], "notes.md"),
    ],
  });

export const Small = () =>
  React.createElement(FileTags, {
    size: "small",
    files: [
      new File(["hello"], "example.txt"),
      new File(["world"], "notes.md"),
    ],
  });

export const Medium = () =>
  React.createElement(FileTags, {
    size: "medium",
    files: [
      new File(["hello"], "example.txt"),
      new File(["world"], "notes.md"),
    ],
  });

